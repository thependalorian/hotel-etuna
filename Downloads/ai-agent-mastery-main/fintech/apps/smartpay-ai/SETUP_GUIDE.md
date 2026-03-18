# 🚀 Smartpay AI Copilot - Setup Guide

**Complete setup instructions for the Python AI backend**

---

## 📋 Prerequisites

- **Python 3.11+** (verify with `python --version`)
- **PostgreSQL database** (Neon recommended for serverless)
- **Node.js backend** running (for user profile DRY pattern)
- **LLM API key** (OpenAI, Anthropic, Google, or Mistral)

---

## 🔧 Step 1: Environment Setup

### 1.1 Create Virtual Environment

```bash
cd backend_python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 1.2 Install Dependencies

```bash
pip install -r requirements.txt
```

### 1.3 Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Required - LLM
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
OPENAI_API_KEY=sk-...

# Required - Databases
DATABASE_URL=postgresql://user:pass@host.neon.tech/smartpay?sslmode=require
LANCEDB_PATH=./data/lancedb
DUCKDB_PATH=./data/analytics.duckdb

# Required - APIs
SMARTPAY_API_BASE_URL=http://localhost:3001

# Required - Embeddings (bge-m3)
EMBEDDING_MODEL=bge-m3
EMBEDDING_API_URL=http://localhost:11434  # Ollama or compatible API
# Alternative: Use hosted embedding service
# EMBEDDING_API_KEY=your-api-key

# Optional - ML & Server
ML_ENABLED=false
PORT=8000
ENVIRONMENT=development
```

---

## 🗄️ Step 2: Database Setup

### 2.1 PostgreSQL Setup

**Run Migrations:**

```bash
# Using psql (recommended)
psql $DATABASE_URL -f smartpay_ai/data/migrations/001_init.sql

# OR using Python
python -c "
import asyncio, asyncpg, os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

async def run():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    sql = Path('smartpay_ai/data/migrations/001_init.sql').read_text()
    await conn.execute(sql)
    await conn.close()
    print('✅ Migration complete')

asyncio.run(run())
"
```

**Verify Tables Created:**

```bash
psql $DATABASE_URL -c "\dt"
```

Expected tables:
- `conversation_history` - Chat persistence
- `user_preferences` - User settings
- `knowledge_base_documents` - RAG documents (metadata only)
- `checkpoints` - LangGraph state (auto-created)
- `checkpoint_writes` - LangGraph operations (auto-created)

### 2.2 LanceDB Setup (Vector Database)

**Install bge-m3 Embeddings:**

Option A: Using Ollama (Recommended for local development):
```bash
# Install Ollama (if not already installed)
curl -fsSL https://ollama.com/install.sh | sh

# Pull bge-m3 model
ollama pull bge-m3

# Verify it's running
ollama list | grep bge-m3
```

Option B: Using hosted embedding service (production):
```bash
# Configure in .env
EMBEDDING_API_KEY=your-api-key
EMBEDDING_API_URL=https://api.yourprovider.com/v1/embeddings
```

**Initialize LanceDB:**

LanceDB is automatically initialized on first use. You can optionally pre-create the directory:

```bash
mkdir -p data/lancedb
```

**Test Vector Search:**

```python
from smartpay_ai.knowledge_base.retrieve import retrieve

# Ingest sample document
from smartpay_ai.knowledge_base.ingest import ingest_documents

documents = [{
    "title": "Test Document",
    "content": "This is a test of the knowledge base.",
    "metadata": {"category": "test"}
}]

stats = await ingest_documents(documents, scope="global")
print(f"✅ Ingested {stats['added']} documents")

# Test search
results = await retrieve("knowledge base test", limit=1)
print(f"✅ Found {len(results)} results")
```

### 2.3 DuckDB Setup (Analytics Database)

DuckDB is automatically created on first use:

```bash
# The file will be created at:
# data/analytics.duckdb

# Verify it works
python -c "
import duckdb
conn = duckdb.connect('data/analytics.duckdb')
result = conn.execute('SELECT 1 as test').fetchone()
print(f'✅ DuckDB working: {result[0]}')
conn.close()
"
```

**Initialize Analytics Tables:**

