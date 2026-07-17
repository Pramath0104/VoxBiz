# pyrefly: ignore [missing-import]
from pydantic import BaseModel


class QueryRequest(BaseModel):
    query: str
    collection_name: str
    schema_context: str

class GlobalQueryRequest(BaseModel):
    query: str

class InsightsRequest(BaseModel):
    data_context: str
    business_context: str

class ChatRequest(BaseModel):
    chat_history: list
    message: str

class SendDataEmailRequest(BaseModel):
    recipientEmail: str
    subject: str
    message: str
    data: list

class MutationRequest(BaseModel):
    collection_name: str
    mutation_id: str

