import json
import os
import uvicorn
from pathlib import Path

# Load .env from app/ (works locally; in Cloud Run env vars come from the platform)
_env_path = Path(__file__).parent.parent.parent / "app" / ".env"
if _env_path.exists():
    for _line in _env_path.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _, _v = _line.partition("=")
            os.environ.setdefault(_k.strip(), _v.strip())

from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.tools import tool
from agno.run import RunContext
from agno.os.app import AgentOS

import firebase_admin
from firebase_admin import credentials, firestore as firebase_firestore

# --- Firebase Admin init ---
_cred = credentials.Certificate(
    os.path.join(os.path.dirname(__file__), "service-account.json")
)
firebase_admin.initialize_app(_cred)
_db = firebase_firestore.client()

# --- Load glossary into system prompt ---
_glossary_path = Path(__file__).parent / "glossary.md"
_glossary_text = _glossary_path.read_text(encoding="utf-8") if _glossary_path.exists() else ""


# --- Tool ---
@tool()
def get_user_mortgage_data(run_context: RunContext) -> str:
    """שלוף את נתוני המשכנתא של המשתמש — תמהילים, תשלום חודשי ראשון, סך תשלומים, ריבית.
    קרא לפונקציה זו כשהמשתמש שואל על הנתונים האישיים שלו."""
    uid = run_context.user_id if run_context else None
    if not uid:
        return "לא ניתן לאמת את זהות המשתמש."

    doc = _db.collection("requests").document(uid).get()
    if not doc.exists:
        return "לא נמצאו נתוני משכנתא עבור משתמש זה."

    data = doc.to_dict()
    financial = data.get("financial", {})
    mixes = data.get("mixes", [])

    result = {
        "financial": {
            "propertyValue": financial.get("propertyValue"),
            "equity": financial.get("equity"),
            "minPay": financial.get("minPay"),
            "maxPayDesired": financial.get("maxPayDesired"),
        },
        "mixes": [
            {
                "name": m.get("name"),
                "risk": m.get("risk"),
                "firstMonthlyPayment": m.get("firstMonthlyPayment"),
                "totalPayment": m.get("totalPayment"),
                "totalInterestAndIndexation": m.get("totalInterestAndIndexation"),
                "routes": [
                    {
                        "kind": r.get("kind"),
                        "sharePct": r.get("sharePct"),
                        "amount": r.get("amount"),
                        "years": r.get("years"),
                        "board": r.get("board"),
                        "indexType": r.get("indexType"),
                        "anchor": r.get("anchor"),
                    }
                    for r in m.get("routes", [])
                ],
            }
            for m in mixes
        ],
    }
    return json.dumps(result, ensure_ascii=False)


# --- Agent ---
agent = Agent(
    id="simplesave-explainer",
    model=Claude(id="claude-sonnet-4-6"),
    description="אתה עוזר שמסביר מונחי משכנתא בעברית פשוטה על בסיס מילון המושגים.",
    instructions=[
        f"להלן מילון המושגים המלא שברשותך — ענה אך ורק על בסיסו:\n\n{_glossary_text}",
        "כשהמשתמש שואל על הנתונים שלו (תשלום, יתרה, תמהיל, ריבית) — קרא ל-get_user_mortgage_data.",
        "אל תכלול שם, תעודת זהות, כתובת, טלפון או מייל בתשובות.",
        "ענה תמיד בעברית, בגובה העיניים, בלי ז'רגון מיותר.",
        "אם המושג אינו במילון — אמור זאת בפירוש במקום לנחש.",
    ],
    tools=[get_user_mortgage_data],
)


# --- AgentOS ---
agent_os = AgentOS(
    name="SimpleSave Explainer",
    agents=[agent],
    cors_allowed_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
)

app = agent_os.get_app()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7777)
