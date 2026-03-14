\# InsightAI — Executive BI Dashboard



AI-powered natural language data analytics dashboard built for hackathon.

Ask questions in plain English → get SQL, interactive charts, KPIs, and executive insights.



\## Architecture



```

User Question (Natural Language)

&#x20;       ↓

&#x20;  FastAPI Backend

&#x20;       ↓

&#x20;  Gemini 2.5 Flash AI

&#x20;       ↓

&#x20;  SQL Generation + Chart Config

&#x20;       ↓

&#x20;  SQLite Database (1M rows)

&#x20;       ↓

&#x20;  Query Results

&#x20;       ↓

&#x20;  Next.js Frontend

&#x20;       ↓

&#x20;  Recharts Visualization + KPI Cards + AI Insight

```



\## Tech Stack



| Layer    | Technology                        |

|----------|-----------------------------------|

| Frontend | Next.js 16, React 19, Tailwind CSS, Recharts |

| Backend  | FastAPI, Python, SQLite           |

| AI       | Google Gemini 2.5 Flash           |

| Database | SQLite (1,000,000 rows)           |



\## Features



\### Core Features

\- Natural language to SQL conversion via Gemini AI

\- Dynamic chart generation (bar, grouped bar, line, area, pie, donut, scatter)

\- KPI metric cards with trends

\- AI-generated executive insights with actual numbers

\- SQL validation and injection prevention



\### Nice-to-Have Features

\- Multi-chart dashboard per query

\- Query history sidebar with persistence

\- Suggested/example queries for guidance

\- Raw data table toggle (sortable, paginated)

\- Dark/Light mode toggle

\- Export chart as PNG / data as CSV



\### Bonus Features

\- Follow-up questions with conversational context

\- CSV upload for custom datasets



\## Dataset



\- \*\*Source\*\*: YouTube video analytics

\- \*\*Size\*\*: 1,000,000 rows

\- \*\*Columns\*\*: video\_id, title, category, region, language, views, likes, comments, shares, ads\_enabled, publish\_date, sentiment\_score, duration\_seconds, subscribers

\- \*\*Categories\*\*: Coding, Education, Gaming, Music, Tech Reviews, Vlogs

\- \*\*Date Range\*\*: 2024-01-01 to 2025-12-30



\## Quick Start



\### Prerequisites

\- Python 3.11+

\- Node.js 18+

\- Gemini API Key (from https://aistudio.google.com/app/apikey)



\### Backend Setup



```bash

cd backend

python -m venv venv

venv\\Scripts\\Activate.ps1          # Windows PowerShell

\# source venv/bin/activate         # Mac/Linux



pip install fastapi uvicorn python-dotenv google-generativeai pydantic python-multipart pandas



\# Add your Gemini API key

echo GEMINI\_API\_KEY=your\_key\_here > .env



\# Load data into SQLite

python data\\load\_db.py



\# Start API server

python -m uvicorn main:app --reload --port 8000

```



\### Frontend Setup



```bash

cd frontend

npm install

npm run dev

```



\### Open Dashboard

Navigate to http://localhost:3000



\## Demo Queries



| Difficulty | Query |

|------------|-------|

| Simple     | "Show me the total views by category" |

| Medium     | "Compare average likes, comments, and shares for monetized vs non-monetized videos across regions" |

| Complex    | "Show me the monthly trend of average sentiment score for the top 3 categories by views in 2025, and highlight which months had negative sentiment" |



\## Project Structure



```

bi-dashboard/

├── backend/

│   ├── main.py                  # FastAPI entry point

│   ├── routes/

│   │   └── query.py             # API endpoints

│   ├── services/

│   │   ├── gemini\_service.py    # Gemini AI integration

│   │   ├── db\_service.py        # SQLite query executor

│   │   └── prompt\_builder.py    # Structured prompt builder

│   ├── models/

│   │   └── schemas.py           # Pydantic models

│   ├── data/

│   │   ├── youtube\_data.csv     # Raw dataset (1M rows)

│   │   └── load\_db.py           # CSV → SQLite loader

│   ├── .env                     # GEMINI\_API\_KEY

│   └── database.db              # SQLite database

│

├── frontend/

│   ├── src/

│   │   ├── app/

│   │   │   ├── page.tsx         # Main page

│   │   │   ├── layout.tsx       # App layout

│   │   │   └── globals.css      # Global styles

│   │   ├── components/

│   │   │   ├── Dashboard.tsx    # Main dashboard

│   │   │   ├── ChatInput.tsx    # Query input

│   │   │   ├── ChartRenderer.tsx # Dynamic charts

│   │   │   ├── KPICards.tsx     # Metric cards

│   │   │   ├── InsightBox.tsx   # AI insight display

│   │   │   ├── QueryHistory.tsx # History sidebar

│   │   │   ├── DataTable.tsx    # Raw data table

│   │   │   ├── ExportButtons.tsx # PNG/CSV export

│   │   │   ├── CSVUpload.tsx    # File upload

│   │   │   ├── LoadingState.tsx # Loading skeleton

│   │   │   └── ThemeProvider.tsx # Dark/light mode

│   │   ├── services/

│   │   │   └── api.ts           # API client

│   │   └── types/

│   │       └── index.ts         # TypeScript types

│   └── .env.local               # API URL config

│

├── .gitignore

└── README.md

```



\## API Endpoints



| Method | Endpoint         | Description              |

|--------|------------------|--------------------------|

| GET    | /                | Health check             |

| GET    | /api/schema      | Database schema info     |

| GET    | /api/suggestions | Example queries          |

| POST   | /api/query       | Process NL query         |

| POST   | /api/upload      | Upload custom CSV        |



\## Team



Built for Hackathon 2025



