from typing import Optional, Dict, Any, List

GREETINGS = {
    "hi", "hello", "hey", "howdy", "greetings", "hiya", "yo", "sup",
    "good morning", "good afternoon", "good evening", "good night",
    "what's up", "whats up", "wassup", "hola", "namaste",
    "hi there", "hello there", "hey there",
}

THANKS = {
    "thanks", "thank you", "thx", "ty", "appreciated",
    "thanks a lot", "thank you so much", "many thanks",
    "thanks!", "thank you!", "great thanks",
}

FAREWELL = {
    "bye", "goodbye", "see you", "see ya", "later", "cya",
    "take care", "have a good day", "good bye",
}

HELP_PATTERNS = [
    "what can you do", "how do i use", "what is this", "how does this work",
    "help me", "capabilities", "what do you do", "how to use", "guide me",
    "how do you work", "what are your features", "show me features",
]

ABOUT_PATTERNS = [
    "who are you", "what are you", "tell me about yourself",
    "introduce yourself", "your name", "who made you", "who built you",
    "what is insightai", "what is insight ai",
]

DATA_KEYWORDS = [
    "show", "compare", "total", "average", "count", "sum", "top", "bottom",
    "trend", "distribution", "views", "likes", "comments", "shares",
    "category", "region", "language", "monthly", "daily", "sentiment",
    "highest", "lowest", "most", "least", "between", "where", "group",
    "chart", "graph", "plot", "table", "data", "query", "select",
    "videos", "subscribers", "monetized", "ads", "engagement",
    "percentage", "ratio", "growth", "decline", "increase", "decrease",
    "how many", "how much", "list", "give me", "fetch", "get",
]

# ── UPDATE 6: modification detection ──────────────────────────────────────
MODIFICATION_PATTERNS = [
    "filter this", "only show", "exclude", "now show only", "narrow down",
    "break this down", "drill into", "zoom into", "drill down",
    "change this to", "show as", "switch to", "convert to", "make it a",
    "sort by", "order by",
    "same but for", "compare with", "now compare", "instead of",
    "but only", "but for", "limit to", "restrict to",
    "change the chart", "show it as",
    "as a pie", "as a line", "as a bar", "as an area", "as a scatter",
]

CHART_TYPE_KEYWORDS: Dict[str, str] = {
    "pie chart": "pie", "pie": "pie",
    "line chart": "line", "line graph": "line", "line": "line",
    "bar chart": "bar", "bar graph": "bar", "bar": "bar",
    "area chart": "area", "area": "area",
    "scatter plot": "scatter", "scatter": "scatter",
    "donut chart": "donut", "donut": "donut",
}


def _clean(text: str) -> str:
    return text.strip().lower().rstrip("?!.,;:")


def _has_data_intent(text: str) -> bool:
    q = _clean(text)
    return any(kw in q for kw in DATA_KEYWORDS)


# ── public API ────────────────────────────────────────────────────────────
def is_conversational(query: str) -> bool:
    q = _clean(query)
    words = q.split()

    if q in GREETINGS or q in THANKS or q in FAREWELL:
        return True

    for pattern in HELP_PATTERNS + ABOUT_PATTERNS:
        if pattern in q:
            return True

    if len(words) <= 4 and not _has_data_intent(q):
        for w in words:
            if w in GREETINGS or w in THANKS or w in FAREWELL:
                return True
        for i in range(len(words) - 1):
            bigram = words[i] + " " + words[i + 1]
            if bigram in GREETINGS or bigram in THANKS or bigram in FAREWELL:
                return True

    if len(words) <= 2 and not _has_data_intent(q):
        casual = {
            "ok", "okay", "sure", "nice", "cool", "great", "awesome",
            "wow", "lol", "haha", "yes", "no", "yep", "nope", "hmm",
            "interesting", "perfect", "amazing", "good", "fine",
        }
        if q in casual or words[0] in casual:
            return True

    return False


def is_modification_request(query: str) -> bool:
    """Return True when the user wants to tweak the previous result."""
    q = _clean(query)
    for pat in MODIFICATION_PATTERNS:
        if pat in q:
            return True
    for chart_name in CHART_TYPE_KEYWORDS:
        if chart_name in q and any(
            w in q for w in ("show", "change", "make", "as a", "switch", "convert")
        ):
            return True
    return False


