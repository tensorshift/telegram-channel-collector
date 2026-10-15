import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "bot"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from analyzer import analyze

app = FastAPI(title="Telegram Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze_endpoint(data: dict):
    if "posts" not in data:
        raise HTTPException(status_code=400, detail="Missing 'posts' field in request body")
    try:
        return analyze(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
