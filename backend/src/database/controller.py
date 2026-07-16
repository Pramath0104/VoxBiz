import pandas as pd
import uuid
import io
import re
import ast
from datetime import datetime
from fastapi import HTTPException
from typing import List
from bson import ObjectId

class DatabaseController:
    async def process_csv_upload(self, db, user_id: str, dbName: str, filename: str, contents: bytes):
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
            
        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(contents))
            elif filename.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(io.BytesIO(contents))
            else:
                raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV or Excel file.")
                
            num_rows, num_cols = df.shape
            if num_rows > 10000:
                raise HTTPException(status_code=400, detail="Dataset too large. Maximum 10,000 rows allowed.")
            if num_cols > 100:
                raise HTTPException(status_code=400, detail="Dataset too wide. Maximum 100 columns allowed.")
                
            records = df.to_dict(orient='records')
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
            
        # Generate a unique ID for this collection
        db_id = f"db_{uuid.uuid4().hex[:12]}"
        
        try:
            schema = df.columns.tolist()
            if "_user_id" not in schema:
                schema.append("_user_id")
                
            # Create user_database metadata
            user_db_meta = {
                "id": db_id,
                "name": dbName,
                "user_id": user_id,
                "type": "mongodb",
                "status": "connected",
                "lastAccessed": datetime.utcnow().isoformat() + "Z",
                "created_at": datetime.utcnow().isoformat() + "Z",
                "schema": schema
            }
            
            # Insert actual records into the new collection FIRST
            for r in records:
                r["_user_id"] = user_id
                
            if records:
                await db[db_id].insert_many(records)
                
            # Then insert metadata
            await db["user_databases"].insert_one(user_db_meta)
                
            return {
                "success": True,
                "db_id": db_id,
                "schema": df.columns.tolist(),
                "message": f"Successfully created database '{dbName}' with {len(records)} records."
            }
        except Exception as e:
            # Compensate by dropping the collection if something failed
            await db[db_id].drop()
            raise HTTPException(status_code=500, detail=f"Error saving to database: {str(e)}")

    async def process_sql_upload(self, db, user_id: str, request):
        if len(request.query) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="SQL query too large. Maximum size is 5MB.")
            
        try:
            sql_query = request.query.strip().replace('\n', ' ')
            match = re.search(r"INSERT\s+INTO\s+\w+\s*\((.*?)\)\s*VALUES\s*(.*)", sql_query, re.IGNORECASE)
            
            if not match:
                raise HTTPException(status_code=400, detail="Invalid SQL query. Must be a valid INSERT INTO statement.")
                
            cols_str = match.group(1)
            columns = [c.strip() for c in cols_str.split(',')]
            
            if len(columns) > 100:
                raise HTTPException(status_code=400, detail="Too many columns. Maximum 100 columns allowed.")
            
            values_str = match.group(2).strip()
            if values_str.endswith(';'):
                values_str = values_str[:-1]
                
            eval_str = f"[{values_str}]"
            
            tuples = ast.literal_eval(eval_str)
            if isinstance(tuples, tuple) and not isinstance(tuples[0], tuple):
                tuples = [tuples]
                
            if len(tuples) > 10000:
                raise HTTPException(status_code=400, detail="Too many records. Maximum 10,000 records allowed.")
                
            records = []
            for t in tuples:
                if not isinstance(t, tuple):
                    t = [t]
                record = dict(zip(columns, t))
                records.append(record)
                
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=400, detail=f"Error parsing SQL: {str(e)}")
            
        db_id = f"db_{uuid.uuid4().hex[:12]}"
        
        try:
            schema = list(columns)
            if "_user_id" not in schema:
                schema.append("_user_id")
                
            user_db_meta = {
                "id": db_id,
                "name": request.dbName,
                "user_id": user_id,
                "type": "mongodb",
                "status": "connected",
                "lastAccessed": datetime.utcnow().isoformat() + "Z",
                "created_at": datetime.utcnow().isoformat() + "Z",
                "schema": schema
            }
            
            for r in records:
                r["_user_id"] = user_id
                
            if records:
                await db[db_id].insert_many(records)
                
            await db["user_databases"].insert_one(user_db_meta)
                
            return {
                "success": True,
                "db_id": db_id,
                "schema": columns,
                "message": f"Successfully created database '{request.dbName}' with {len(records)} records."
            }
        except Exception as e:
            await db[db_id].drop()
            raise HTTPException(status_code=500, detail=f"Error saving to database: {str(e)}")

    async def list_databases(self, db, user_id: str, page: int = 1, page_size: int = 50):
        skip = (page - 1) * page_size
        
        cursor = db["user_databases"].find({"user_id": user_id})
        total = await db["user_databases"].count_documents({"user_id": user_id})
        
        user_dbs = await cursor.skip(skip).limit(page_size).to_list(length=page_size)
        
        result = []
        for udb in user_dbs:
            udb.pop("_id", None)
            result.append(udb)
            
        return {
            "data": result,
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0
        }

    async def get_db_info(self, db, db_id: str, user_id: str):
        user_db = await db["user_databases"].find_one({"id": db_id, "user_id": user_id})
        
        if not user_db:
            raise HTTPException(status_code=404, detail="Database not found or access denied")
            
        user_db.pop("_id", None)
        return user_db

    async def get_db_data(self, db, db_id: str, user_id: str, page: int = 1, page_size: int = 100):
        # Verify user owns the database
        user_db = await db["user_databases"].find_one({"id": db_id, "user_id": user_id})
        if not user_db:
            raise HTTPException(status_code=403, detail="Access denied. You do not own this database.")
            
        try:
            collection = db[db_id]
            skip = (page - 1) * page_size
            
            # Count total for pagination
            total = await collection.count_documents({"_user_id": user_id})
            
            cursor = collection.find({"_user_id": user_id}).skip(skip).limit(page_size)
            results = await cursor.to_list(length=page_size)
            
            # Convert ObjectIds to strings and remove internal fields
            for doc in results:
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])
                doc.pop('_user_id', None)
                    
            return {
                "success": True, 
                "data": results, 
                "schema": user_db.get("schema", []),
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": total,
                    "total_pages": (total + page_size - 1) // page_size if total > 0 else 0
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching database records: {str(e)}")

    async def update_db_permissions(self, db, db_id: str, user_id: str, permissions: str):
        try:
            result = await db["user_databases"].update_one(
                {"id": db_id, "user_id": user_id},
                {"$set": {"permissions": permissions}}
            )
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Database not found or unauthorized")
            return {"success": True, "message": "Permissions updated successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating permissions: {str(e)}")

    async def delete_database(self, db, db_id: str, user_id: str):
        # Verify ownership
        user_db = await db["user_databases"].find_one({"id": db_id, "user_id": user_id})
        if not user_db:
            raise HTTPException(status_code=404, detail="Database not found or access denied")
            
        try:
            # Delete the metadata entry FIRST
            await db["user_databases"].delete_one({"id": db_id, "user_id": user_id})
            # Then delete the collection that holds the data
            await db[db_id].drop()
            
            return {"success": True, "message": f"Database '{user_db.get('name', db_id)}' successfully deleted"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete database: {str(e)}")

    async def delete_db_records(self, db, db_id: str, user_id: str, row_ids: List[str]):
        # Verify ownership
        user_db = await db["user_databases"].find_one({"id": db_id, "user_id": user_id})
        if not user_db:
            raise HTTPException(status_code=403, detail="Access denied. You do not own this database.")
        
        try:
            target_ids = []
            for tid in row_ids:
                try:
                    target_ids.append(ObjectId(tid))
                except Exception:
                    target_ids.append(tid) # If it was a string _id
                    
            filter_query = {
                "_id": {"$in": target_ids},
                "_user_id": user_id # Ensure they only delete their own data
            }
            
            result = await db[db_id].delete_many(filter_query)
            
            return {
                "success": True,
                "deleted_count": result.deleted_count,
                "message": f"Successfully deleted {result.deleted_count} records."
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting records: {str(e)}")
