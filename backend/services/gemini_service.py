import json
import re
import time

import google.generativeai as genai

from config import settings
from services.logger import logger

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not set – Gemini calls will fail.")


def extract_json(text: str) -> dict:
    text = text.strip()

    if text.startswith("{"):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract JSON from Gemini response:\n{text[:300]}")


def query_gemini(prompt: str, max_retries: int = 3) -> dict:
    if not settings.GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured. Set it in backend/.env"
        )

    model = genai.GenerativeModel(
        settings.GEMINI_MODEL,
        generation_config={
            "temperature": 0.1,
            "max_output_tokens": 4096,
        },
    )

    last_error: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            response = model.generate_content(prompt)
            if not response.text:
                raise ValueError("Gemini returned empty response")
            return extract_json(response.text)
        except Exception as e:
            last_error = e
            error_msg = str(e).lower()

            if "429" in error_msg or "quota" in error_msg or "rate" in error_msg:
                wait_time = 10 * (attempt + 1)
                logger.warning(f"Rate limited. Waiting {wait_time}s before retry {attempt + 1}…")
                time.sleep(wait_time)
                continue
            elif attempt < max_retries:
                logger.warning(f"Gemini error (attempt {attempt + 1}): {e}")
                time.sleep(2 * (attempt + 1))
                continue
            break

    raise last_error  # type: ignore[misc]