```python
from smartpay_ai.analytics import SpendingAnalytics, FraudAnalytics, GroupAnalytics

# This will create the required tables
spending = SpendingAnalytics(db_path="data/analytics.duckdb")
fraud = FraudAnalytics(db_path="data/analytics.duckdb")
groups = GroupAnalytics(db_path="data/analytics.duckdb")

# Load initial data from PostgreSQL
spending.load_transactions_from_postgres(DATABASE_URL, days_back=90)
fraud.load_transactions_from_postgres(DATABASE_URL, days_back=30)
groups.load_groups_from_postgres(DATABASE_URL)

# Close connections
spending.close()
fraud.close()
groups.close()

print("✅ Analytics databases initialized")
```

---

## 🏃 Step 3: Start the Server

### 3.1 Quick Start (Development)

```bash
python run.py
```

### 3.2 Using Uvicorn Directly

```bash
uvicorn smartpay_ai.main:app --reload --host 0.0.0.0 --port 8000
```

### 3.3 Verify Server Running

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "ml_available": false,
  "graph_available": true,
  "service": "smartpay-copilot"
}
```

---

## 🧪 Step 4: Test the Agent

### 4.1 Run Unit Tests

```bash
pytest smartpay_ai/tests/test_copilot_agent.py -v
```

Or run manually:

```bash
python smartpay_ai/tests/test_copilot_agent.py
```

### 4.2 Test Chat Endpoint (cURL)

**Send a message:**

```bash
curl -X POST http://localhost:8000/api/smartpay-copilot/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Hello, what can you help me with?",
    "thread_id": "test-thread-123"
  }'
```

Expected response:

```json
{
  "status": "ok",
  "messages": [
    {"role": "assistant", "content": "Hi! I'm your Smartpay Copilot..."}
  ],
  "last_tool_result": null,
  "thread_id": "test-thread-123"
}
```

**Test write action (should trigger HITL):**

```bash
curl -X POST http://localhost:8000/api/smartpay-copilot/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Transfer N$500 to SP12345678",
    "thread_id": "test-thread-456"
  }'
```

Expected response:

```json
{
  "status": "interrupt",
  "approval_payload": {
    "action_type": "transfer_money",
    "parameters": {
      "amount": 500,
      "recipient": "SP12345678"
    },
    "summary_for_user": "Transfer N$500 to SP12345678",
    "risk_level": "medium"
  },
  "thread_id": "test-thread-456"
}
```

**Resume after approval:**

```bash
curl -X POST http://localhost:8000/api/smartpay-copilot/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "resume": {"approved": true},
    "thread_id": "test-thread-456"
  }'
```

---

## 📦 Step 5: Integration with Node.js Backend

### 5.1 Ensure Node.js Backend Running

```bash
cd ../backend
npm run dev  # Should run on port 3001
```

### 5.2 Test User Profile Fetch

The Python backend calls Node.js API to fetch user profile (DRY):

```bash
# Test Node.js profile endpoint
curl http://localhost:3001/api/v1/mobile/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5.3 Update SMARTPAY_API_BASE_URL

In `backend_python/.env`:

```bash
SMARTPAY_API_BASE_URL=http://localhost:3001
```

---

## 🔄 Step 6: Deploy to Production

### 6.1 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables configured (including EMBEDDING_API_URL)
- [ ] PostgreSQL database provisioned and migrated
- [ ] Embedding service accessible (Ollama or hosted API)
- [ ] ML models trained (or ML_ENABLED=false)
- [ ] Node.js backend deployed and accessible
- [ ] Secrets stored in environment (not in code)

### 6.2 Embedding Service Deployment

**Option A: Self-hosted Ollama (Recommended for cost)**

```bash
# On your server/VM
curl -fsSL https://ollama.com/install.sh | sh
ollama pull bge-m3
ollama serve  # Runs on port 11434

# In your .env
EMBEDDING_API_URL=http://your-server:11434
```

**Option B: Hosted Embedding API (Recommended for simplicity)**

Use a hosted provider that supports bge-m3 embeddings. Configure in `.env`:

```bash
EMBEDDING_API_KEY=your-api-key
EMBEDDING_API_URL=https://api.provider.com/v1/embeddings
EMBEDDING_MODEL=bge-m3
```

### 6.3 Railway Deployment (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add service
railway add

