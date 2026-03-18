# Smartpay AI Copilot - Backend Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATIONS                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ React Native │  │   Web App    │  │  Admin Panel │         │
│  │  Mobile App  │  │  (Browser)   │  │   (Admin)    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │                  │                  │
          │         HTTP/SSE │                  │ JWT (admin)
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│               SMARTPAY AI COPILOT (FastAPI)                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    MIDDLEWARE STACK                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │     CORS     │→ │ Rate Limit   │→ │     Auth     │    │ │
│  │  │  (Origins)   │  │ (Token Bucket)│  │  (JWT Verify)│    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                 ▼                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    API ENDPOINTS                            │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  COPILOT ENDPOINTS                                    │ │ │
│  │  │  • POST /api/smartpay-copilot/chat                   │ │ │
│  │  │  • POST /api/smartpay-copilot/chat/stream (SSE)      │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  HEALTH ENDPOINTS                                     │ │ │
│  │  │  • GET /health                                        │ │ │
│  │  │  • GET /api/health/detailed                           │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  ML ENDPOINTS                                         │ │ │
│  │  │  • POST /api/ml/predict                               │ │ │
│  │  │  • GET /api/ml/models                                 │ │ │
│  │  │  • GET /api/ml/health                                 │ │ │
│  │  │  • POST /api/ml/train                                 │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  ADMIN ENDPOINTS (Admin Role Required)               │ │ │
│  │  │  • POST /api/admin/knowledge-base/ingest             │ │ │
│  │  │  • GET /api/admin/stats                               │ │ │
│  │  │  • POST /api/admin/models/reload                      │ │ │
│  │  │  • GET /api/admin/system-info                         │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                 ▼                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    CORE SERVICES                            │ │
│  │                                                              │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │ │
│  │  │   LangGraph   │  │  ML Service   │  │  Knowledge    │ │ │
│  │  │   Workflow    │  │  (Inference)  │  │  Base (RAG)   │ │ │
│  │  │   (Copilot)   │  │               │  │               │ │ │
│  │  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘ │ │
│  └──────────┼──────────────────┼──────────────────┼─────────┘ │
└─────────────┼──────────────────┼──────────────────┼───────────┘
              │                  │                  │
              ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  PostgreSQL  │  │   LanceDB    │  │    DuckDB    │         │
│  │ (Main Data + │  │  (Vector     │  │ (Analytics + │         │
│  │ Checkpointer)│  │  Embeddings) │  │  ML Training)│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  Node.js API │  │   OpenAI API │                            │
│  │ (User Data)  │  │  (Embeddings)│                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow

### Standard Chat Request

```
1. Client sends POST /api/smartpay-copilot/chat
   ↓
2. CORS Middleware (allow mobile origins)
   ↓
3. Rate Limit Middleware (check token bucket)
   ↓
4. Auth Middleware (validate JWT, attach user context)
   ↓
5. Copilot Endpoint (process chat request)
   ↓
6. LangGraph Workflow
   ├─→ Copilot Node (understand intent)
   ├─→ Guardian Node (validate safety)
   ├─→ Human Approval Node (HITL if needed)
   └─→ Execute Tool Node (perform action)
   ↓
7. Response returned to client
```

### SSE Streaming Request

```
1. Client opens EventSource to /api/smartpay-copilot/chat/stream
   ↓
2. Middleware stack (CORS → Rate Limit → Auth)
   ↓
3. Streaming Endpoint (SSE generator)
   ↓
4. LangGraph astream() (async generator)
   ├─→ Event: node_start
   ├─→ Event: message
   ├─→ Event: tool_call
   ├─→ Event: interrupt (if needed)
   └─→ Event: complete
   ↓
5. Client receives real-time events
```

### ML Prediction Request

```
1. Client sends POST /api/ml/predict
   ↓
2. Middleware stack (CORS → Rate Limit → Auth)
   ↓
3. ML Endpoint (route to model)
   ↓
4. ML Service
   ├─→ Load model (if not cached)
   ├─→ Preprocess features
   ├─→ Run inference
   └─→ Generate explanation (SHAP/importance)
   ↓
5. Response with prediction + confidence + explanation
```

### Admin Knowledge Base Ingestion

```
1. Admin sends POST /api/admin/knowledge-base/ingest
   ↓
2. Middleware stack (CORS → Rate Limit → Auth)
   ↓
3. Auth checks admin role (403 if not admin)
   ↓
4. Admin Endpoint (process articles)
   ↓
5. Knowledge Base Service
   ├─→ Generate embeddings (OpenAI)
   ├─→ Check duplicates (skip if exists)
   └─→ Insert into LanceDB
   ↓
6. Response with ingested/skipped counts + errors
```

---

## 📊 Data Flow

### Conversation State Persistence

```
┌─────────────────┐
│  User Message   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LangGraph      │
│  Workflow       │
└────────┬────────┘
         │
         ├─→ Process message
         │
         ├─→ Save checkpoint
         │   (PostgreSQL)
         │
         └─→ Return response
```

### Knowledge Base RAG

```
┌─────────────────┐
│  User Query     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Generate       │
│  Embedding      │
│  (OpenAI)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vector Search  │
│  (LanceDB)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Retrieve Top-K │
│  Documents      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Format Context │
│  for LLM        │
└─────────────────┘
```

### ML Training Data Pipeline

```
┌─────────────────┐
│  Transactions   │
│  (PostgreSQL)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Extract        │
│  Features       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Store in       │
│  DuckDB         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Train Model    │
│  (Background)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Save Model     │
│  (Disk)         │
└─────────────────┘
```

---

## 🛡️ Security Architecture

### Authentication Flow

