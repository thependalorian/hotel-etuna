# Smartpay AI Copilot - API Endpoints Documentation

## Overview

Production-ready FastAPI backend with SSE streaming, comprehensive health checks, ML predictions, and admin management endpoints.

**Base URL:** `http://localhost:8000`

---

## 🎯 Core Endpoints

### Copilot Chat

#### Standard Chat (Request/Response)
```http
POST /api/smartpay-copilot/chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "What's my account balance?",
  "thread_id": "user-123-thread-1",
  "resume": null
}
```

**Response:**
```json
{
  "status": "ok",
  "messages": [
    {"role": "user", "content": "What's my account balance?"},
    {"role": "assistant", "content": "Your current balance is NAD 15,450.00"}
  ],
  "thread_id": "user-123-thread-1",
  "last_tool_result": null
}
```

#### Streaming Chat (Server-Sent Events)
```http
POST /api/smartpay-copilot/chat/stream
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "Send NAD 500 to John",
  "thread_id": "user-123-thread-1"
}
```

**SSE Events:**
```javascript
// Client Example
const eventSource = new EventSource('/api/smartpay-copilot/chat/stream');

eventSource.addEventListener('message', (e) => {
  const data = JSON.parse(e.data);
  console.log('Message:', data.message);
});

eventSource.addEventListener('tool_call', (e) => {
  const data = JSON.parse(e.data);
  console.log('Tool call:', data.action);
});

eventSource.addEventListener('interrupt', (e) => {
  const data = JSON.parse(e.data);
  console.log('Approval required:', data.approval_payload);
  eventSource.close();
});

eventSource.addEventListener('complete', () => {
  console.log('Conversation complete');
  eventSource.close();
});

eventSource.addEventListener('error', (e) => {
  const data = JSON.parse(e.data);
  console.error('Error:', data.error);
  eventSource.close();
});
```

**Event Types:**
- `node_start` - LangGraph node execution begins
- `message` - New message in conversation
- `tool_call` - Agent is executing a tool
- `interrupt` - Human approval required (HITL)
- `complete` - Stream finished successfully
- `error` - Error occurred

---

## 🏥 Health Checks

### Basic Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "ml_available": true,
  "graph_available": true,
  "service": "smartpay-copilot"
}
```

### Detailed Health Check
```http
GET /api/health/detailed
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1710720000.0,
  "service": "smartpay-copilot",
  "version": "0.1.0",
  "checks": {
    "database": {
      "status": "ok",
      "latency_ms": 12.5,
      "component": "postgresql"
    },
    "lancedb": {
      "status": "ok",
      "latency_ms": 8.2,
      "tables": 3,
      "component": "lancedb"
    },
    "duckdb": {
      "status": "ok",
      "latency_ms": 5.1,
      "component": "duckdb"
    },
    "ml_service": {
      "status": "ok",
      "component": "ml_service",
      "available": true
    },
    "node_api": {
      "status": "ok",
      "latency_ms": 45.3,
      "component": "node_api",
      "url": "http://localhost:4000"
    },
    "copilot_graph": {
      "status": "ok",
      "available": true,
      "component": "copilot_graph"
    }
  }
}
```

**Status Values:**
- `ok` - All critical components healthy
- `degraded` - Some components unhealthy but core features work
- `error` - Critical components failed

---

## 🤖 ML Endpoints

### Predict
```http
POST /api/ml/predict
Content-Type: application/json

{
  "model_type": "fraud_detection",
  "features": {
    "amount": 5000.0,
    "merchant": "Unknown Store",
    "location": "Windhoek",
    "time_of_day": 22,
    "user_avg_transaction": 500.0
  },
  "user_id": "user-123"
}
```

**Response:**
```json
{
  "status": "success",
  "model_type": "fraud_detection",
  "prediction": "low_risk",
  "confidence": 0.92,
  "explanation": {
    "amount": 0.3,
    "merchant": 0.2,
    "location": 0.15,
    "time_of_day": 0.35
  }
}
```

**Model Types:**
- `fraud_detection` - Transaction fraud risk score
- `transaction_categorization` - Auto-categorize transactions
- `spend_prediction` - Forecast future spending
- `risk_assessment` - Loan/credit risk evaluation

### List Models
```http
GET /api/ml/models
```

**Response:**
```json
{
  "models": [
    {
      "model_type": "fraud_detection",
      "version": "1.0.0",
      "trained_at": "2024-01-01",
      "accuracy": 0.92,
      "status": "ready",
      "feature_count": 15
    }
  ],
  "ml_enabled": true
}
```

### ML Health
```http
GET /api/ml/health
```

**Response:**
```json
{
  "status": "ok",
  "ml_enabled": true,
  "models_loaded": 4,
  "errors": []
}
```

### Train Model (Async)
```http
POST /api/ml/train
Content-Type: application/json

