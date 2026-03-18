from typing import Optional, Dict, Any, List

GREETINGS = {
    "hi", "hello", "hey", "howdy", "greetings", "hiya", "yo", "sup",
    "good morning", "good afternoon", "good evening", "good night",
    "what's up", "whats up", "wassup", "hola", "namaste",
    "hi there", "hello there", "hey there",
    "morning", "evening", "afternoon",
    "good day", "g'day", "gday",
    "hey buddy", "hi buddy", "hello buddy",
    "hey mate", "hi mate", "hello mate",
    "aloha", "bonjour", "salut",
    "heya", "heyy", "hii", "helloo", "helo",
    "what's good", "whats good",
    "how are you", "how r u", "how are u",
    "how's it going", "hows it going",
    "how do you do", "pleased to meet you",
    "long time no see", "nice to meet you",
    "what's happening", "whats happening",
    "what's new", "whats new",
    "how's everything", "hows everything",
    "how have you been", "how u been",
    "hey man", "hey dude", "hey fam",
    "hi friend", "hello friend", "hey friend",
    "hi bot", "hello bot", "hey bot",
    "hi ai", "hello ai", "hey ai",
    "hi assistant", "hello assistant", "hey assistant",
    "hi matriq", "hello matriq", "hey matriq",
    "greetings and salutations",
}

THANKS = {
    "thanks", "thank you", "thx", "ty", "appreciated",
    "thanks a lot", "thank you so much", "many thanks",
    "thanks!", "thank you!", "great thanks",
    "thanks mate", "thanks buddy", "thanks man", "thanks dude",
    "thank u", "thnx", "thnks", "tysm", "tyvm",
    "thanks a bunch", "thanks a ton", "thanks a million",
    "much appreciated", "really appreciate it", "appreciate it",
    "thank you very much", "thanks very much",
    "thank you kindly", "thanks kindly",
    "grateful", "much obliged", "cheers",
    "thanks for the help", "thanks for helping",
    "thanks for that", "thanks for this",
    "that was helpful", "very helpful", "super helpful",
    "you're the best", "youre the best", "ur the best",
    "good job", "well done", "nice work", "great work",
    "that's great", "thats great",
    "that's perfect", "thats perfect",
    "exactly what i needed", "just what i needed",
    "this is what i wanted", "perfect answer",
}

FAREWELL = {
    "bye", "goodbye", "see you", "see ya", "later", "cya",
    "take care", "have a good day", "good bye",
    "see you later", "catch you later", "talk later",
    "gotta go", "got to go", "i'm leaving", "im leaving",
    "i'm done", "im done", "i am done",
    "that's all", "thats all", "that is all",
    "nothing else", "no more questions",
    "bye bye", "byebye", "bbye",
    "peace", "peace out", "adios", "au revoir", "ciao",
    "have a nice day", "have a good one", "have a great day",
    "good night", "goodnight", "nite", "nighty night",
    "until next time", "till next time",
    "signing off", "logging off",
    "cheers mate", "later mate", "later dude",
    "see you soon", "see u soon", "see u later",
    "farewell", "so long",
    "i'll be back", "ill be back", "brb",
    "that will be all", "that would be all",
    "no more", "nothing more", "all done", "i'm all done",
    "done for now", "that's it", "thats it",
    "end", "quit", "exit", "close",
}

HELP_PATTERNS = [
    "what can you do", "how do i use", "what is this", "how does this work",
    "help me", "capabilities", "what do you do", "how to use", "guide me",
    "how do you work", "what are your features", "show me features",
    "what are you capable of", "what can i ask",
    "what questions can i ask", "what should i ask",
    "give me examples", "show examples", "example queries",
    "sample questions", "sample queries",
    "how to get started", "getting started", "quick start",
    "user guide", "instructions", "tutorial",
    "help", "show help", "need help", "i need help",
    "what commands", "available commands",
    "show me what you can do", "demonstrate",
    "what kind of questions", "what type of questions",
    "how to query", "how to search", "how to analyze",
    "how to explore", "how to visualize",
    "what formats do you support", "supported formats",
    "how to upload", "how to export",
    "keyboard shortcuts", "shortcuts",
    "tips", "show tips", "any tips",
    "how to chart", "how to graph", "how to plot",
    "can you help", "can you assist", "assist me",
    "what is matriq", "about matriq", "tell me about matriq",
    "how to use this app", "how to use this tool",
    "explain how this works", "explain your features",
]

