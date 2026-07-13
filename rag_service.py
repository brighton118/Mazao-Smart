import os
import argparse
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import auth_db

# Load env variables from .env if present
load_dotenv()

# Clean environment variables from UTF-8 BOM if written by PowerShell
for key in list(os.environ.keys()):
    if key.startswith('\ufeff'):
        os.environ[key.replace('\ufeff', '')] = os.environ[key]

# LangChain and Chroma imports
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
import google.generativeai as genai

app = FastAPI(title="AgriSense AI RAG Backend")

# Setup CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow requests from Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
KNOWLEDGE_BASE_DIR = os.path.join(CURRENT_DIR, "knowledge_base")
CHROMA_DB_DIR = os.path.join(CURRENT_DIR, "chroma_db")

# Global vector store reference
vectorstore = None

def init_vector_store():
    global vectorstore
    print("Initializing local embeddings model (all-MiniLM-L6-v2)...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # Check if vector db exists and has content, otherwise compile it
    if os.path.exists(CHROMA_DB_DIR) and len(os.listdir(CHROMA_DB_DIR)) > 0:
        print(f"Loading existing vector store from: {CHROMA_DB_DIR}")
        vectorstore = Chroma(persist_directory=CHROMA_DB_DIR, embedding_function=embeddings)
    else:
        print("Vector store not found. Building index from knowledge base...")
        if not os.path.exists(KNOWLEDGE_BASE_DIR):
            os.makedirs(KNOWLEDGE_BASE_DIR)
            print(f"Created empty knowledge base directory at {KNOWLEDGE_BASE_DIR}")
            
        all_docs = []
        for filename in os.listdir(KNOWLEDGE_BASE_DIR):
            if filename.endswith(".md") or filename.endswith(".txt"):
                file_path = os.path.join(KNOWLEDGE_BASE_DIR, filename)
                print(f"Loading document: {file_path}")
                try:
                    loader = TextLoader(file_path, encoding="utf-8")
                    all_docs.extend(loader.load())
                except Exception as e:
                    print(f"Error loading {filename}: {e}")
                    
        if len(all_docs) == 0:
            print("No documents found in knowledge base. Creating basic vector store.")
            # Create a placeholder document to avoid initialization errors
            from langchain_core.documents import Document
            all_docs = [Document(page_content="AgriSense Smart Soil Moisture System is online.", metadata={"source": "system"})]
            
        # Split documents
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=100)
        chunks = text_splitter.split_documents(all_docs)
        print(f"Split documents into {len(chunks)} chunks.")
        
        # Build and persist index
        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=CHROMA_DB_DIR
        )
        print(f"Vector store successfully built and saved to: {CHROMA_DB_DIR}")

# Define API Schema
class ChatRequest(BaseModel):
    query: str
    state: Dict[str, Any]
    history: Optional[List[Dict[str, Any]]] = []

@app.on_event("startup")
async def startup_event():
    init_vector_store()

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "api_key_configured": bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")),
        "vector_store_initialized": vectorstore is not None
    }

# Auth endpoints & requests
class RegisterRequest(BaseModel):
    full_name: str
    username: str
    email: str
    phone: str
    national_id: Optional[str] = None
    password: str
    role: str
    farm_name: str
    farm_location: str
    preferred_language: Optional[str] = 'en'

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    full_name: str
    phone: str
    national_id: Optional[str] = None
    farm_name: str
    farm_location: str
    preferred_language: Optional[str] = 'en'

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class AvatarUploadRequest(BaseModel):
    image_base64: str

