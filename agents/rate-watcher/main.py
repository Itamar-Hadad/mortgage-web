"""
Rate Watcher Agent — רץ כל 3 ימים, משווה ריבית פריים + CPI מהשוק מול Firestore,
ושולח התראה למנהל אם יש פער מעל 0.1%.

הרצה ידנית:
    ANTHROPIC_API_KEY=... ADMIN_UID=... python main.py

הרצה מתוזמנת (Cloud Scheduler):
    python main.py  # (env vars מוגדרים בסביבה)
"""

import json
import os
import sys
import requests as http_requests

import firebase_admin
from firebase_admin import credentials, firestore as fb_firestore
from google.cloud.firestore import SERVER_TIMESTAMP

from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.tools import tool

# --- Firebase Admin init ---
_SA_PATH = os.path.join(os.path.dirname(__file__), "..", "explainer", "service-account.json")
_cred = credentials.Certificate(os.path.abspath(_SA_PATH))
firebase_admin.initialize_app(_cred)
_db = fb_firestore.client()

ADMIN_UID = os.environ.get("ADMIN_UID", "")
CHANGE_THRESHOLD = 0.1  # אחוז — פער קטן יותר מזה לא נחשב שינוי משמעותי


# ---------------------------------------------------------------------------
# Tool 1: fetch_market_rates
# ---------------------------------------------------------------------------

