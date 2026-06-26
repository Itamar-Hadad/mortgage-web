import json
import os
import uvicorn

from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.knowledge import Knowledge
from agno.vectordb.lancedb import LanceDb, SearchType
from agno.knowledge.embedder.voyageai import VoyageAIEmbedder
from agno.tools import tool
from agno.run import RunContext
from agno.os.app import AgentOS

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials, firestore as firebase_firestore
from fastapi import Request
from fastapi.responses import JSONResponse

# --- Firebase Admin init ---
_cred = credentials.Certificate(
    os.path.join(os.path.dirname(__file__), "service-account.json")
)
firebase_admin.initialize_app(_cred)
_db = firebase_firestore.client()


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


# --- Knowledge (RAG) ---
knowledge = Knowledge(
    vector_db=LanceDb(
        uri="tmp/lancedb",
        table_name="mortgage_glossary",
        search_type=SearchType.hybrid,
        embedder=VoyageAIEmbedder(id="voyage-3-lite"),
    )
)

if not os.path.exists("tmp/lancedb/mortgage_glossary.lance"):
    knowledge.insert(path="glossary.md")


# --- Agent ---
agent = Agent(
    model=Claude(id="claude-sonnet-4-6"),
    description="אתה עוזר שמסביר מונחי משכנתא בעברית פשוטה על בסיס מילון המושגים.",
    instructions=[
        "ענה על בסיס הגלוסר שברשותך ועל בסיס נתוני המשכנתא של המשתמש.",
        "אל תשתמש בידע כללי על משכנתאות שאינו מהגלוסר.",
        "כשהמשתמש שואל על הנתונים שלו (תשלום, יתרה, תמהיל, ריבית) — קרא ל-get_user_mortgage_data.",
        "אל תכלול שם, תעודת זהות, כתובת, טלפון או מייל בתשובות.",
        "ענה תמיד בעברית, בגובה העיניים, בלי ז'רגון מיותר.",
        "אם אינך יודע או שהמידע אינו בגלוסר — אמור זאת בפירוש במקום לנחש.",
    ],
    knowledge=knowledge,
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


@app.middleware("http")
async def require_firebase_auth(request: Request, call_next):
    """Verify a real Firebase ID token on every request and set request.state.user_id
    from it. AgentOS's own /agents/{id}/runs route (agno.os.routers.agents.router)
    already prefers request.state.user_id over the client-supplied `user_id` form
    field — this is what stops a caller from passing an arbitrary user_id and
    reading someone else's mortgage data via get_user_mortgage_data."""
    auth_header = request.headers.get("authorization", "")
    token = auth_header[len("Bearer "):].strip() if auth_header.startswith("Bearer ") else None
    if not token:
        return JSONResponse(status_code=401, content={"detail": "Missing Authorization header"})
    try:
        decoded = firebase_auth.verify_id_token(token)
    except Exception:
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})
    request.state.user_id = decoded["uid"]
    return await call_next(request)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7777)
