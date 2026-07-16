# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
import pytest_asyncio
# pyrefly: ignore [missing-import]
from httpx import AsyncClient
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient
# pyrefly: ignore [missing-import]
from mongomock_motor import AsyncMongoMockClient
import os

# Set test environment variables BEFORE importing app
os.environ["MONGODB_URI"] = "mongodb://localhost:27017"
os.environ["JWT_SECRET"] = "test_secret_must_be_32_characters_long_now"
os.environ["ALGORITHM"] = "HS256"

from main import app
from core.db_connection import get_active_db, init_indexes

@pytest_asyncio.fixture(scope="session")
async def test_db():
    client = AsyncMongoMockClient()
    db = client.voxbiz_test_db
    
    # Bootstrap test DB
    await init_indexes(db)
    
    yield db
    
    # Cleanup after tests
    await client.drop_database("voxbiz_test_db")
    client.close()

@pytest.fixture
def override_get_db(test_db):
    async def _get_db_override():
        return test_db
    app.dependency_overrides[get_active_db] = _get_db_override
    yield
    app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def async_client(override_get_db):
    # pyrefly: ignore [missing-import]
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def auth_headers():
    from core.jwt.jwt_handler import create_access_token
    token = create_access_token({"user_id": "testuser123", "email": "test@voxbiz.ai"})
    return {"Authorization": f"Bearer {token}"}