class ForgotPasswordRequest(BaseModel):
    email_or_username: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ")[1]
    user = auth_db.verify_session(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid token")
    return user

@app.post("/api/auth/register")
async def register(req: RegisterRequest):
    if not req.full_name or not req.username or not req.email or not req.phone or not req.password or not req.role or not req.farm_name or not req.farm_location:
         raise HTTPException(status_code=400, detail="All required fields must be supplied")
    
    existing_user = auth_db.get_user_by_username_or_email(req.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username is already taken")
    existing_email = auth_db.get_user_by_username_or_email(req.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email is already registered")
        
    try:
        user_id = auth_db.create_user(req.dict())
        return {"status": "success", "message": "User registered successfully", "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    user = auth_db.get_user_by_username_or_email(req.username_or_email)
    if not user or not auth_db.verify_password(req.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")
        
    if user.get('account_status', 'active') != 'active':
        raise HTTPException(status_code=403, detail="Account is suspended or inactive")
        
    token = auth_db.create_session(user['id'])
    refresh_token = auth_db.create_refresh_token(user['id'])
    auth_db.update_last_login(user['id'])
    
    user_data = dict(user)
    user_data.pop('password_hash', None)
    
    return {
        "status": "success",
        "token": token,
        "refresh_token": refresh_token,
        "user": user_data
    }

@app.post("/api/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        auth_db.delete_session(token)
    return {"status": "success", "message": "Logged out successfully"}

@app.post("/api/auth/refresh")
async def refresh_token(req: dict):
    rt = req.get("refresh_token")
    if not rt:
        raise HTTPException(status_code=400, detail="Refresh token required")
    ref = auth_db.verify_refresh_token(rt)
    if not ref:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    user_id = ref['user_id']
    user = auth_db.get_user_by_id(user_id)
    if not user:
         raise HTTPException(status_code=401, detail="User not found")
         
    token = auth_db.create_session(user_id)
    return {"status": "success", "token": token}

@app.get("/api/auth/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    user_data = dict(user)
    user_data.pop('password_hash', None)
    return user_data

@app.post("/api/auth/profile/update")
async def update_profile(req: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    try:
        auth_db.update_user_profile(user['id'], req.dict())
        updated = auth_db.get_user_by_id(user['id'])
        updated_data = dict(updated)
        updated_data.pop('password_hash', None)
        return {"status": "success", "message": "Profile updated successfully", "user": updated_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/profile/password")
async def change_password(req: PasswordChangeRequest, user: dict = Depends(get_current_user)):
    if not auth_db.verify_password(req.current_password, user['password_hash']):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    try:
        auth_db.update_user_password(user['id'], req.new_password)
        return {"status": "success", "message": "Password changed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/profile/image")
async def upload_avatar(req: AvatarUploadRequest, user: dict = Depends(get_current_user)):
    try:
        auth_db.update_user_avatar(user['id'], req.image_base64)
        return {"status": "success", "message": "Profile image updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    user = auth_db.get_user_by_username_or_email(req.email_or_username)
    if not user:
        return {"status": "success", "message": "If the account exists, a recovery token has been processed."}
    
    token = auth_db.generate_reset_token(user['id'])
    return {
        "status": "success", 
        "message": "Reset token generated. For testing/demo, please use this token:",
        "token": token
    }

@app.post("/api/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    user_id = auth_db.verify_reset_token(req.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    try:
        auth_db.update_user_password(user_id, req.new_password)
        auth_db.invalidate_reset_token(req.token)
        return {"status": "success", "message": "Password reset successfully. You can now login with your new password."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    # Determine API key
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not gemini_key:
        return {
            "error": "Gemini API key is not configured. Please create a `.env` file under the project directory containing `GEMINI_API_KEY=your_key` or set it in your environment.",
            "response": "ERROR: Gemini API Key is missing. Please add a `.env` file containing `GEMINI_API_KEY=your_key` to start the vector RAG assistant. In the meantime, I am using the offline backup agronomy agent to reply."
        }

    try:
        # 1. Retrieve relevant documentation from Chroma
        retrieved_context = ""
        if vectorstore:
            # Fetch top 3 matches
            results = vectorstore.similarity_search(request.query, k=3)
            retrieved_context = "\n\n".join([f"--- Source: {doc.metadata.get('source', 'unknown')} ---\n{doc.page_content}" for doc in results])
        
        # 2. Extract Real-Time Telemetry Context from Frontend Payload
        sim_state = request.state
        sensors_list = sim_state.get("sensors", [])
        
        sensors_summary = []
        for s in sensors_list:
            status_desc = f"Moisture: {s.get('moisture')}% (min: {s.get('minMoisture')}%, max: {s.get('maxMoisture')}%), Temp: {s.get('temp')}°C, Online: {s.get('online')}, Irrigating: {s.get('irrigating')}"
            sensors_summary.append(f"- Node {s.get('id')} ({s.get('plot')} - {s.get('crop')}): {status_desc}")
            
        sensors_str = "\n".join(sensors_summary) if sensors_summary else "No active sensors registered."
        
        alerts_list = sim_state.get("log", [])
        active_alerts = [log.get("message") for log in alerts_list if log.get("type") == "alert"]
        alerts_str = "\n".join([f"- {alert}" for alert in active_alerts]) if active_alerts else "No active sensor warning alerts."
        
        realtime_telemetry = f"""
WEATHER STATS:
- Current Weather Condition: {sim_state.get('weather', 'sunny').upper()}
- Solar Array Output: {sim_state.get('solarOutput', 0)} Watts
- Center Battery Level: {sim_state.get('batteryLevel', 0)}%
- Water Tank Level: {sim_state.get('tankLevel', 0)} / 5,000 Litres ({(sim_state.get('tankLevel', 0)/5000*100):.1f}% full)
- Central Pump Status: {"ACTIVE (Vibrating)" if sim_state.get('pumpActive', False) else "INACTIVE (0 RPM)"}

SENSOR NODES STATUS:
{sensors_str}

ACTIVE TELEMETRY ALERTS:
{alerts_str}
        """

        # 3. Formulate Prompt
        system_instruction = f"""You are AgriSense AI, a highly specialized, context-aware digital agronomist and automated assistant for our Soil Moisture Monitoring System dashboard.
You must answer queries using a combination of the retrieved system documentation and the live telemetry state of the farm.

Retrieved System & Hardware Documentation:
=========================================
{retrieved_context}
=========================================

Current Farm Telemetry State:
============================
{realtime_telemetry}
============================

Instructions:
1. Ground your answers in the retrieved documentation and the live telemetry. Be precise about depth values, crops, and thresholds.
2. If any node is displaying critical moisture (below threshold), prioritize warning the user and suggest specific instructions (e.g. check valve controls or MPPT load).
3. If reservoir tank levels are under 20% (1,000 Litres), remind the operator of dry run hazards.
4. Keep your responses structured, clear, and action-oriented. Use Markdown bullet points, tables, or alerts where appropriate.
5. If the documentation or telemetry has sufficient details, answer fully. Do not make up facts or sensor IDs.
6. Address the user directly and concisely.
"""

        # 4. Integrate LLM with google-generativeai
        genai.configure(api_key=gemini_key)
        
        # Configure model
        model = genai.GenerativeModel(
            model_name="gemini-3.5-flash",
            system_instruction=system_instruction
        )
        
        # Structure the chat session including conversational history
        chat = model.start_chat()
        
        # Inject preceding history if it exists
        if request.history:
            # Map history into google genai chat history content structure if desired.
            # Alternately, we can concatenate chat history in the prompt or pass it inside chat.send_message.
            pass

        # Call Gemini API
        response = chat.send_message(request.query)
        
        return {
            "response": response.text,
            "api": "gemini"
        }
        
    except Exception as e:
        print(f"Error querying Gemini: {e}")
        return {
            "error": str(e),
            "response": f"ERROR: The AI Copilot encountered an error querying the Gemini API model: '{str(e)}'. Please check your configuration. In the meantime, I am using the offline backup agronomy agent to reply."
        }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run AgriSense RAG API Server")
    parser.add_argument("--init-db", action="store_true", help="Force rebuild ChromaDB and exit")
    parser.add_argument("--port", type=int, default=8445, help="Port to run FastAPI server")
    args = parser.parse_args()
    
    if args.init_db:
        # Clear existing Chroma DB and force rebuild on command line
        import shutil
        if os.path.exists(CHROMA_DB_DIR):
            print(f"Force clearing Chroma DB at {CHROMA_DB_DIR}")
            shutil.rmtree(CHROMA_DB_DIR)
        init_vector_store()
        print("ChromaDB rebuild completed successfully.")
    else:
        import uvicorn
        uvicorn.run(app, host="127.0.0.1", port=args.port)
