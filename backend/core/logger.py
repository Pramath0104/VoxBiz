import logging
from pythonjsonlogger import jsonlogger
import sys
import contextvars
import uuid

# Context variable to hold the request ID for the current async context
request_id_var = contextvars.ContextVar("request_id", default="-")

class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id_var.get()
        return True

def get_logger(name: str):
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        logHandler = logging.StreamHandler(sys.stdout)
        
        # Use JSON formatter
        formatter = jsonlogger.JsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s %(request_id)s'
        )
        logHandler.setFormatter(formatter)
        logger.addHandler(logHandler)
        logger.addFilter(RequestIdFilter())
    
    return logger

logger = get_logger("voxbiz_api")
