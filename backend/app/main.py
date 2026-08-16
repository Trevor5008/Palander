from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
# Tracking version library
from app.__version__ import __version__

app = FastAPI(title="Palander API", version=__version__)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
def health():
    # Log the version
    return {"status": "ok", "version": __version__}
