import os
import json
import re
import time
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=API_KEY)

MODEL_NAME = "gemini-2.5-flash"


def extract_json(text):
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


def query_gemini(prompt, max_retries=3):
    model = genai.GenerativeModel(
        MODEL_NAME,
        generation_config={
            "temperature": 0.1,
            "max_output_tokens": 4096,
        },
    )

    last_error = None
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
                print(f"Rate limited. Waiting {wait_time}s before retry {attempt + 1}...")
                time.sleep(wait_time)
                continue
            elif attempt < max_retries:
                time.sleep(2 * (attempt + 1))
                continue
            break

    raise last_error