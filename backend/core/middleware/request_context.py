import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from core.logger import request_id_var, logger
import time

class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Generate a unique request ID
        request_id = str(uuid.uuid4())
        
        # Set it in the context variable
        token = request_id_var.set(request_id)
        
        # Add to request state for access in routes
        request.state.request_id = request_id
        
        start_time = time.time()
        
        # Log request start
        logger.info(f"Incoming Request: {request.method} {request.url.path}")
        
        try:
            response = await call_next(request)
            
            # Add to response headers
            response.headers["X-Request-ID"] = request_id
            
            process_time = time.time() - start_time
            logger.info(f"Request Completed: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.4f}s")
            
            return response
        except Exception as e:
            process_time = time.time() - start_time
            logger.exception(f"Request Failed: {request.method} {request.url.path} - Error: {str(e)} - Time: {process_time:.4f}s")
            raise
        finally:
            # Reset the context variable
            request_id_var.reset(token)
