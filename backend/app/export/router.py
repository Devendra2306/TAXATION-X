from fastapi import APIRouter
from fastapi.responses import JSONResponse
from .generator import generate_itr1_json

router = APIRouter(prefix="/api/export", tags=["export"])

@router.get("/itr-json")
async def export_itr_json():
    # In a real app, we'd fetch the user's computed tax data from the DB
    # using their authenticated session.
    
    # Mock data for MVP
    dummy_user = {"pan": "ABCDE1234F", "phone": "9876543210"}
    dummy_computation = {
        "recommendation": "new",
        "new_regime": {"taxable_income": 1200000, "tax": 119600},
        "old_regime": {"taxable_income": 1120000, "tax": 153400}
    }
    
    json_payload = generate_itr1_json(dummy_user, dummy_computation)
    
    # Return as a downloadable JSON file
    return JSONResponse(
        content=json_payload, 
        headers={"Content-Disposition": 'attachment; filename="ITR-1_AY2026-27.json"'}
    )