{
  "model_type": "fraud_detection",
  "training_data_path": "/path/to/data.csv",
  "hyperparameters": {
    "learning_rate": 0.01,
    "max_depth": 5
  }
}
```

**Response:**
```json
{
  "status": "started",
  "message": "Training job started for fraud_detection",
  "job_id": "abc-123-def"
}
```

---

## 👨‍💼 Admin Endpoints

**All admin endpoints require admin authentication (role="admin" in JWT).**

### Bulk Ingest Knowledge Base
```http
POST /api/admin/knowledge-base/ingest
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "articles": [
    {
      "title": "How to Send Money",
      "content": "Step 1: Open the app...",
      "category": "payments",
      "tags": ["send", "money", "transfer"],
      "metadata": {
        "author": "Admin",
        "version": "1.0"
      }
    }
  ],
  "overwrite": false
}
```

**Response:**
```json
{
  "success": true,
  "ingested_count": 1,
  "skipped_count": 0,
  "errors": []
}
```

### Usage Statistics
```http
GET /api/admin/stats
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "total_conversations": 1523,
  "total_messages": 8945,
  "active_users_today": 45,
  "active_users_week": 234,
  "avg_response_time_ms": 450.0,
  "top_intents": [
    {"intent": "check_balance", "count": 156},
    {"intent": "transfer_money", "count": 89}
  ],
  "error_rate": 0.02
}
```

### Reload ML Models
```http
POST /api/admin/models/reload
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully reloaded 4 model(s)",
  "reloaded_models": [
    "fraud_detection",
    "transaction_categorization",
    "spend_prediction",
    "risk_assessment"
  ]
}
```

### System Information
```http
GET /api/admin/system-info
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "python_version": "3.11.0",
  "environment": "development",
  "database_configured": true,
  "llm_provider": "deepseek",
  "llm_model": "deepseek-chat",
  "ml_enabled": true,
  "node_api_url": "http://localhost:4000",
  "lancedb_path": "./data/lancedb",
  "duckdb_path": "./data/analytics.duckdb",
  "port": 8000
}
```

---

## 🔐 Authentication

All endpoints (except public ones) require JWT authentication via Authorization header:

```http
Authorization: Bearer <jwt-token>
```

**Public Endpoints (no auth required):**
- `GET /`
- `GET /health`
- `GET /api/health/detailed`
- `GET /docs`
- `GET /openapi.json`
- `GET /redoc`

**Authentication Flow:**
1. User logs in via Node.js backend API
2. Node API returns JWT token
3. Client includes token in Authorization header
4. Python backend validates token by calling Node API `/auth/verify` (or fetching user profile)
5. Request proceeds with user context

**Admin Endpoints:**
- Require `role: "admin"` in JWT payload
- Return `403 Forbidden` if non-admin user attempts access

---

## ⏱️ Rate Limits

Rate limiting uses token bucket algorithm (in-memory for dev, Redis for production).

**Limits per User:**
- Chat endpoints: 100 requests per 15 minutes
- Streaming chat: 50 requests per 15 minutes
- ML predict: 200 requests per hour
- Admin endpoints: 20 requests per hour

**Global Limits:**
- 1000 requests per hour across all users

**Rate Limit Response:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retry_after_seconds": 45
}
```

**Response Headers:**
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining (if tracked)
- `Retry-After` - Seconds until next request allowed (on 429)

---

## 📊 Middleware Stack

Middleware is applied in this order (bottom to top):

1. **CORS Middleware** - Allow React Native mobile app
2. **Rate Limit Middleware** - Token bucket per user/endpoint
3. **Auth Middleware** - JWT validation and user context
4. **Application Routes** - Endpoint handlers

---

## 🧪 Testing Endpoints

### Using cURL

