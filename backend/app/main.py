from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import init_db
from app.routes import auth, customers, frames, reservations, prescriptions, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    yield

app = FastAPI(
    title="SpecsUp - Optical Care API",
    description="Full-stack Optical Shop, Prescription Management & Trend Analysis API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all route modules
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(frames.router)
app.include_router(reservations.router)
app.include_router(prescriptions.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {
        "app": "SpecsUp API",
        "status": "healthy",
        "message": "Welcome to SpecsUp - Optical Care & Trend Analysis API"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "specsup-backend"}

