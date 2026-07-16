# VoxBiz

VoxBiz is an intelligent, AI-powered data visualization and analytics platform. It allows users to upload data, connect to databases, and query their data using natural language (including Voice Search) to instantly generate insightful graphs, charts, and AI-driven analysis.

## 🚀 Features

- **Natural Language to Database Queries:** Ask questions about your data in plain English. The AI automatically translates it into highly optimized MongoDB Aggregation Pipelines to fetch, filter, group, and analyze your data.
- **Cross-Collection AI JOINs:** Combine datasets seamlessly. The Global Query Engine will automatically generate `$lookup` stages to join related data across multiple databases (simulating Left Outer Joins) based purely on your natural language intent.
- **Deep Analytics & Aggregations:** Execute complex mathematical aggregations automatically. The AI natively generates `$group`, `$sum`, `$avg`, and `$sort` operators when you ask for statistical breakdowns.
- **Voice Queries:** Seamlessly query your database hands-free using the built-in voice recording modal.
- **Dynamic Graph Generation:** Automatically selects and renders the best visualization (Bar, Line, Pie, Area, Heatmap, Scatter) based on the context of your data and query.
- **AI Strategic Insights:** Reads the resulting charts and automatically generates 3-4 business insights and a 6-month strategic roadmap based on the results.
- **Database Integrations & Access Control:** Connect directly to MongoDB collections with secure Read-Only or Read/Write permission modes.
- **Advanced Data Management:** Securely bulk delete records directly from the frontend table UI. 
- **Export & Share:** Select specific data rows to selectively download as a CSV or instantly email the selected payload to stakeholders directly from the UI.
- **Robust Authentication:** Secure JWT-based login with a fully featured Password Reset flow (includes secure, expiring 30-second reset codes, rate limiting, and beautiful toast notifications).
- **Premium Glassmorphism UI:** Built with React, Vite, and TailwindCSS for a highly responsive, modern, dark-mode supported user experience featuring frosted glass cards and animated canvas backgrounds.

## 🛠️ Technology Stack

**Frontend:**
- **Framework:** React (Vite)
- **Styling:** TailwindCSS (with comprehensive dark mode support)
- **Data Visualization:** Recharts
- **Animations:** Framer Motion & OGL (WebGL)
- **Notifications:** React Hot Toast
- **HTTP Client:** Axios

**Backend:**
- **Framework:** Python & FastAPI
- **Database:** MongoDB (Motor Async Driver)
- **AI Pipeline:** NVIDIA NIM (Llama-3.1-70b-instruct) for SQL/NoSQL translation and business insights.
- **Authentication:** JWT (JSON Web Tokens)
- **Data Processing:** Pandas

---

## 🏃‍♂️ Getting Started

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd VoxBiz
```

### 2. Backend Setup
Navigate to the backend directory and set up your Python environment:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory based on the `.env.example` template:
```env
PORT=8000
MONGODB_URI="your_mongodb_connection_string"
NVIDIA_API_KEY="your_nvidia_nim_api_key"
JWT_SECRET="a_secure_random_string_of_at_least_32_characters"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"
ENVIRONMENT="development"

# SMTP Settings for sending Password Resets and Data Sharing Emails
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SENDER_EMAIL="your-email@gmail.com"
```
*(Note: `JWT_SECRET` must be at least 32 characters long or the backend will refuse to start. If SMTP variables are missing, the backend safely falls back to a terminal "Mock Email Dispatch" for local testing).*

Run the backend server:
```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory (optional for local development, see `.env.example`):
```env
VITE_API_BASE_URL="http://localhost:8000/api"
```

Run the frontend development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 📄 API & Deployment Contracts

VoxBiz is built for robust, production-ready deployments. The following endpoints and contracts are implemented to support orchestration (e.g., Kubernetes, Docker Swarm) and observability:

- **Readiness Check (`GET /api/health`)**: Actively validates both the HTTP layer and the backend MongoDB connection. Will return HTTP 503 if the database connection drops.
- **Metrics (`GET /metrics`)**: Exposes structured Prometheus metrics, including request counting, error rates, and response latencies.
- **Structured JSON Logging**: The backend uses `python-json-logger` out of the box. All log records include a unique `request_id` context bound to the lifecycle of incoming API calls.
- **Request Tracing**: All API responses include an `X-Request-ID` header.
- **Graceful Shutdown**: The FastAPI app binds database disconnections to its lifespan events to prevent orphaned connections.

---

## 📂 Project Structure

```text
VoxBiz/
├── backend/
│   ├── core/         # FastAPI configuration, JWT, Security, and LLM Services
│   ├── src/          # API endpoints (Auth, Database, Queries)
│   ├── tests/        # Pytest security and validation suites
│   ├── main.py       # FastAPI application entry point
│   ├── pytest.ini    # Pytest configuration
│   └── requirements.txt # Python dependencies
└── frontend/
    ├── src/
    │   ├── components/ # Reusable UI components (Modals, Tables, Forms)
    │   ├── pages/      # Application views (Lazy loaded)
    │   ├── contexts/   # React Contexts
    │   └── App.jsx     # Main React routing
    ├── package.json  # NPM dependencies
    └── eslint.config.js # Linting configuration
```

## 🔒 Security
- **Schema-Only Querying:** VoxBiz strictly uses your table structure (schema) to generate SQL/NoSQL queries, ensuring complete data privacy for queries. For AI Strategic Insights, a strictly limited and anonymized sample of up to 10 rows may be sent to the LLM to generate contextual business recommendations.
- **Granular Permissions:** Assign Read-Only capabilities to specific tables to prevent accidental data mutation.
- **Mutation Previews:** Idempotent dry-runs are conducted for Data Deletion/Modification so users can preview the impact of AI queries before committing.
- **Multi-Tenant Isolation:** All database collections and rows strictly require verified `_user_id` context passed via secure JWT tokens, preventing cross-tenant data bleed.
