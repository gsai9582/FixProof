import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, reports, officer, verification, accountability, health

# Create database tables
Base.metadata.create_all(bind=engine)

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FixProof Civic Resolution Verification API - Don't just report it. Prove it's fixed.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for photos
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers under /api
api_prefix = settings.API_V1_STR
app.include_router(health.router)
app.include_router(auth.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(officer.router, prefix=api_prefix)
app.include_router(verification.router, prefix=api_prefix)
app.include_router(accountability.router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "tagline": settings.PROJECT_TAGLINE,
        "docs": "/docs",
        "health": "/health"
    }
