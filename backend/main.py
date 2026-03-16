import os
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from config import settings, limiter
from services.logger import logger
from routes.query import router

app = FastAPI(title="InsightAI BI Dashboard API", version="2.0.0")

# ── Rate limiter ──────────────────────────────────────────────────────────────
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    logger.warning(f"Rate limit exceeded for {request.client.host}: {exc.detail}")
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "error": f"Rate limit exceeded: {exc.detail}. Please wait before making more requests.",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Router ────────────────────────────────────────────────────────────────────
app.include_router(router)


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    logger.info("Starting InsightAI API …")

    # Validate GEMINI_API_KEY
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "":
        logger.error(
            "GEMINI_API_KEY is missing or empty! Set it in backend/.env. "
            "The /api/query endpoint will fail without it."
        )
    else:
        logger.info("GEMINI_API_KEY is configured.")

    # Validate DB exists
    if not os.path.exists(settings.DB_PATH):
        logger.warning(f"Database not found at {settings.DB_PATH}. Run data/load_db.py first.")
    else:
        logger.info(f"Database found at {settings.DB_PATH}")

    logger.info(f"CORS origins: {settings.CORS_ORIGINS}")
    logger.info("InsightAI API ready.")


@app.get("/")
def health_check():
    return {"status": "ok", "message": "InsightAI API is running"}