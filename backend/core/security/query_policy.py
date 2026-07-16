import json
from fastapi import HTTPException

# Explicitly allowed top-level pipeline stages
ALLOWED_STAGES = {
    "$match", "$project", "$group", "$sort", "$limit", "$skip", "$unwind",
    "$count", "$addFields", "$set", "$replaceRoot", "$facet", "$lookup"
}

# Dangerous stages that are strictly forbidden
FORBIDDEN_STAGES = {
    "$out", "$merge", "$graphLookup", "$function",
    "$accumulator", "$where", "$execute"
}

def validate_mongo_pipeline(pipeline, user_id: str):
    """
    Validates a MongoDB aggregation pipeline to prevent NoSQL injection,
    cross-tenant data access, and unsafe operations.
    """
    if not isinstance(pipeline, list):
        raise HTTPException(status_code=400, detail="Pipeline must be a list of stages.")

    if len(pipeline) > 20:
        raise HTTPException(status_code=400, detail="Pipeline is too complex (exceeds maximum depth).")

    validated_pipeline = []

    # Inject forced tenant isolation as the very first stage
    validated_pipeline.append({
        "$match": {
            "_user_id": user_id
        }
    })

    for stage in pipeline:
        if not isinstance(stage, dict):
            raise HTTPException(status_code=400, detail="Invalid pipeline format: stage is not an object.")

        keys = list(stage.keys())
        if len(keys) != 1:
            raise HTTPException(status_code=400, detail="Invalid pipeline format: stage object must have exactly one operator.")

        operator = keys[0]

        if operator in FORBIDDEN_STAGES:
            raise HTTPException(status_code=403, detail=f"Forbidden aggregation stage: {operator}")
            
        if operator not in ALLOWED_STAGES:
            raise HTTPException(status_code=403, detail=f"Unrecognized or disallowed aggregation stage: {operator}")
            
        if operator == "$lookup":
            lookup_stage = stage.get("$lookup", {})
            target_col = lookup_stage.get("from", "")
            if not isinstance(target_col, str) or not target_col.startswith("db_"):
                raise HTTPException(status_code=403, detail="Forbidden: You can only join against your own datasets.")

        validated_pipeline.append(stage)

    # Convert to JSON and back to catch any un-serializable/weird objects, and check for forbidden text
    pipeline_str = json.dumps(validated_pipeline)
    if "$where" in pipeline_str or "$function" in pipeline_str or "$accumulator" in pipeline_str:
        raise HTTPException(status_code=403, detail="Forbidden script execution operators found in pipeline.")

    return validated_pipeline
