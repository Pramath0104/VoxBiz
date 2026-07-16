from fastapi import APIRouter, HTTPException, Depends, Request
from core.db_connection import get_active_db
from core.middleware.authentication import get_current_user
from src.query.dtos import QueryRequest, InsightsRequest, ChatRequest, MutationRequest, SendDataEmailRequest, GlobalQueryRequest
from src.query.controller import QueryController
from core.limiter import limiter

router = APIRouter()
query_controller = QueryController()

@router.post("/")
@limiter.limit("20/minute")
async def process_query(request: Request, req: QueryRequest, user: dict = Depends(get_current_user), db = Depends(get_active_db)):
    """
    Protected endpoint to convert natural language into a MongoDB query.
    Requires a valid JWT token.
    """
        
    return await query_controller.process_query(db, user["user_id"], req)

@router.post("/global")
@limiter.limit("20/minute")
async def process_global_query(request: Request, req: GlobalQueryRequest, user: dict = Depends(get_current_user), db = Depends(get_active_db)):
    """
    Protected endpoint to search across ALL user databases dynamically.
    """
    return await query_controller.process_global_query(db, user["user_id"], req)

@router.post("/insights")
@limiter.limit("20/minute")
async def get_insights(request: Request, req: InsightsRequest, user: dict = Depends(get_current_user), db = Depends(get_active_db)):
    """
    Generate business insights based on data context and business context.
    """
    return await query_controller.get_insights(req)

@router.post("/send-data-email")
@limiter.limit("10/minute")
async def send_data_email(request: Request, req: SendDataEmailRequest, user: dict = Depends(get_current_user), db = Depends(get_active_db)):
    """
    Sends data or insights to a specified email address.
    """
    return await query_controller.send_data_email(req)

@router.post("/chat")
@limiter.limit("30/minute")
async def process_chat(request: Request, req: ChatRequest, user: dict = Depends(get_current_user), db = Depends(get_active_db)):
    """
    Process a chat message with the business strategy assistant.
    """
    return await query_controller.process_chat(req)


@router.post("/execute-mutation")
@limiter.limit("30/minute")
async def execute_mutation(request: Request, req: MutationRequest, user: dict = Depends(get_current_user), db = Depends(get_active_db)):
    """
    Execute a verified mutation (update or delete).
    """
        
    return await query_controller.execute_mutation(db, user["user_id"], req)

