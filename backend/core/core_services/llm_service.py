# pyrefly: ignore [missing-import]
import asyncio
import json
import logging
import re

from fastapi import HTTPException

# pyrefly: ignore [missing-import]
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

class NLPQueryEngine:
    def __init__(self):
        # Configure NVIDIA API via AsyncOpenAI client
        import os
        api_key = os.getenv("NVIDIA_API_KEY")
        if not api_key:
            logger.warning("NVIDIA_API_KEY is not configured properly in .env")
        else:
            self.client = AsyncOpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=api_key
            )
            # Falling back to meta/llama-3.1-70b-instruct as nemotron models return 404 on this account
            self.model_name = "meta/llama-3.1-70b-instruct"
            
        self.semaphore = asyncio.Semaphore(5)
            
    async def generate_mongo_pipeline(self, natural_language_query: str, schema: str) -> dict:
        """
        Translates a natural language query into a MongoDB aggregation pipeline using NVIDIA API.
        """
        if not hasattr(self, 'client'):
            raise Exception("NVIDIA API is not configured.")

        prompt = f"""
        You are an expert MongoDB database administrator and data analyst.
        I will give you a natural language query and a JSON schema describing my MongoDB collections.
        
        Determine if the user wants to FETCH data (select), UPDATE data (update), or DELETE data (delete).
        
        You must output ONLY a valid JSON object with the following structure:
        {{
          "intent": "select" | "update" | "delete",
          "pipeline": [...], 
          "update_statement": {{"$set": {{...}}}} // Include ONLY if intent is "update"
        }}
        
        Rules for "pipeline":
        - For a "select" intent, this is the standard aggregation pipeline to fetch the requested data.
        - ADVANCED AGGREGATIONS: You MUST support complex aggregations ($group, $sum, $avg, $min, $max, $count) if the query implies statistical or summarized data.
        - For "update" or "delete" intents, this pipeline MUST fetch EXACTLY the rows that will be affected by the mutation (so we can show the user a preview of what will change). E.g., if the user says "Change Priya's salary", the pipeline should find Priya's document.
        - IMPORTANT: When filtering by string fields (like names, titles, departments), ALWAYS use case-insensitive regular expressions (e.g., {{"$regex": "Priya", "$options": "i"}}) rather than exact matches, so that partial names like "Priya Patel" will successfully match.
        
        Rules for "update_statement":
        - Provide this ONLY for "update" intent. It must be a valid MongoDB update operator document (e.g. {{"$set": {{"salary": 10000}}}}).
        
        Do not output any markdown formatting, explanations, or code blocks. Just the raw JSON object.
        
        CRITICAL RULE: If the user query is generic (e.g. "fetch data", "show data") and does not specify any particular condition, set intent to "select" and return an empty pipeline `[]`.
        
        Database Schema:
        {schema}
        
        User Query: "{natural_language_query}"
        
        MongoDB Output (JSON Object):
        """
        
        try:
            async with self.semaphore:
                completion = await asyncio.wait_for(
                    self.client.chat.completions.create(
                        model=self.model_name,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.1,
                        top_p=1,
                        max_tokens=1024,
                    ),
                    timeout=60.0
                )
            
            output = completion.choices[0].message.content.strip()
            
            # Clean up the response in case the LLM returned markdown code blocks
            if output.startswith("```json"):
                output = output[7:]
            if output.startswith("```"):
                output = output[3:]
            if output.endswith("```"):
                output = output[:-3]
                
            pipeline = json.loads(output.strip())
            return pipeline
        except asyncio.TimeoutError:
            logger.error("LLM request timed out.")
            raise HTTPException(status_code=408, detail="Request to AI service timed out.")
        except Exception as e:
            logger.error(f"Error generating pipeline from NVIDIA API: {e}")
            raise HTTPException(status_code=400, detail="Failed to parse LLM response as valid JSON.")

    async def generate_global_mongo_pipeline(self, natural_language_query: str, all_schemas_dict: dict) -> dict:
        """
        Determines the best database to query and translates a natural language query into a MongoDB aggregation pipeline.
        """
        if not hasattr(self, 'client'):
            raise Exception("NVIDIA API is not configured.")

        # Convert schemas dict to string representation for the prompt
        schemas_str = json.dumps(all_schemas_dict, indent=2)

        prompt = f"""
        You are an expert MongoDB database administrator and data analyst.
        I will give you a natural language query and a dictionary of MULTIPLE database schemas. Each key in the dictionary is a database ID (e.g. 'db_123'), and the value is the schema for that database.
        
        Your tasks:
        1. Read the user's natural language query. Note that users often use shortcuts or abbreviations (e.g., 'dept' means 'department', 'qty' means 'quantity', 'emp' means 'employee'). Use your semantic understanding to bridge these gaps.
        2. Analyze all the provided schemas and determine WHICH primary database (by its ID key) should be queried to answer the user's question.
        3. Determine if the user wants to FETCH data (select), UPDATE data (update), or DELETE data (delete).
        4. Generate the corresponding MongoDB aggregation pipeline for the primary database.
        
        You must output ONLY a valid JSON object with the following structure:
        {{
          "target_db_id": "the_id_of_the_primary_database",
          "intent": "select" | "update" | "delete",
          "pipeline": [...], 
          "update_statement": {{"$set": {{...}}}} // Include ONLY if intent is "update"
        }}
        
        Rules for "pipeline":
        - For a "select" intent, this is the standard aggregation pipeline to fetch the requested data.
        - ADVANCED AGGREGATIONS: You MUST support complex aggregations ($group, $sum, $avg, $min, $max, $count) if the query implies statistical or summarized data.
        - CROSS-COLLECTION JOINS: If the query requires combining data from MULTIPLE schemas provided above, you MUST use the `$lookup` aggregation stage. Treat the other database IDs as collection names in the `$lookup` stage (e.g., {{"$lookup": {{"from": "db_other_id", "localField": "...", "foreignField": "...", "as": "joined_data"}} }}). This simulates a Left Outer Join.
        - For "update" or "delete" intents, this pipeline MUST fetch EXACTLY the rows that will be affected by the mutation.
        - IMPORTANT: When filtering by string fields, ALWAYS use case-insensitive regular expressions (e.g., {{"$regex": "Priya", "$options": "i"}}).
        
        Do not output any markdown formatting, explanations, or code blocks. Just the raw JSON object.
        
        Database Schemas:
        {schemas_str}
        
        User Query: "{natural_language_query}"
        
        MongoDB Output (JSON Object):
        """
        
        try:
            async with self.semaphore:
                completion = await asyncio.wait_for(
                    self.client.chat.completions.create(
                        model=self.model_name,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.1,
                        top_p=1,
                        max_tokens=1024,
                    ),
                    timeout=60.0
                )
            
            output = completion.choices[0].message.content.strip()
            
            if output.startswith("```json"):
                output = output[7:]
            if output.startswith("```"):
                output = output[3:]
            if output.endswith("```"):
                output = output[:-3]
                
            result = json.loads(output.strip())
            return result
        except asyncio.TimeoutError:
            logger.error("LLM request timed out.")
            raise HTTPException(status_code=408, detail="Request to AI service timed out.")
        except Exception as e:
            logger.error(f"Error generating global pipeline from NVIDIA API: {e}")
            raise HTTPException(status_code=400, detail="Failed to parse LLM response as valid JSON.")

    async def generate_insights(self, data_context: str, business_context: str) -> str:
        """
        Generates business insights based on data and business context.
        """
        if not hasattr(self, 'client'):
            raise Exception("NVIDIA API is not configured.")

        prompt = f"""
        You are an expert business analyst.
        Based on this chart data: {data_context} 
        
        Business Context: {business_context}
        
        First, provide a brief explanation of what the chart is showing.
        Then, generate 3-4 business insights and recommendations based on the data and business context.
        Finally, create a 6-month strategic roadmap with specific actionable steps for each month.
        
        Format the response STRICTLY as JSON with this structure (no markdown tags):
        {{
          "chartExplanation": "Brief explanation",
          "insights": [
            {{
              "title": "Insight title",
              "description": "Detailed insight",
              "type": "trend|anomaly|opportunity|risk"
            }}
          ],
          "roadmap": {{
            "month1": {{ "title": "Month 1: Focus", "actions": ["Action 1", "Action 2"] }},
            "month2": {{ "title": "Month 2: Focus", "actions": ["Action 1", "Action 2"] }},
            "month3": {{ "title": "Month 3: Focus", "actions": ["Action 1", "Action 2"] }},
            "month4": {{ "title": "Month 4: Focus", "actions": ["Action 1", "Action 2"] }},
            "month5": {{ "title": "Month 5: Focus", "actions": ["Action 1", "Action 2"] }},
            "month6": {{ "title": "Month 6: Focus", "actions": ["Action 1", "Action 2"] }}
          }}
        }}
        """
        
        try:
            async with self.semaphore:
                completion = await asyncio.wait_for(
                    self.client.chat.completions.create(
                        model=self.model_name,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.3,
                        top_p=1,
                        max_tokens=2048,
                    ),
                    timeout=30.0
                )
            
            output = completion.choices[0].message.content.strip()
            
            match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', output, re.DOTALL)
            if match:
                output = match.group(1).strip()
            elif output.startswith('{') and output.endswith('}'):
                output = output
            else:
                match = re.search(r'(\{.*\})', output, re.DOTALL)
                if match:
                    output = match.group(1).strip()
                
            return output.strip()
        except asyncio.TimeoutError:
            logger.error("LLM request timed out.")
            raise HTTPException(status_code=408, detail="Request to AI service timed out.")
        except Exception as e:
            logger.error(f"Error generating insights from NVIDIA API: {e}")
            raise e

    async def chat(self, chat_history: list, user_message: str) -> str:
        """
        Processes a chat message in the context of business strategy.
        """
        if not hasattr(self, 'client'):
            raise Exception("NVIDIA API is not configured.")

        system_prompt = """You are a business strategy assistant.
        You must:
        ✔ Provide data-driven business insights
        ✔ Generate strategic plans and recommendations
        ✔ Focus on trends, opportunities, risks, and KPIs
        ✔ Tailor responses for startups, SMEs, or large enterprises
        
        You must NOT:
        ❌ Answer unrelated questions
        ❌ Provide non-business content
        
        Respond strictly within business analysis, management, growth, and operational strategy."""
        
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in chat_history:
            role = "user" if msg.get("role") == "user" else "assistant"
            content = msg.get("content", "")
            if not content and msg.get("parts"):
                content = msg["parts"][0].get("text", "")
            messages.append({"role": role, "content": content})
            
        messages.append({"role": "user", "content": user_message})
        
        try:
            async with self.semaphore:
                completion = await asyncio.wait_for(
                    self.client.chat.completions.create(
                        model=self.model_name,
                        messages=messages,
                        temperature=0.5,
                        top_p=1,
                        max_tokens=1024,
                    ),
                    timeout=30.0
                )
            return completion.choices[0].message.content.strip()
        except asyncio.TimeoutError:
            logger.error("LLM request timed out.")
            raise HTTPException(status_code=408, detail="Request to AI service timed out.")
        except Exception as e:
            logger.error(f"Error generating chat response from NVIDIA API: {e}")
            raise e
