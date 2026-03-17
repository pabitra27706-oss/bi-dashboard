# InsightAI — Executive BI Dashboard

AI-powered natural language data analytics dashboard built for hackathon.

Ask questions in plain English → get SQL, interactive charts, KPIs, and executive insights.

## Architecture

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | Next.js 16, React 19, Tailwind CSS, Recharts |
| Backend  | FastAPI, Python, SQLite           |
| AI       | Google Gemini 2.5 Flash           |
| Database | SQLite (1,000,000 rows)           |

## Features

### Core Features
- Natural language to SQL conversion via Gemini AI
- Dynamic chart generation (bar, grouped bar, line, area, pie, donut, scatter)
- KPI metric cards with trends
- AI-generated executive insights with actual numbers
- SQL validation and injection prevention

### Nice-to-Have Features
- Multi-chart dashboard per query
- Query history sidebar with persistence
- Suggested/example queries for guidance
- Raw data table toggle (sortable, paginated)
- Dark/Light mode toggle
- Export chart as PNG / data as CSV

### Bonus Features
- Follow-up questions with conversational context
- CSV upload for custom datasets

## Dataset

- **Source**: YouTube video analytics
- **Size**: 1,000,000 rows
- **Columns**: video_id, title, category, region, language, views, likes, comments, shares, ads_enabled, publish_date, sentiment_score, duration_seconds, subscribers
- **Categories**: Coding, Education, Gaming, Music, Tech Reviews, Vlogs
- **Date Range**: 2024-01-01 to 2025-12-30

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Gemini API Key (from https://aistudio.google.com/app/apikey)

### Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\Activate.ps1          # Windows PowerShell
# source venv/bin/activate         # Mac/Linux

pip install fastapi uvicorn python-dotenv google-generativeai pydantic python-multipart pandas

# Add your Gemini API key
echo GEMINI_API_KEY=your_key_here > .env

# Load data into SQLite
python data\load_db.py

# Start API server
python -m uvicorn main:app --reload --port 8000