```
┌─────────────────┐
│  Client Request │
│  with JWT       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auth           │
│  Middleware     │
└────────┬────────┘
         │
         ├─→ Extract token
         │
         ├─→ Call Node API
         │   /auth/verify
         │
         ├─→ Attach user
         │   to request.state
         │
         └─→ Continue
```

### Rate Limiting

```
┌─────────────────┐
│  Incoming       │
│  Request        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Rate Limit     │
│  Middleware     │
└────────┬────────┘
         │
         ├─→ Get user_id
         │
         ├─→ Check global
         │   bucket
         │
         ├─→ Check user
         │   bucket
         │
         ├─→ Check endpoint
         │   bucket
         │
         ├─→ Allow (200)
         └─→ or Block (429)
```

---

## 🎯 Component Responsibilities

### Endpoints
- **Copilot:** Chat interface and streaming
- **Health:** System status monitoring
- **ML:** Machine learning predictions
- **Admin:** System management and configuration

### Middleware
- **CORS:** Cross-origin resource sharing
- **Rate Limit:** Request throttling and abuse prevention
- **Auth:** User authentication and authorization

### Services
- **LangGraph:** Agentic workflow orchestration
- **ML Service:** Model inference and training
- **Knowledge Base:** RAG and semantic search

### Databases
- **PostgreSQL:** User data, transactions, conversation state
- **LanceDB:** Vector embeddings for semantic search
- **DuckDB:** Analytics aggregations and ML training data

### External APIs
- **Node.js API:** Single source of truth for user data
- **Embedding API:** bge-m3 embeddings (1024-dim, via Ollama or hosted service)
- **DeepSeek API:** LLM inference (cost-effective, 100x cheaper than GPT-4)

---

## 📈 Scalability Considerations

### Horizontal Scaling
```
┌──────────────┐
│ Load Balancer│
└──────┬───────┘
       │
       ├─→ FastAPI Instance 1
       ├─→ FastAPI Instance 2
       ├─→ FastAPI Instance 3
       └─→ FastAPI Instance N
           │
           ▼
    ┌──────────────┐
    │ PostgreSQL   │
    │ (Primary +   │
    │  Replicas)   │
    └──────────────┘
```

### Caching Strategy
- Rate limit buckets → Redis
- User profiles → Redis (TTL: 5 min)
- ML models → In-memory (per worker)
- Vector embeddings → LanceDB (persistent)

### Background Jobs
- ML training → Celery/RQ
- Knowledge base ingestion → Background tasks
- Analytics aggregation → DuckDB scheduled queries

---

## 🔧 Configuration

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection
- `DEEPSEEK_API_KEY` - LLM API
- `SMARTPAY_API_BASE_URL` - Node API URL
- `EMBEDDING_MODEL` - Embedding model (bge-m3)
- `EMBEDDING_API_URL` - Embedding service URL
- `LANCEDB_PATH` - Vector DB path
- `DUCKDB_PATH` - Analytics DB path

**Optional:**
- `REDIS_URL` - Redis connection (production rate limiting)
- `ML_ENABLED` - Enable ML service
- `ENVIRONMENT` - Environment name
- `LOG_LEVEL` - Logging verbosity

---

## 📊 Monitoring

### Health Checks
- **Liveness:** `GET /health`
- **Readiness:** `GET /api/health/detailed`

### Metrics to Track
- Request latency (p50, p95, p99)
- Error rate by endpoint
- Rate limit hits
- ML inference time
- Database query time
- Active connections
- Memory usage
- CPU usage

### Logging
- Structured JSON logs
- Request ID tracing
- User context (user_id)
- Error stack traces
- Performance metrics

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION                            │
│                                                           │
│  ┌──────────────┐        ┌──────────────┐              │
│  │   Cloudflare │───────→│ Load Balancer│              │
│  │   (CDN/WAF)  │        │   (Nginx)    │              │
│  └──────────────┘        └──────┬───────┘              │
│                                  │                       │
│                    ┌─────────────┼─────────────┐        │
│                    │             │             │        │
│              ┌─────▼────┐  ┌─────▼────┐  ┌────▼─────┐ │
│              │ FastAPI  │  │ FastAPI  │  │ FastAPI  │ │
│              │ Worker 1 │  │ Worker 2 │  │ Worker N │ │
│              └─────┬────┘  └─────┬────┘  └────┬─────┘ │
│                    └─────────────┼─────────────┘        │
│                                  │                       │
│                    ┌─────────────┼─────────────┐        │
│                    │             │             │        │
│              ┌─────▼────┐  ┌─────▼────┐  ┌────▼─────┐ │
│              │PostgreSQL│  │  Redis   │  │ LanceDB  │ │
│              │(Primary +│  │ (Cache + │  │ (Vector) │ │
│              │ Replicas)│  │   Rate)  │  │          │ │
│              └──────────┘  └──────────┘  └──────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Architecture Summary

**Layers:**
- 🌐 **Client Layer:** Mobile, Web, Admin
- 🔒 **Middleware Layer:** CORS, Rate Limit, Auth
- 🎯 **API Layer:** Copilot, Health, ML, Admin
- 🧠 **Service Layer:** LangGraph, ML, Knowledge Base
- 💾 **Data Layer:** PostgreSQL, LanceDB, DuckDB, Node API

**Key Features:**
- ✅ Real-time SSE streaming
- ✅ Multi-database architecture
- ✅ Graceful degradation
- ✅ Horizontal scalability
- ✅ Security-first design
- ✅ Comprehensive monitoring
- ✅ Production-ready

**Total Components:**
- 17 API endpoints
- 3 middleware layers
- 3 core services
- 5 data stores
- 2 external APIs