@tool()
def fetch_market_rates() -> str:
    """שלוף את ריבית הפריים העדכנית מבנק ישראל ואת מדד המחירים לצרכן מהלמ"ס.
    מחזיר JSON עם prime_rate ו-cpi_annual_pct. אם שליפה נכשלת — הערך יהיה null."""
    from bs4 import BeautifulSoup

    result = {"prime_rate": None, "cpi_annual_pct": None, "source": {}}
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

    # --- ריבית פריים מבנק ישראל (JSON API) ---
    try:
        # BOI Edge SDMX API — ריבית בנק ישראל (הפריים = ריבית בנ"י + 1.5%)
        boi_url = (
            "https://edge.boi.gov.il/FusionEdgeServer/sdmx/v2/data/dataflow/"
            "BOI.STATISTICS/BOI.CBI/1.0/RH05_D"
            "?startperiod=2025-01-01&format=jsondata"
        )
        resp = http_requests.get(boi_url, timeout=10, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            series_map = (
                data.get("data", {})
                    .get("dataSets", [{}])[0]
                    .get("series", {})
            )
            if series_map:
                obs = list(series_map.values())[0].get("observations", {})
                if obs:
                    last_val = obs[max(obs, key=lambda k: int(k))][0]
                    result["prime_rate"] = round(float(last_val) + 1.5, 4)
                    result["source"]["prime"] = "BOI SDMX API"
    except Exception as e:
        print(f"[rate-watcher] BOI API failed: {e}", file=sys.stderr)

    # fallback: scrape דף בנק ישראל
    if result["prime_rate"] is None:
        try:
            page = http_requests.get(
                "https://www.boi.org.il/he/monetarypolicy/interestrate/",
                timeout=10, headers=headers,
            )
            soup = BeautifulSoup(page.content, "html.parser")
            for tag in soup.find_all(["td", "span", "strong", "b"]):
                text = tag.get_text(strip=True).replace(",", ".")
                if "%" in text:
                    try:
                        val = float(text.replace("%", "").strip())
                        if 0 < val < 20:
                            # ריבית בנ"י — הפריים = +1.5%
                            result["prime_rate"] = round(val + 1.5, 4)
                            result["source"]["prime"] = "BOI scrape"
                            break
                    except ValueError:
                        continue
        except Exception as e:
            print(f"[rate-watcher] BOI scrape failed: {e}", file=sys.stderr)

    # --- מדד המחירים לצרכן מהלמ"ס (JSON API) ---
    try:
        cbs_url = "https://api.cbs.gov.il/index/data/price?id=120010&format=json&lang=he"
        resp = http_requests.get(cbs_url, timeout=10, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            for entry in reversed(data.get("data", [])):
                annual = entry.get("annual_change")
                if annual is not None:
                    result["cpi_annual_pct"] = round(float(annual), 4)
                    result["source"]["cpi"] = "CBS API"
                    break
    except Exception as e:
        print(f"[rate-watcher] CBS API failed: {e}", file=sys.stderr)

    # fallback: scrape דף הלמ"ס
    if result["cpi_annual_pct"] is None:
        try:
            page = http_requests.get(
                "https://www.cbs.gov.il/he/pages/default.aspx",
                timeout=10, headers=headers,
            )
            soup = BeautifulSoup(page.content, "html.parser")
            for tag in soup.find_all(["span", "td", "div", "p"]):
                text = tag.get_text(strip=True)
                if "%" in text and any(w in text for w in ["מדד", "אינפלציה", "שינוי"]):
                    try:
                        num = text.split("%")[0].strip().split()[-1].replace(",", ".")
                        val = float(num)
                        if -5 < val < 30:
                            result["cpi_annual_pct"] = round(val, 4)
                            result["source"]["cpi"] = "CBS scrape"
                            break
                    except ValueError:
                        continue
        except Exception as e:
            print(f"[rate-watcher] CBS scrape failed: {e}", file=sys.stderr)

    return json.dumps(result, ensure_ascii=False)


# ---------------------------------------------------------------------------
# Tool 2: get_config_rates
# ---------------------------------------------------------------------------

@tool()
def get_config_rates() -> str:
    """קרא את ריבית הפריים ומדד ה-CPI הנוכחיים כפי שמוגדרים ב-Firestore של המערכת.
    מחזיר JSON עם prime ו-cpi. אם הערך לא קיים ב-Firestore — יחזיר את ברירת המחדל."""
    DEFAULT_PRIME = 4.56
    DEFAULT_CPI = 2.5

    prime = DEFAULT_PRIME
    cpi = DEFAULT_CPI

    try:
        doc = _db.collection("config").document("generalRates").get()
        if doc.exists:
            data = doc.to_dict() or {}
            prime_data = data.get("prime", {})
            if isinstance(prime_data, dict):
                prime = float(prime_data.get("anchor", DEFAULT_PRIME))
    except Exception as e:
        print(f"[rate-watcher] generalRates read failed: {e}", file=sys.stderr)

    try:
        doc = _db.collection("config").document("monthlyIndices").get()
        if doc.exists:
            data = doc.to_dict() or {}
            cpi = float(data.get("annualExpected", DEFAULT_CPI))
    except Exception as e:
        print(f"[rate-watcher] monthlyIndices read failed: {e}", file=sys.stderr)

    return json.dumps({"prime": prime, "cpi": cpi}, ensure_ascii=False)


# ---------------------------------------------------------------------------
# Tool 3: notify_admin
# ---------------------------------------------------------------------------

@tool()
def notify_admin(message: str) -> str:
    """שלח הודעת התראה למנהל המערכת דרך תיבת ההודעות.
    ההודעה תופיע בממשק הניהול תחת לשונית ההודעות של אותו משתמש.
    השתמש בפונקציה זו רק כשיש פער משמעותי שדורש פעולה מצד המנהל."""
    if not ADMIN_UID:
        return "שגיאה: ADMIN_UID לא מוגדר — לא ניתן לשלוח הודעה."

    try:
        _db.collection("requests").document(ADMIN_UID).collection("messages").add({
            "sender": "rate-watcher-agent",
            "text": message,
            "timestamp": SERVER_TIMESTAMP,
        })
        return "הודעה נשלחה בהצלחה למנהל."
    except Exception as e:
        return f"שגיאה בשליחת ההודעה: {e}"


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------

agent = Agent(
    model=Claude(id="claude-sonnet-4-6"),
    description="אתה סוכן מעקב ריביות של מערכת SimpleSave. תפקידך לבדוק האם ריבית הפריים ומדד המחירים לצרכן בשוק השתנו לעומת מה שמוגדר במערכת.",
    instructions=[
        "1. קרא ל-fetch_market_rates() כדי לקבל את הנתונים העדכניים מהשוק.",
        "2. קרא ל-get_config_rates() כדי לראות מה מוגדר כרגע במערכת.",
        f"3. חשב את הפער לכל מדד. פער של {CHANGE_THRESHOLD}% ומעלה נחשב משמעותי.",
        "4. אם יש פער משמעותי באחד המדדים או יותר — קרא ל-notify_admin() עם הודעה ברורה בעברית.",
        "   ההודעה תכלול: הערך בשוק, הערך המוגדר, ההמלצה לעדכן בפאנל הניהול.",
        "5. אם אין פער משמעותי — אל תשלח הודעה, רק דווח שהכל תקין.",
        "אם שליפת נתוני השוק נכשלה (null) — ציין זאת בפירוש ואל תשלח התראת שווא.",
    ],
    tools=[fetch_market_rates, get_config_rates, notify_admin],
)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    print("[rate-watcher] Starting rate check...")
    result = agent.run("בדוק האם יש שינוי בריבית הפריים או במדד המחירים לצרכן שדורש עדכון במערכת.")
    print("[rate-watcher] Done.")
    if result and result.content:
        print(result.content)
