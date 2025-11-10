# **LifeCompass Technical Architecture Diagram**

## **High-Level System Overview**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LifeCompass Platform                          │
│                    Unified Customer-Advisor Experience                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
          ┌─────────▼─────────┐     │     ┌─────────▼─────────┐
          │   Customer Portal │     │     │ Advisor Command   │
          │   Self-Service    │     │     │ Center (CRM)      │
          └───────────────────┘     │     └───────────────────┘
                                    │
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
          ┌─────────▼─────────┐     │     ┌─────────▼─────────┐
          │   AI Orchestration│◄────┼────►│ Context Packaging │
          │   & Prompts       │     │     │ & Escalation      │
          └───────────────────┘     │     └───────────────────┘
                                    │
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
          ┌─────────▼─────────┐     │     ┌─────────▼─────────┐
          │   Knowledge Base  │     │     │   Analytics &     │
          │   (Vector Search) │     │     │   Reporting       │
          └───────────────────┘     │     └───────────────────┘
                                    │
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
          ┌─────────▼─────────┐     │     ┌─────────▼─────────┐
          │   Database Layer  │◄────┼────►│   Integration     │
          │   (Neon PG + Neo4j│     │     │   Layer (APIs)    │
          └───────────────────┘     │     └───────────────────┘
```

---

## **Detailed Component Architecture**

### **1. Frontend Layer (Customer Portal & Advisor CRM)**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Frontend Layer                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  Customer Portal│  │ Advisor Command │  │   Shared UI     │         │
│  │   (7 Pages)     │  │ Center (7 Pages)│  │   Components    │         │
│  │                 │  │                 │  │                 │         │
│  │ • Landing       │  │ • Dashboard     │  │ • Chat Bubble   │         │
│  │ • AI Chat       │  │ • Client Search │  │ • Task Cards    │         │
│  │ • Products      │  │ • 360° View     │  │ • Forms         │         │
│  │ • Claims        │  │ • Task Mgmt     │  │ • Modals        │         │
│  │ • Policies      │  │ • Communication │  │ • Navigation    │         │
│  │ • Advisors      │  │ • Analytics     │  │ • Notifications │         │
│  │ • Tools         │  │ • Knowledge     │  │                 │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│  Technology: Next.js 14 + App Router + DaisyUI + Tailwind CSS          │
│  Deployment: Vercel (CDN, Edge Functions, ISR)                         │
│  Performance: <2s page loads, <3s AI responses                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### **2. AI Orchestration Layer**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       AI Orchestration Layer                            │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Prompt System │  │   LLM Providers │  │   Context       │         │
│  │   Management    │  │   Orchestration │  │   Intelligence   │         │
│  │                 │  │                 │  │                 │         │
│  │ • Customer      │  │ • OpenAI        │  │ • Session State  │         │
│  │ • Advisor       │  │ • Anthropic     │  │ • User History   │         │
│  │ • Claims        │  │ • Google        │  │ • Preferences    │         │
│  │ • Investment    │  │ • DeepSeek      │  │ • Relationships  │         │
│  │ • Compliance    │  │ • Fallback      │  │                 │         │
│  │ • Escalation    │  │ • Rate Limiting │  │                 │         │
│  │ • Knowledge     │  └─────────────────┘  └─────────────────┘         │
│  │ • Monitoring    │                                                   │
│  └─────────────────┘                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │              Unified Tool Layer (lib/agent/tools.ts) ✅           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │ │
│  │  │ Search Tools │  │  CRM Tools   │  │ Utility Tools │          │ │
│  │  │             │  │              │  │              │          │ │
│  │  │ • Vector     │  │ • Customer   │  │ • Calculator │          │ │
│  │  │ • Hybrid     │  │ • Advisor    │  │ • Extract    │          │ │
│  │  │ • Graph      │  │ • Policies   │  │   Calculation│          │ │
│  │  │ • Documents  │  │ • Claims     │  │              │          │ │
│  │  │ • Entities   │  │ • Tasks      │  │              │          │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │ │
│  │  Shared by: LifeCompassAgent + CopilotKit Runtime                 │ │
│  └───────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  Technology: TypeScript (Next.js) + Python (FastAPI) + Custom Prompts  │
│  Compliance: POPIA/FICA regulatory requirements                         │
│  Performance: <3s response time, 99.9% availability                     │
│  Status: ✅ Production-ready, all tools implemented and tested           │
└─────────────────────────────────────────────────────────────────────────┘
```

### **3. Knowledge Base & Search Layer**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 Knowledge Base & Search Layer                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  Document       │  │   Vector Search │  │   Hybrid Search  │         │
│  │  Processing     │  │   Engine        │  │   & Retrieval    │         │
│  │                 │  │                 │  │                 │         │
│  │ • Crawling      │  │ • Embeddings    │  │ • Text Search    │         │
│  │ • Chunking      │  │ • Similarity    │  │ • Ranking        │         │
│  │ • OCR           │  │ • Indexing      │  │ • Filtering      │         │
│  │ • Metadata      │  │ • Caching       │  │ • Context        │         │
│  │ • Product Maps  │  │                 │  │ • Keyword Match  │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│  Data Sources: 2,977 Old Mutual web pages + 99 PDF documents          │
│  Technology: PostgreSQL Vector + Neo4j Graph + Redis Cache             │
│  Storage: PDFs in public/documents/ for Vercel serverless deployment  │
│  Performance: <1s search results, 95%+ accuracy                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### **4. Database Layer (CRM Schema)**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Database Layer (CRM)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Core Tables   │  │   Analytics     │  │   Triggers &    │         │
│  │   (9 tables)    │  │   Tables (3)    │  │   Functions     │         │
│  │                 │  │                 │  │                 │         │
│  │ • customers     │  │ • customer_     │  │ • LTV calc      │         │
│  │ • policies      │  │   analytics     │  │ • Churn predict │         │
│  │ • claims        │  │ • advisor_      │  │ • Auto tasks    │         │
│  │ • advisors      │  │   performance   │  │ • Notifications  │         │
│  │ • interactions  │  │ • policy_       │  │ • Audit logs    │         │
│  │ • tasks         │  │   analytics     │  │                 │         │
│  │ • communications│  └─────────────────┘  └─────────────────┘         │
│  │ • sessions      │                                                   │
│  │ • messages      │                                                   │
│  └─────────────────┘                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Technology: Neon PostgreSQL (Vector + JSONB + Advanced Functions)     │
│  Relationships: 20+ foreign keys, cascading updates, referential integrity│
│  Performance: <500ms queries, ACID compliance, auto-scaling            │
└─────────────────────────────────────────────────────────────────────────┘
```

### **5. Integration & API Layer**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   Integration & API Layer                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Internal APIs │  │   External      │  │   Security &    │         │
│  │   (REST/GraphQL)│  │   Integrations  │  │   Middleware    │         │
│  │                 │  │                 │  │                 │         │
│  │ • Customer Mgmt │  │ • Old Mutual    │  │ • Authentication │         │
│  │ • Policy Data   │  │ • Twilio        │  │ • Authorization  │         │
│  │ • AI Services   │  │ • SendGrid      │  │ • Rate Limiting  │         │
│  │ • Search        │  │ • DocuSign      │  │ • Encryption     │         │
│  │ • Document APIs │  │ • Calendar APIs │  │ • Audit Trails   │         │
│  │ • Analytics     │  │                 │  │                 │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│  Technology: FastAPI + OpenAPI 3.0 + OAuth 2.0 + JWT                   │
│  Security: AES-256 encryption, RBAC, comprehensive logging             │
│  Scalability: Horizontal scaling, load balancing, API gateway          │
└─────────────────────────────────────────────────────────────────────────┘
```

### **6. Infrastructure & DevOps Layer**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  Infrastructure & DevOps Layer                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Hosting &     │  │   Monitoring &  │  │   CI/CD &       │         │
│  │   Scaling       │  │   Observability │  │   Deployment    │         │
│  │                 │  │                 │  │                 │         │
│  │ • Vercel (FE)   │  │ • Application   │  │ • GitHub Actions│         │
│  │ • Railway (BE)  │  │ • Performance   │  │ • Automated     │         │
│  │ • Neon (DB)     │  │ • Error tracking│  │ • Testing       │         │
│  │ • Redis Cache   │  │ • Infrastructure │  │ • Rollbacks     │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│  Availability: 99.9% uptime SLA, <4 hour RTO, <1 hour RPO              │
│  Security: WAF, DDoS protection, regular penetration testing           │
│  Performance: Auto-scaling, global CDN, caching layers                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## **Data Flow Architecture**

### **Customer Escalation Flow**

```
Customer Portal → AI Chat → Escalation Trigger → Context Packaging → Advisor Task Queue
       ↓              ↓              ↓                    ↓                    ↓
   UI Event    Prompt Selection  Task Creation    Package Generation    Notification
       ↓              ↓              ↓                    ↓                    ↓
   API Call    LLM Processing   Database Insert   JSON Serialization   Email/SMS Alert
```

### **Advisor Response Flow**

```
Advisor Dashboard → Task Selection → Context Review → Client Engagement → Resolution
       ↓                    ↓                ↓                ↓              ↓
   Task Update        Profile Load    History Display   Meeting Schedule  Status Update
       ↓                    ↓                ↓                ↓              ↓
   DB Update          API Calls      Real-time Sync    Calendar API     Notification
```

### **Search & Knowledge Flow**

```
User Query → Search Interface → Vector Processing → Hybrid Ranking → Results Display
      ↓              ↓                    ↓                ↓              ↓
  Text Input    API Request      Embedding Search   Score Calculation  UI Rendering
      ↓              ↓                    ↓                ↓              ↓
  Validation    Rate Limiting    Database Query    Filtering Rules   Pagination
```

### **Product Document Search Flow**

```
Product Query → Product Mapping → Direct Match → Document Retrieval → Display
      ↓                ↓                ↓                ↓              ↓
  Product Name    Check Mapping    Found? Yes      Fetch Document   View/Download
      ↓                ↓                ↓                ↓              ↓
  No Match?      Keyword Search    Multi-Keyword   Rank Results    Library View
      ↓                ↓                ↓                ↓              ↓
  Fallback       Title/Desc/Cat    Score & Filter  Top 10 Results   Pagination
```

---

## **Security & Compliance Architecture**

### **Data Protection Layers**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Security Architecture                            │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Network       │  │   Application   │  │   Data          │         │
│  │   Security      │  │   Security      │  │   Protection    │         │
│  │                 │  │                 │  │                 │         │
│  │ • WAF           │  │ • Input         │  │ • Encryption    │         │
│  │ • DDoS          │  │ • Validation    │  │ • Masking       │         │
│  │ • SSL/TLS       │  │ • RBAC          │  │ • Tokenization  │         │
│  │ • VPN           │  │ • Audit Logs    │  │ • Key Mgmt      │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│  Compliance: POPIA, FICA, OWASP Top 10, WCAG 2.1 AA                    │
│  Monitoring: Real-time alerts, automated responses, incident tracking  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## **Performance & Scalability Metrics**

### **System Performance Targets**

- **Page Load Time**: <2 seconds (p95)
- **API Response Time**: <500ms (p95)
- **AI Response Time**: <3 seconds (p95)
- **Search Results**: <1 second (p95)
- **Concurrent Users**: 10,000+ supported
- **Uptime**: 99.9% SLA
- **Data Latency**: <100ms for real-time features

### **Scaling Architecture**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Scalability Architecture                           │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Horizontal    │  │   Database      │  │   Caching       │         │
│  │   Scaling       │  │   Optimization  │  │   Strategy      │         │
│  │                 │  │                 │  │                 │         │
│  │ • Load Balancer │  │ • Read Replicas │  │ • Redis Cluster │         │
│  │ • Auto-scaling  │  │ • Sharding      │  │ • CDN           │         │
│  │ • Microservices │  │ • Indexing      │  │ • Compression   │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│  Growth Path: Hackathon → Pilot → Production → Regional Expansion      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## **Integration Points**

### **Old Mutual Core Systems**

```
LifeCompass ←─── API Gateway ───→ Policy Administration System
     ↑                              ↓
Real-time Sync              Billing System
     ↓                              ↓
Advisor Portal           Customer Database
```

### **Third-Party Services**

```
LifeCompass ←─── Integration Layer ───→ External Services
     ↑                                     ↓
Twilio (SMS)                     SendGrid (Email)
     ↓                                     ↓
DocuSign (Signatures)          Google Calendar
     ↓                                     ↓
Firebase (Push)               Payment Gateways
```

This architecture diagram shows how all components of LifeCompass work together to deliver a seamless, scalable, and secure financial services platform. The modular design allows for independent scaling of components while maintaining tight integration for real-time features like contextual escalation.