ABOUT_PATTERNS = [
    "who are you", "what are you", "tell me about yourself",
    "introduce yourself", "your name", "who made you", "who built you",
    "what is insightai", "what is insight ai",
    "what is matriq", "about matriq", "tell me about matriq",
    "who created you", "who developed you", "who designed you",
    "what technology", "tech stack", "what stack",
    "what model do you use", "which ai model", "which llm",
    "are you a bot", "are you ai", "are you real",
    "are you human", "are you a person",
    "what language are you written in",
    "how were you built", "how were you made",
    "your creator", "your developer", "your maker",
    "describe yourself", "about you", "info about you",
    "what's your purpose", "whats your purpose", "your purpose",
    "what are you for", "why do you exist",
    "what can you tell me about yourself",
    "are you chatgpt", "are you gpt", "are you gemini",
    "powered by", "built with", "made with",
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
    "analyze", "analysis", "insight", "insights", "summary", "summarize",
    "statistics", "stats", "stat", "mean", "median", "mode",
    "min", "max", "minimum", "maximum", "range",
    "standard deviation", "std dev", "variance",
    "correlation", "correlate",
    "revenue", "sales", "profit", "cost", "price", "amount",
    "quantity", "volume", "rate", "score", "rating",
    "performance", "metric", "metrics", "kpi", "kpis",
    "year", "quarter", "week", "hour", "date", "time",
    "annual", "quarterly", "weekly", "hourly", "yearly",
    "per month", "per day", "per year", "per week",
    "breakdown", "break down", "split", "segment",
    "filter", "sort", "order", "rank", "ranking",
    "above", "below", "greater", "less", "more than", "fewer",
    "equal", "not equal", "at least", "at most",
    "top 5", "top 10", "top 20", "top 3", "top 100",
    "bottom 5", "bottom 10", "bottom 20", "bottom 3",
    "first", "last", "recent", "latest", "oldest", "newest",
    "unique", "distinct", "duplicate", "null", "missing",
    "outlier", "outliers", "anomaly", "anomalies",
    "forecast", "predict", "prediction", "projection",
    "over time", "time series", "timeline",
    "by category", "by region", "by type", "by group",
    "per category", "per region", "per type", "per group",
    "across", "among", "within",
    "vs", "versus", "compared to", "relative to",
    "what is the", "what are the", "what was the",
    "which", "who", "when", "how",
    "calculate", "compute", "find", "determine",
    "display", "visualize", "render", "generate",
    "pivot", "aggregate", "rollup", "roll up",
    "crosstab", "cross tab", "cross tabulation",
    "histogram", "heatmap", "heat map",
    "customers", "users", "products", "orders", "transactions",
    "employees", "departments", "items", "records", "entries",
    "rows", "columns", "fields", "values",
    "overview", "dashboard", "report",
    "what happened", "what changed", "what improved",
    "why did", "explain why", "reason for",
    "proportion", "share", "fraction", "part",
    "cumulative", "running total", "moving average",
    "year over year", "yoy", "month over month", "mom",
    "week over week", "wow", "day over day", "dod",
    "peak", "trough", "spike", "dip", "plateau",
    "contribute", "contribution", "impact",
]

# ── modification detection ──────────────────────────────────────
MODIFICATION_PATTERNS = [
    "filter this", "only show", "exclude", "now show only", "narrow down",
    "break this down", "drill into", "zoom into", "drill down",
    "change this to", "show as", "switch to", "convert to", "make it a",
    "sort by", "order by",
    "same but for", "compare with", "now compare", "instead of",
    "but only", "but for", "limit to", "restrict to",
    "change the chart", "show it as",
    "as a pie", "as a line", "as a bar", "as an area", "as a scatter",
    "add filter", "remove filter", "apply filter",
    "group by", "ungroup", "regroup",
    "now show", "now display", "now filter",
    "update this", "modify this", "adjust this", "tweak this",
    "refine this", "change this", "alter this",
    "flip it", "reverse it", "invert it",
    "expand this", "collapse this",
    "zoom out", "zoom in", "widen", "narrow",
    "more detail", "more details", "less detail", "less details",
    "add column", "remove column", "hide column", "show column",
    "include", "exclude", "without",
    "ascending", "descending", "asc", "desc",
    "top 5 instead", "top 10 instead", "top 20 instead",
    "same chart but", "same graph but", "same data but",
    "can you also", "also show", "also include", "also add",
    "just the", "just show", "just display",
    "change color", "change colours", "different color",
    "swap axes", "swap axis", "flip axes", "flip axis",
    "make it bigger", "make it smaller", "resize",
    "rename", "relabel", "retitle",
    "percentage instead", "show percentage", "as percentage",
    "absolute instead", "show absolute", "as absolute",
    "normalize", "normalized", "unnormalize",
    "stacked", "unstacked", "grouped", "ungrouped",
    "horizontal", "vertical",
    "with labels", "without labels", "show labels", "hide labels",
    "with legend", "without legend", "show legend", "hide legend",
    "logarithmic", "log scale", "linear scale",
    "same query but", "same question but",
    "repeat but", "again but", "redo but",
]

