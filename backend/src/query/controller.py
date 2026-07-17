from fastapi import HTTPException

from core.core_services.llm_service import NLPQueryEngine
from src.query.dtos import (
    ChatRequest,
    InsightsRequest,
    QueryRequest,
    SendDataEmailRequest,
)


class QueryController:
    def __init__(self):
        self.nlp_engine = NLPQueryEngine()

    async def process_query(self, db, user_id: str, request: QueryRequest):
        # Verify user owns the database
        user_db = await db["user_databases"].find_one({"id": request.collection_name, "user_id": user_id})
        if not user_db:
            raise HTTPException(status_code=403, detail="Access denied. You do not own this database.")
            
        try:
            # 1. Translate natural language to MongoDB pipeline/intent
            nlp_result = await self.nlp_engine.generate_mongo_pipeline(request.query, request.schema_context)
            
            if not isinstance(nlp_result, dict):
                raise HTTPException(status_code=400, detail="Invalid pipeline format returned from AI.")
                
            intent = nlp_result.get("intent", "select")
            pipeline = nlp_result.get("pipeline", [])
            update_statement = nlp_result.get("update_statement")
                
            if user_db.get("permissions") == "readOnly" and intent.lower() != "select":
                raise HTTPException(status_code=403, detail="Access denied: Database is in Read-Only mode. You cannot perform updates or deletions.")
            
            # 2. Validate and execute pipeline against the requested collection
            from core.security.query_policy import validate_mongo_pipeline
            validated_pipeline = validate_mongo_pipeline(pipeline, user_id)
            
            collection = db[request.collection_name]
            cursor = collection.aggregate(validated_pipeline)
            
            # 3. Retrieve and return results
            results = await cursor.to_list(length=100) # Limit to 100 docs for safety
            
            # Convert ObjectId to string for JSON serialization
            for doc in results:
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])
                    
            mutation_id = None
            if intent.lower() in ("update", "delete"):
                import uuid
                from datetime import datetime
                
                mutation_id = str(uuid.uuid4())
                # Extract target IDs from the query results to freeze the scope of the mutation
                target_ids = [doc['_id'] for doc in results if '_id' in doc]
                
                await db["pending_mutations"].insert_one({
                    "mutation_id": mutation_id,
                    "user_id": user_id,
                    "collection_name": request.collection_name,
                    "intent": intent,
                    "update_statement": update_statement,
                    "target_ids": target_ids,
                    "created_at": datetime.utcnow()
                })
            
            return {
                "success": True,
                "intent": intent,
                "pipeline_used": pipeline,
                "update_statement": update_statement,
                "mutation_id": mutation_id,
                "data": results,
                "queried_by_user_id": user_id
            }
        except HTTPException:
            raise
        except Exception:
            from core.logger import logger
            logger.exception("Query processing failed")
            raise HTTPException(status_code=500, detail="Query processing failed")

    async def process_global_query(self, db, user_id: str, request):
        # 1. Fetch all user databases
        cursor = db["user_databases"].find({"user_id": user_id})
        user_dbs = await cursor.to_list(length=100)
        
        if not user_dbs:
            raise HTTPException(status_code=404, detail="No databases found for user. Please connect a database first.")
            
        # 2. Build schema dictionary mapping db_id -> schema string
        import json
        all_schemas_dict = {}
        db_metadata_map = {}
        for user_db in user_dbs:
            db_id = user_db["id"]
            db_metadata_map[db_id] = user_db
            try:
                schema_data = json.dumps(user_db.get("schema", {}))
                all_schemas_dict[db_id] = schema_data
            except Exception:
                pass
                
        # 3. Call AI to figure out which DB to use and get the pipeline
        try:
            nlp_result = await self.nlp_engine.generate_global_mongo_pipeline(request.query, all_schemas_dict)
            
            if not isinstance(nlp_result, dict):
                raise HTTPException(status_code=400, detail="Invalid pipeline format returned from AI.")
                
            target_db_id = nlp_result.get("target_db_id")
            if not target_db_id or target_db_id not in db_metadata_map:
                raise HTTPException(status_code=400, detail="AI could not determine a valid target database for this query.")
                
            intent = nlp_result.get("intent", "select")
            pipeline = nlp_result.get("pipeline", [])
            update_statement = nlp_result.get("update_statement")
            
            target_db_meta = db_metadata_map[target_db_id]
            if target_db_meta.get("permissions") == "readOnly" and intent.lower() != "select":
                raise HTTPException(status_code=403, detail=f"Access denied: Target Database ({target_db_id}) is Read-Only.")
                
            # 4. Validate and execute
            from core.security.query_policy import validate_mongo_pipeline
            validated_pipeline = validate_mongo_pipeline(pipeline, user_id)
            
            collection = db[target_db_id]
            query_cursor = collection.aggregate(validated_pipeline)
            results = await query_cursor.to_list(length=100)
            
            for doc in results:
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])
                    
            mutation_id = None
            if intent.lower() in ("update", "delete"):
                import uuid
                from datetime import datetime
                mutation_id = str(uuid.uuid4())
                target_ids = [doc['_id'] for doc in results if '_id' in doc]
                await db["pending_mutations"].insert_one({
                    "mutation_id": mutation_id,
                    "user_id": user_id,
                    "collection_name": target_db_id,
                    "intent": intent,
                    "update_statement": update_statement,
                    "target_ids": target_ids,
                    "created_at": datetime.utcnow()
                })
                
            return {
                "success": True,
                "intent": intent,
                "pipeline_used": pipeline,
                "update_statement": update_statement,
                "mutation_id": mutation_id,
                "data": results,
                "queried_by_user_id": user_id,
                "target_db_id": target_db_id,
                "target_db_name": target_db_meta.get("name", "Unknown DB")
            }
            
        except HTTPException:
            raise
        except Exception:
            from core.logger import logger
            logger.exception("Global Query processing failed")
            raise HTTPException(status_code=500, detail="Global Query processing failed")

    async def get_insights(self, request: InsightsRequest):
        try:
            insights = await self.nlp_engine.generate_insights(request.data_context, request.business_context)
            return {"success": True, "insights": insights}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def process_chat(self, request: ChatRequest):
        try:
            reply = await self.nlp_engine.chat(request.chat_history, request.message)
            return {"success": True, "reply": reply}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def send_data_email(self, request: SendDataEmailRequest):
        try:
            import asyncio

            from core.core_services.email_service import email_service
            
            body = request.message if hasattr(request, 'message') and request.message else "Please see the attached data insights."
            
            if hasattr(request, 'data') and request.data:
                body += "\n\n--- DATA ---\n"
                for row in request.data[:100]:
                    row_str = " | ".join(f"{k}: {v}" for k, v in row.items() if k != "_id")
                    body += f"{row_str}\n"
                
                if len(request.data) > 100:
                    body += f"\n...and {len(request.data) - 100} more rows."

            asyncio.create_task(
                email_service.send_email(
                    to_email=request.recipientEmail,
                    subject=request.subject,
                    body=body
                )
            )
            return {"success": True, "message": "Email sent successfully!"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def execute_mutation(self, db, user_id: str, request):
        # pyrefly: ignore [missing-import]
        from bson import ObjectId
        
        # 1. Fetch the approved mutation
        pending = await db["pending_mutations"].find_one({"mutation_id": request.mutation_id, "user_id": user_id})
        if not pending:
            raise HTTPException(status_code=400, detail="Invalid or expired mutation ID.")
            
        collection_name = pending["collection_name"]
        if collection_name != request.collection_name:
            raise HTTPException(status_code=400, detail="Collection mismatch.")
            
        intent = pending["intent"]
        update_statement = pending.get("update_statement")
        raw_target_ids = pending.get("target_ids", [])
        
        # Verify user owns the database
        user_db = await db["user_databases"].find_one({"id": collection_name, "user_id": user_id})
        if not user_db:
            raise HTTPException(status_code=403, detail="Access denied. You do not own this database.")
            
        if user_db.get("permissions") == "readOnly":
            raise HTTPException(status_code=403, detail="Access denied: Database is in Read-Only mode.")
            
        try:
            collection = db[collection_name]
            
            # Convert string IDs back to ObjectId if possible
            target_ids = []
            for tid in raw_target_ids:
                try:
                    target_ids.append(ObjectId(tid))
                except:
                    target_ids.append(tid) # If it's a string ID
                    
            filter_query = {"_id": {"$in": target_ids}}
            
            if intent == "delete":
                result = await collection.delete_many(filter_query)
                # Cleanup pending mutation
                await db["pending_mutations"].delete_one({"mutation_id": request.mutation_id})
                return {"success": True, "modified_count": result.deleted_count}
            elif intent == "update":
                if not update_statement:
                    raise ValueError("Update statement is missing from approved mutation")
                
                # Ensure the update statement has MongoDB operators
                has_operators = any(k.startswith('$') for k in update_statement.keys())
                if not has_operators:
                    update_statement = {"$set": update_statement}
                
                allowed_operators = {"$set", "$unset", "$inc", "$push", "$pull", "$addToSet"}
                for op in update_statement.keys():
                    if op not in allowed_operators:
                        raise HTTPException(status_code=400, detail=f"Unsafe or forbidden update operator detected: {op}")
                    
                result = await collection.update_many(filter_query, update_statement)
                # Cleanup pending mutation
                await db["pending_mutations"].delete_one({"mutation_id": request.mutation_id})
                return {"success": True, "modified_count": result.modified_count}
            else:
                raise ValueError(f"Unsupported mutation intent: {intent}")
                
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
