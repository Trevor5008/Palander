from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.__version__ import __version__
from app.routers import auth, domains, events, objectives, tasks

app = FastAPI(title="Palander API", version=__version__)

app.include_router(auth.router)
app.include_router(domains.router)
app.include_router(events.router)
app.include_router(objectives.router)
app.include_router(tasks.router)

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
