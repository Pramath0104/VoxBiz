# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_auth_required_for_protected_routes(async_client: AsyncClient):
    response = await async_client.get("/api/database/list")
    assert response.status_code == 401

async def test_auth_success(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/database/list", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "data" in data

async def test_ownership_validation_for_query(async_client: AsyncClient, auth_headers: dict, test_db):
    # Setup dummy database owned by someone else
    await test_db["user_databases"].insert_one({
        "id": "db_not_mine",
        "user_id": "other_user",
        "permissions": "readWrite"
    })
    
    # Try querying it
    payload = {
        "query": "find all",
        "collection_name": "db_not_mine",
        "schema_context": "[]"
    }
    response = await async_client.post("/api/query/", headers=auth_headers, json=payload)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]

async def test_pipeline_policy_rejects_malicious_stages(async_client: AsyncClient, auth_headers: dict, test_db):
    # This tests the `validate_mongo_pipeline` logic via an LLM bypass attempt mock
    # Wait, the endpoint actually translates natural language to pipeline using NLPQueryEngine,
    # so we can't easily mock the NLP engine without patching it.
    # We can instead unit test `validate_mongo_pipeline` directly.
    pass

def test_pipeline_policy_unit():
    from core.security.query_policy import validate_mongo_pipeline
    from fastapi import HTTPException
    
    malicious_pipeline = [{"$lookup": {"from": "users", "localField": "id", "foreignField": "id", "as": "users"}}]
    
    with pytest.raises(HTTPException) as exc:
        validate_mongo_pipeline(malicious_pipeline, "testuser123")
    
    assert exc.value.status_code == 403
    assert "Forbidden aggregation stage" in exc.value.detail

def test_pipeline_policy_modifies_out_stage():
    from core.security.query_policy import validate_mongo_pipeline
    from fastapi import HTTPException
    
    malicious_pipeline = [{"$match": {"x": 1}}, {"$out": "users"}]
    
    with pytest.raises(HTTPException) as exc:
        validate_mongo_pipeline(malicious_pipeline, "testuser123")
        
    assert exc.value.status_code == 403
    assert "Forbidden aggregation stage" in exc.value.detail

async def test_file_upload_validation(async_client: AsyncClient, auth_headers: dict):
    # Create dummy CSV file
    file_content = b"name,age\nAlice,30\nBob,25\n"
    files = {"file": ("test.csv", file_content, "text/csv")}
    
    response = await async_client.post(
        "/api/database/upload-csv", 
        headers=auth_headers, 
        files=files,
        data={"dbName": "My CSV DB"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Try uploading a non-CSV file (exe)
    bad_content = b"MZ\x90\x00\x03\x00\x00\x00"
    bad_files = {"file": ("virus.exe", bad_content, "application/x-msdownload")}
    bad_response = await async_client.post(
        "/api/database/upload-csv", 
        headers=auth_headers, 
        files=bad_files,
        data={"dbName": "Bad DB"}
    )
    assert bad_response.status_code == 400
    assert "Invalid file type" in bad_response.json()["detail"]
