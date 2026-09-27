from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from pydantic import BaseModel
import google.generativeai as genai
from app.config import settings

router = APIRouter()

# Initialize Gemini if key exists
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_context: dict = None

@router.post("")
def chat_with_expert(request: ChatRequest):
    if not model:
        raise HTTPException(status_code=500, detail="AI engine not configured")
        
    try:
        # Build prompt history
        history = []
        for msg in request.messages[:-1]:
            # Convert UI roles to Gemini roles
            role = "user" if msg.role == "user" else "model"
            history.append({"role": role, "parts": [msg.content]})
            
        chat = model.start_chat(history=history)
        
        # Inject user context into the final prompt
        context_str = ""
        if request.user_context:
            context_str = f"\n[System Context: The user's uploaded tax data is: {request.user_context}]\n"
            
        system_instructions = "You are an expert Indian Chartered Accountant (CA) named NexTax AI. You give concise, accurate advice based on Indian Income Tax laws for FY 24-25. "
        
        final_prompt = system_instructions + context_str + request.messages[-1].content
        
        response = chat.send_message(final_prompt)
        
        return {"reply": response.text}
        
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
