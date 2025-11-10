from .api import elements
from .api import attachments, comments
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .utils import create_tables
from .api import pid_documents

app = FastAPI()
create_tables()

# Add CORS middleware - UPDATE THIS LINE
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://pid-maker.up.railway.app",  # NEW frontend URL
        "https://insightful-vibrancy-production.up.railway.app",  # Keep old one just in case
        "http://localhost:3000"  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(attachments.router, prefix="/api/attachments", tags=["Attachments"])
app.include_router(comments.router, prefix="/api/comments", tags=["Comments"])
app.include_router(elements.router, prefix="/api/elements", tags=["Elements"])
app.include_router(pid_documents.router, prefix="/api/pid_documents", tags=["PID Documents"])

@app.get("/")
def read_root():
    return {"message": "P&ID Marker backend is running!"}
