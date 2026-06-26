import os
import requests
import uvicorn

from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.knowledge import Knowledge
from agno.vectordb.lancedb import LanceDb, SearchType
from agno.knowledge.embedder.voyageai import VoyageAIEmbedder
from agno.tools import tool
from agno.app.agentui.serve import AgentOS

CALC_FUNCTION_URL = os.environ["CALC_FUNCTION_URL"]


@tool()
def get_user_mortgage_data(uid: str) -> str:
    """Fetch the user's mortgage data (amounts and loan terms only, no PII).
    Call this when the user asks about their specific mortgage numbers,
    monthly payment, balance, interest rate, or remaining years."""
    resp = requests.post(CALC_FUNCTION_URL, json={"uid": uid}, timeout=10)
    resp.raise_for_status()
    return str(resp.json())


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

agent = Agent(
    model=Claude(id="claude-sonnet-4-6"),
    description="אתה עוזר שמסביר למשתמשים את המשכנתא שלהם בעברית פשוטה.",
    instructions=[
        "ענה אך ורק על בסיס הגלוסר שברשותך ועל בסיס הנתונים האמיתיים של המשתמש.",
        "אל תשתמש בידע כללי על משכנתאות שאינו מהגלוסר.",
        "כשהמשתמש שואל על הנתונים שלו (תשלום, יתרה, ריבית, שנים שנותרו) — קרא ל-get_user_mortgage_data עם ה-uid שלו.",
        "ה-uid של המשתמש מופיע בתחילת ההודעה בפורמט [uid:XXXX] — חלץ אותו משם.",
        'אל תכלול שם, תעודת זהות, כתובת, טלפון או מייל בתשובות.',
        "ענה תמיד בעברית, בגובה העיניים, בלי ז'רגון מיותר.",
        "אם אינך יודע או שהמידע אינו בגלוסר — אמור זאת בפירוש במקום לנחש.",
    ],
    knowledge=knowledge,
    tools=[get_user_mortgage_data],
)

agent_os = AgentOS(
    name="SimpleSave Explainer",
    agents=[agent],
    cors_allowed_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "null",
    ],
)

if __name__ == "__main__":
    uvicorn.run(agent_os.get_app(), host="0.0.0.0", port=7777)
