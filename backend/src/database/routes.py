from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

# pyrefly: ignore [missing-import]
from pydantic import BaseModel

from core.db_connection import get_active_db
from core.limiter import limiter
from core.middleware.authentication import get_current_user
from src.database.controller import DatabaseController


class SqlUploadRequest(BaseModel):
    dbName: str
    query: str

class PermissionsUpdateRequest(BaseModel):
    permissions: str

class DeleteRowsRequest(BaseModel):
    row_ids: List[str]

router = APIRouter()
db_controller = DatabaseController()

@router.post("/upload-csv")
@limiter.limit("5/minute")
async def upload_csv(
    request: Request,
    dbName: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user), db = Depends(get_active_db)
):
    # Enforce Content-Length before reading into memory to prevent OOM
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Payload too large. Maximum size is 5MB.")
        
    allowed_mimes = ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
    if file.content_type not in allowed_mimes:
        raise HTTPException(status_code=400, detail="Invalid file type. Only CSV and Excel files are allowed.")
        
    contents = await file.read()
    return await db_controller.process_csv_upload(db, user["user_id"], dbName, file.filename, contents)

@router.post("/upload-sql")
@limiter.limit("5/minute")
async def upload_sql(
    request: Request,
    req: SqlUploadRequest,
    user: dict = Depends(get_current_user), db = Depends(get_active_db)
):
        
    return await db_controller.process_sql_upload(db, user["user_id"], req)

@router.get("/list")
async def list_databases(
    page: int = 1,
    page_size: int = 50,
    user: dict = Depends(get_current_user), 
    db = Depends(get_active_db)
):
    """
    Returns the list of databases owned by the user.
    """
        
    return await db_controller.list_databases(db, user["user_id"], page, page_size)

@router.get("/db-info/{db_id}")
async def get_db_info(db_id: str, user: dict = Depends(get_current_user), db = Depends(get_active_db)):
    """
    Returns information about a specific database.
    """
        
    return await db_controller.get_db_info(db, db_id, user["user_id"])

@router.get("/{db_id}/data")
async def get_db_data(
    db_id: str, 
    page: int = 1,
    page_size: int = 100,
    user: dict = Depends(get_current_user), 
    db = Depends(get_active_db)
):
    """
    Returns paginated raw records for a specific database.
    """
        
    return await db_controller.get_db_data(db, db_id, user["user_id"], page, page_size)

@router.put("/{db_id}/permissions")
async def update_permissions(db_id: str, request: PermissionsUpdateRequest, user: dict = Depends(get_current_user), db = Depends(get_active_db)):
    """
    Updates the permissions (e.g. readOnly vs readWrite) for a specific database.
    """
    return await db_controller.update_db_permissions(db, db_id, user["user_id"], request.permissions)



@router.delete("/{db_id}")
async def delete_database(db_id: str, user: dict = Depends(get_current_user), db = Depends(get_active_db)):
    """
    Deletes a specific database completely.
    """
        
    return await db_controller.delete_database(db, db_id, user["user_id"])

@router.post("/{db_id}/data/delete")
async def delete_rows(
    db_id: str, 
    request: DeleteRowsRequest,
    user: dict = Depends(get_current_user), 
    db = Depends(get_active_db)
):
    """
    Deletes specific rows from a database collection.
    """
    return await db_controller.delete_db_records(db, db_id, user["user_id"], request.row_ids)