```bash
# Basic health check
curl http://localhost:8000/health

# Chat (with auth)
curl -X POST http://localhost:8000/api/smartpay-copilot/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is my balance?",
    "thread_id": "test-thread-1"
  }'

# Streaming chat (with SSE)
curl -N -X POST http://localhost:8000/api/smartpay-copilot/chat/stream \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Send money to John",
    "thread_id": "test-thread-1"
  }'

# ML prediction
curl -X POST http://localhost:8000/api/ml/predict \
  -H "Content-Type: application/json" \
  -d '{
    "model_type": "fraud_detection",
    "features": {
      "amount": 5000.0,
      "merchant": "Unknown Store",
      "location": "Windhoek"
    }
  }'
```

### Using Python

```python
import httpx

# Chat endpoint
async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8000/api/smartpay-copilot/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": "What's my balance?",
            "thread_id": "user-123-thread-1"
        }
    )
    print(response.json())

# SSE streaming
import asyncio

async def stream_chat():
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            "http://localhost:8000/api/smartpay-copilot/chat/stream",
            headers={"Authorization": f"Bearer {token}"},
            json={"message": "Send money", "thread_id": "test"}
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data:"):
                    print(line[5:])

asyncio.run(stream_chat())
```

---

## 🚀 Deployment

### Environment Variables

Required:
```bash
# LLM
LLM_PROVIDER=deepseek
LLM_MODEL=deepseek-chat
DEEPSEEK_API_KEY=sk-...

# Databases
DATABASE_URL=postgresql://user@localhost:5432/smartpay
LANCEDB_PATH=./data/lancedb
DUCKDB_PATH=./data/analytics.duckdb

# Embeddings (bge-m3)
EMBEDDING_MODEL=bge-m3
EMBEDDING_API_URL=http://localhost:11434  # Ollama or hosted

# APIs
SMARTPAY_API_BASE_URL=http://localhost:4000
```

Optional:
```bash
ML_ENABLED=true
REDIS_URL=redis://localhost:6379  # For production rate limiting
ENVIRONMENT=production
PORT=8000
LOG_LEVEL=INFO
```

### Running the Server

```bash
# Development
cd backend_python
python -m uvicorn smartpay_ai.main:app --reload --port 8000

# Production
python -m uvicorn smartpay_ai.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Health Check Endpoints for Load Balancer

```
Liveness:  GET /health
Readiness: GET /api/health/detailed
```

---

## 📚 Interactive Documentation

**Swagger UI:** http://localhost:8000/docs  
**ReDoc:** http://localhost:8000/redoc  
**OpenAPI Schema:** http://localhost:8000/openapi.json

---

## 🎯 Summary

### ✅ Implemented Features

1. **SSE Streaming Endpoint** - Real-time chat with AG-UI protocol
2. **Comprehensive Health Checks** - Database, LanceDB, DuckDB, ML, Node API
3. **ML Prediction Endpoints** - Fraud detection, categorization, spend prediction
4. **Admin Management** - Knowledge base ingestion, stats, model reload
5. **JWT Authentication** - Token validation via Node API
6. **Rate Limiting** - Token bucket algorithm (in-memory/Redis)
7. **Production-Ready** - Error handling, logging, graceful degradation

### 📁 Files Created

```
backend_python/smartpay_ai/
├── api/
│   ├── streaming_endpoint.py  # SSE streaming chat
│   ├── health_endpoint.py     # Health checks
│   ├── admin_endpoint.py      # Admin management
│   └── ml_endpoint.py         # ML predictions
├── middleware/
│   ├── __init__.py
│   ├── auth.py                # JWT authentication
│   └── rate_limit.py          # Rate limiting
└── main.py                    # Updated with all routers + middleware
```

### 🔗 All Routes

**Copilot:**
- `POST /api/smartpay-copilot/chat`
- `POST /api/smartpay-copilot/chat/stream`

**Health:**
- `GET /health`
- `GET /api/health/detailed`

**ML:**
- `POST /api/ml/predict`
- `GET /api/ml/models`
- `GET /api/ml/health`
- `POST /api/ml/train`

**Admin:**
- `POST /api/admin/knowledge-base/ingest`
- `GET /api/admin/stats`
- `POST /api/admin/models/reload`
- `GET /api/admin/system-info`

**Documentation:**
- `GET /` - API overview
- `GET /docs` - Swagger UI
- `GET /redoc` - ReDoc
- `GET /openapi.json` - OpenAPI schema
