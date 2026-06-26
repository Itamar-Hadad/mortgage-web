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
from pathlib import Path
import requests as http_requests

# Load .env from app/ (works locally; in Cloud Run env vars come from the platform)
_env_path = Path(__file__).parent.parent.parent / "app" / ".env"
if _env_path.exists():
    for _line in _env_path.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _, _v = _line.partition("=")
            os.environ.setdefault(_k.strip(), _v.strip())

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
    """שלוף את ריבית הפריים העדכנית ואת מדד המחירים לצרכן השנתי.
    מחזיר JSON עם prime_rate ו-cpi_annual_pct. אם שליפה נכשלת — הערך יהיה null."""

    result = {"prime_rate": None, "cpi_annual_pct": None, "source": {}}

    # --- CPI מ-CBS API (עובד בוודאות) ---
    # השדה percentYear = שינוי שנתי באחוזים של המדד הכללי (id=120010)
    try:
        cbs_url = "https://api.cbs.gov.il/index/data/price?id=120010&format=json&lang=he"
        resp = http_requests.get(cbs_url, timeout=10)
        if resp.status_code == 200:
            series = (resp.json().get("month", []) or [])
            # מבנה: month[0].date[0] = הרשומה העדכנית ביותר
            dates = series[0].get("date", []) if series else []
            if dates:
                annual = dates[0].get("percentYear")
                if annual is not None:
                    result["cpi_annual_pct"] = round(float(annual), 4)
                    result["source"]["cpi"] = f"CBS API ({dates[0].get('month')}/{dates[0].get('year')})"
    except Exception as e:
        print(f"[rate-watcher] CBS CPI failed: {e}", file=sys.stderr)

    # --- ריבית פריים: BOI חסום — הסוכן עצמו ידווח לפי ידע עדכני ---
    # prime_rate נשאר None; הסוכן יטפל בזה בהוראות

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
    """שלח התראה למנהל המערכת — תופיע כ-alert banner בממשק הניהול.
    השתמש בפונקציה זו רק כשיש פער משמעותי שדורש פעולה מצד המנהל."""
    try:
        _db.collection("admin-alerts").add({
            "message": message,
            "source": "rate-watcher-agent",
            "read": False,
            "timestamp": SERVER_TIMESTAMP,
        })
        return "התראה נשלחה בהצלחה."
    except Exception as e:
        return f"שגיאה בשליחת ההתראה: {e}"


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------

agent = Agent(
    model=Claude(id="claude-sonnet-4-6"),
    description="אתה סוכן מעקב ריביות של מערכת SimpleSave. תפקידך לבדוק האם ריבית הפריים ומדד המחירים לצרכן בשוק השתנו לעומת מה שמוגדר במערכת.",
    instructions=[
        "1. קרא ל-fetch_market_rates() — מחזיר CPI מ-CBS API. ריבית הפריים תמיד null (מקור חסום).",
        "2. לגבי ריבית הפריים: השתמש בידע שלך על ריבית בנק ישראל הנוכחית (פריים = ריבית בנ\"י + 1.5%)."
        "   ציין בבירור שזה אומדן מידע אימון, לא שליפה בזמן אמת.",
        "3. קרא ל-get_config_rates() כדי לראות מה מוגדר כרגע במערכת.",
        f"4. חשב פער לכל מדד. פער של {CHANGE_THRESHOLD}% ומעלה נחשב משמעותי.",
        "5. אם יש פער משמעותי — קרא ל-notify_admin() עם הודעה הכוללת: ערך בשוק, ערך במערכת, המלצה לעדכן.",
        "6. אם אין פער משמעותי — אל תשלח הודעה, רק דווח שהכל תקין.",
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
