import os
import uvicorn

from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.knowledge import Knowledge
from agno.vectordb.lancedb import LanceDb, SearchType
from agno.knowledge.embedder.voyageai import VoyageAIEmbedder
from agno.app.agentui.serve import AgentOS


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
    description="אתה עוזר שמסביר מונחי משכנתא בעברית פשוטה על בסיס מילון המושגים.",
    instructions=[
        "ענה אך ורק על בסיס הגלוסר שברשותך ועל בסיס הנתונים האמיתיים של המשתמש.",
        "אל תשתמש בידע כללי על משכנתאות שאינו מהגלוסר.",
        'אל תכלול שם, תעודת זהות, כתובת, טלפון או מייל בתשובות.',
        "ענה תמיד בעברית, בגובה העיניים, בלי ז'רגון מיותר.",
        "אם אינך יודע או שהמידע אינו בגלוסר — אמור זאת בפירוש במקום לנחש.",
    ],
    knowledge=knowledge,
)

agent_os = AgentOS(
    name="SimpleSave Explainer",
    agents=[agent],
    cors_allowed_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
)

if __name__ == "__main__":
    uvicorn.run(agent_os.get_app(), host="0.0.0.0", port=7777)