# Set environment variables
railway variables set DATABASE_URL=postgresql://...
railway variables set SMARTPAY_API_BASE_URL=https://your-backend.vercel.app
railway variables set OPENAI_API_KEY=sk-...
railway variables set EMBEDDING_API_URL=http://your-ollama-server:11434
railway variables set EMBEDDING_MODEL=bge-m3

# Deploy
railway up
```

### 6.4 Render Deployment (Alternative)

1. Create new Web Service on Render
2. Connect GitHub repo
3. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn smartpay_ai.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. Deploy

### 6.5 Fly.io Deployment (Alternative)

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch app
fly launch

# Set secrets
fly secrets set DATABASE_URL=postgresql://...
fly secrets set OPENAI_API_KEY=sk-...

# Deploy
fly deploy
```

---

## 🧩 Step 7: Add Specialist Agents

The current implementation has **stub routing functions**. To add real specialist agents:

### 7.1 Create Agent Directory

```bash
mkdir -p smartpay_ai/agents/transaction_analyst
cd smartpay_ai/agents/transaction_analyst
touch __init__.py models.py prompts.py agent.py
```

### 7.2 Implement Agent (Follow Copilot Pattern)

See `buffr_ai` reference for complete examples.

### 7.3 Update Router in `tools.py`

Replace stub with actual agent call:

```python
async def route_to_transaction_analyst(query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Route to actual Transaction Analyst agent."""
    from smartpay_ai.agents.transaction_analyst.agent import run_transaction_analyst, TransactionAnalystDeps
    
    deps = TransactionAnalystDeps(...)
    result = await run_transaction_analyst(query, deps)
    return {"agent": "transaction_analyst", "response": result.message}
```

---

## 🤖 Step 8: Add ML Models

When ready to add ML capabilities:

### 8.1 Create ML Directory

```bash
mkdir -p smartpay_ai/ml/fraud_detection
```

### 8.2 Train and Export Models

```python
# Example: Train fraud detection model
from sklearn.ensemble import RandomForestClassifier
import joblib

model = RandomForestClassifier()
model.fit(X_train, y_train)
joblib.dump(model, "smartpay_ai/models/fraud_detection/model.pkl")
```

### 8.3 Update ML __init__.py

Uncomment imports in `smartpay_ai/ml/__init__.py`

### 8.4 Enable ML in Environment

```bash
ML_ENABLED=true
```

---

## 🔍 Troubleshooting

### Issue: Database Connection Error

**Error:** `asyncpg.exceptions.InvalidCatalogNameError: database "smartpay" does not exist`

**Solution:**
- Verify DATABASE_URL in `.env`
- Ensure database exists in Neon/Postgres
- Check SSL mode: `?sslmode=require`

### Issue: Module Import Error

**Error:** `ModuleNotFoundError: No module named 'smartpay_ai'`

**Solution:**
- Ensure you're in the `backend_python` directory
- Activate virtual environment: `source venv/bin/activate`
- Reinstall: `pip install -r requirements.txt`

### Issue: Graph Not Available

**Error:** `503 Service Unavailable: Copilot graph not ready`

**Solution:**
- Check DATABASE_URL is set
- Check database migrations ran successfully
- Check server logs for startup errors

### Issue: User Profile Not Found

**Error:** `Copilot: no user profile (set SMARTPAY_API_BASE_URL...)`

**Solution:**
- Ensure Node.js backend is running
- Verify SMARTPAY_API_BASE_URL in `.env`
- Test profile endpoint manually with valid token

---

## 📚 Next Steps

1. ✅ Backend setup complete
2. ➡️ Implement specialist agents (Transaction Analyst, Savings Advisor, etc.)
3. ➡️ Add ML models for fraud detection, spending analysis
4. ➡️ Integrate with React Native mobile app (AG-UI protocol)
5. ➡️ Add comprehensive tests
6. ➡️ Deploy to production

**Reference:** See `docs/README_AI_IMPLEMENTATION.md` for complete architecture guide.

---

## 📞 Support

- **Documentation:** `docs/` directory
- **Reference Implementation:** `/Users/georgenekwaya/buffr-g2p/backend/buffr_ai/`
- **Issues:** Check `TODO.md` for known tasks

**Happy coding! 🚀**