def get_chart_type_from_modification(query: str) -> Optional[str]:
    """If the modification is *only* a chart-type change, return it."""
    q = _clean(query)
    for name, ctype in CHART_TYPE_KEYWORDS.items():
        if name in q:
            return ctype
    return None


def get_conversational_response(query: str) -> Optional[Dict[str, Any]]:
    q = _clean(query)

    if q in GREETINGS or any(
        g in q
        for g in ["hello", "hey", "hi", "good morning", "good afternoon", "good evening"]
    ):
        return {
            "insight": (
                "Hello! I'm InsightAI, your AI-powered data analyst. "
                "I can help you explore your data by answering questions in plain English.\n\n"
                "Try asking something like:\n"
                "- Show me total views by category\n"
                "- What's the monthly trend of likes?\n"
                "- Which region has the highest engagement?\n\n"
                "What would you like to know about your data?"
            ),
            "follow_up_questions": [
                "Show me the total views by category",
                "What is the distribution of videos across languages?",
                "Which region has the highest engagement rate?",
            ],
        }

    if q in THANKS or "thank" in q:
        return {
            "insight": (
                "You're welcome! I'm glad I could help. "
                "Feel free to ask more questions about your data anytime."
            ),
            "follow_up_questions": [
                "Show me another interesting trend",
                "Compare monetized vs non-monetized videos",
                "What's the average sentiment by category?",
            ],
        }

    if q in FAREWELL or "bye" in q or "goodbye" in q:
        return {
            "insight": "Goodbye! Come back anytime you need insights.",
            "follow_up_questions": [],
        }

    casual_positive = {
        "ok", "okay", "sure", "nice", "cool", "great", "awesome",
        "wow", "amazing", "perfect", "good", "fine", "interesting",
    }
    casual_negative = {"no", "nope", "hmm", "nah"}
    casual_other = {"yes", "yep", "yeah", "lol", "haha"}

    if q in casual_positive:
        return {
            "insight": "Glad to hear that! Want to explore more of your data?",
            "follow_up_questions": [
                "Show me the top 5 categories by total views",
                "What is the sentiment trend over time?",
                "Compare engagement across regions",
            ],
        }
    if q in casual_negative:
        return {
            "insight": "No worries! Let me know if you'd like to ask something else.",
            "follow_up_questions": [
                "Show me total views by category",
                "What's the distribution of videos by language?",
                "Which videos have the most likes?",
            ],
        }
    if q in casual_other:
        return {
            "insight": "Got it! What would you like to explore next?",
            "follow_up_questions": [
                "Show monthly trends for 2024",
                "Compare monetized vs non-monetized videos",
                "What is the average duration by category?",
            ],
        }

    for pattern in HELP_PATTERNS:
        if pattern in q:
            return {
                "insight": (
                    "I'm InsightAI, your AI-powered BI dashboard assistant. Here's what I can do:\n\n"
                    "- Ask data questions in plain English\n"
                    "- Auto-generate charts and visualizations\n"
                    "- Provide KPI insights with executive summaries\n"
                    "- Upload and analyze CSV datasets\n"
                    "- Switch between multiple datasets\n"
                    "- Export as PNG, CSV, or PDF reports\n"
                    "- Voice input via microphone\n\n"
                    "Shortcuts: Ctrl+K (focus input), Ctrl+/ (toggle sidebar), Escape (close modals)"
                ),
                "follow_up_questions": [
                    "Show me the total views by category",
                    "Compare average likes across regions",
                    "Show monthly video publish trends for 2024",
                ],
            }

    for pattern in ABOUT_PATTERNS:
        if pattern in q:
            return {
                "insight": (
                    "I'm InsightAI, an AI-powered Business Intelligence dashboard.\n\n"
                    "Built with Google Gemini AI, FastAPI, Recharts, and Next.js. "
                    "I can analyze datasets with millions of rows and generate SQL queries, "
                    "charts, KPIs, and insights from simple English questions."
                ),
                "follow_up_questions": [
                    "Show me something interesting about the data",
                    "What categories are available?",
                    "Show total views by region",
                ],
            }

    return None