CHART_TYPE_KEYWORDS: Dict[str, str] = {
    "pie chart": "pie", "pie": "pie",
    "line chart": "line", "line graph": "line", "line": "line",
    "bar chart": "bar", "bar graph": "bar", "bar": "bar",
    "area chart": "area", "area graph": "area", "area": "area",
    "scatter plot": "scatter", "scatter chart": "scatter", "scatter": "scatter",
    "donut chart": "donut", "donut": "donut", "doughnut": "donut", "doughnut chart": "donut",
    "column chart": "bar", "column graph": "bar",
    "histogram": "bar",
    "bubble chart": "scatter", "bubble": "scatter",
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

    if not words:
        return True

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
        if len(words) >= 3:
            for i in range(len(words) - 2):
                trigram = words[i] + " " + words[i + 1] + " " + words[i + 2]
                if trigram in GREETINGS or trigram in THANKS or trigram in FAREWELL:
                    return True

    if len(words) <= 3 and not _has_data_intent(q):
        casual = {
            "ok", "okay", "sure", "nice", "cool", "great", "awesome",
            "wow", "lol", "haha", "yes", "no", "yep", "nope", "hmm",
            "interesting", "perfect", "amazing", "good", "fine",
            "alright", "right", "correct", "true", "false",
            "yea", "yeah", "nah", "meh", "eh",
            "lmao", "rofl", "hehe", "hahaha", "lmfao",
            "omg", "oh", "ooh", "ahh", "aah", "ugh",
            "sweet", "sick", "dope", "lit", "fire",
            "brilliant", "excellent", "fantastic", "wonderful",
            "terrible", "awful", "bad", "horrible",
            "neat", "rad", "legit", "solid", "tight",
            "absolutely", "definitely", "certainly", "indeed",
            "perhaps", "maybe", "possibly", "probably",
            "idk", "idc", "imo", "imho", "tbh", "nvm",
            "never mind", "nevermind",
            "no worries", "no problem", "np", "nw",
            "my bad", "sorry", "apologies", "pardon",
            "whatever", "anyway", "anyways",
            "roger", "roger that", "copy", "copy that",
            "understood", "got it", "gotcha", "i see",
            "makes sense", "fair enough", "noted", "noted!",
        }
        if q in casual or (len(words) == 1 and words[0] in casual):
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
            w in q for w in ("show", "change", "make", "as a", "switch", "convert", "display", "render", "use", "try")
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

    # ── Greetings ──
    if q in GREETINGS or any(
        g in q
        for g in [
            "hello", "hey", "hi", "good morning", "good afternoon",
            "good evening", "how are you", "how's it going",
            "what's up", "how do you do", "nice to meet",
            "pleased to meet", "how have you been",
        ]
    ):
        return {
            "insight": (
                "Hello! I'm MATRIQ, your AI-powered data analyst. "
                "I can help you explore your data by answering questions in plain English.\n\n"
                "Try asking something like:\n"
                "- Show me an overview of the data\n"
                "- What are the top 10 records?\n"
                "- Show me trends over time\n"
                "- Compare categories by total values\n\n"
                "What would you like to know about your data?"
            ),
            "follow_up_questions": [
                "Show me an overview of all the data",
                "What are the top 10 records by highest value?",
                "Show me the distribution across categories",
            ],
        }

    # ── Thanks ──
    if q in THANKS or "thank" in q or "appreciate" in q or "helpful" in q:
        return {
            "insight": (
                "You're welcome! I'm glad I could help. "
                "Feel free to ask more questions about your data anytime."
            ),
            "follow_up_questions": [
                "Show me another interesting trend",
                "What patterns exist in the data?",
                "Give me a statistical summary",
            ],
        }

    # ── Farewell ──
    if q in FAREWELL or "bye" in q or "goodbye" in q or "see you" in q or "take care" in q:
        return {
            "insight": "Goodbye! Come back anytime you need insights from your data.",
            "follow_up_questions": [],
        }

    # ── Apologies ──
    if any(w in q for w in ["sorry", "apologies", "my bad", "pardon", "forgive"]):
        return {
            "insight": (
                "No need to apologize! I'm here to help. "
                "Feel free to ask me anything about your data."
            ),
            "follow_up_questions": [
                "Show me an overview of the data",
                "What are the key metrics?",
                "Show me a statistical summary",
            ],
        }

    # ── Casual positive ──
    casual_positive = {
        "ok", "okay", "sure", "nice", "cool", "great", "awesome",
        "wow", "amazing", "perfect", "good", "fine", "interesting",
        "alright", "sweet", "brilliant", "excellent", "fantastic",
        "wonderful", "neat", "rad", "legit", "solid", "dope", "lit",
        "fire", "sick", "tight", "absolutely", "definitely",
        "certainly", "indeed", "right", "correct", "true",
        "roger", "roger that", "copy", "copy that",
        "understood", "got it", "gotcha", "i see",
        "makes sense", "fair enough", "noted",
        "good job", "well done", "nice work", "great work",
    }
    if q in casual_positive:
        return {
            "insight": "Glad to hear that! Want to explore more of your data?",
            "follow_up_questions": [
                "Show me the top categories by total values",
                "What trends can you find in the data?",
                "Compare the key groups in the dataset",
            ],
        }

    # ── Casual negative ──
    casual_negative = {
        "no", "nope", "hmm", "nah", "meh", "eh",
        "not really", "nvm", "never mind", "nevermind",
        "whatever", "idc",
    }
    if q in casual_negative:
        return {
            "insight": "No worries! Let me know if you'd like to ask something else about your data.",
            "follow_up_questions": [
                "Show me an overview of the data",
                "What are the key statistics?",
                "Which records have the highest values?",
            ],
        }

    # ── Casual affirmative ──
    casual_affirmative = {
        "yes", "yep", "yeah", "yea", "yup", "ya",
        "sure thing", "of course", "why not",
        "go ahead", "do it", "proceed", "continue",
        "go for it", "let's go", "lets go",
        "absolutely", "definitely", "certainly",
    }
    if q in casual_affirmative:
        return {
            "insight": "Got it! What would you like to explore next?",
            "follow_up_questions": [
                "Show me data trends over time",
                "Compare the top categories",
                "What is the distribution of values?",
            ],
        }

    # ── Laughter / reactions ──
    casual_reactions = {
        "lol", "haha", "hehe", "lmao", "rofl", "hahaha", "lmfao",
        "omg", "oh", "ooh", "ahh", "aah", "ugh", "whoa",
    }
    if q in casual_reactions:
        return {
            "insight": "😄 Glad you're enjoying it! Want to dive deeper into your data?",
            "follow_up_questions": [
                "Show me something surprising in the data",
                "What are the outliers?",
                "Find an interesting pattern",
            ],
        }

    # ── Uncertainty ──
    casual_uncertain = {
        "idk", "i don't know", "i dont know", "not sure",
        "no idea", "i'm not sure", "im not sure",
        "perhaps", "maybe", "possibly", "probably",
        "i guess", "i suppose",
    }
    if q in casual_uncertain:
        return {
            "insight": (
                "No problem! Here are some ideas to get started:\n\n"
                "- Ask for an overview of your data\n"
                "- Request top records or key statistics\n"
                "- Explore trends and distributions\n"
                "- Compare different categories or groups\n\n"
                "Just type a question in plain English!"
            ),
            "follow_up_questions": [
                "Show me an overview of all the data",
                "What are the top 10 records?",
                "Show me a statistical summary",
            ],
        }

    # ── Help patterns ──
    for pattern in HELP_PATTERNS:
        if pattern in q:
            return {
                "insight": (
                    "I'm MATRIQ, your AI-powered BI dashboard assistant. Here's what I can do:\n\n"
                    "📊 **Data Analysis**\n"
                    "- Ask data questions in plain English\n"
                    "- Auto-generate charts and visualizations\n"
                    "- Provide KPI insights with executive summaries\n\n"
                    "📁 **Data Management**\n"
                    "- Upload and analyze CSV datasets\n"
                    "- Switch between multiple datasets\n\n"
                    "📤 **Export Options**\n"
                    "- Export as PNG, CSV, or PDF reports\n\n"
                    "⌨️ **Shortcuts**\n"
                    "- Ctrl+K → Focus input\n"
                    "- Ctrl+/ → Toggle sidebar\n"
                    "- Escape → Close modals\n\n"
                    "Just type your question in plain English to get started!"
                ),
                "follow_up_questions": [
                    "Show me an overview of the data",
                    "What are the top records by highest value?",
                    "Show me trends over time",
                ],
            }

    # ── About patterns ──
    for pattern in ABOUT_PATTERNS:
        if pattern in q:
            return {
                "insight": (
                    "I'm MATRIQ, an AI-powered Business Intelligence dashboard.\n\n"
                    "Built with Google Gemini AI, FastAPI, Recharts, and Next.js. "
                    "I can analyze datasets and generate SQL queries, "
                    "charts, KPIs, and insights from simple English questions.\n\n"
                    "Upload any CSV file and start exploring your data!"
                ),
                "follow_up_questions": [
                    "Show me something interesting about the data",
                    "What categories or groups are in the data?",
                    "Give me a high-level summary",
                ],
            }

    return None