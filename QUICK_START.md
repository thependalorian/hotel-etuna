# 🚀 Hotel Etuna: Quick Start Guide

**Current Status:** 95% Complete - Knowledge ingestion blocked by rate limits

---

## ⚡ **FASTEST PATH TO 100% COMPLETION**

### Option A: Wait & Retry with Voyage AI (15-30 min)

The Voyage API key hit rate limits. Wait 15-30 minutes, then:

```bash
# Just re-run the script
npx tsx scripts/ingest-hotel-etuna-knowledge.ts
```

**That's it!** The script will automatically:
- ✅ Load 5 knowledge documents
- ✅ Generate 124 semantic chunks
- ✅ Create 1024-dim embeddings via Voyage AI
- ✅ Upload to Qdrant vector database
- ✅ Enable Sofia AI to answer Hotel Etuna questions

**Expected output:**
```
✅ Ingestion Complete!
   Documents processed: 5
   Total chunks: 124
   Total embeddings: 124

🤖 Sofia AI can now answer questions about Hotel Etuna!
```

---

### Option B: Use Ollama Locally (Unlimited, Zero Cost)

If you don't want to wait:

```bash
# 1. Install Ollama
brew install ollama    # macOS
# or visit https://ollama.com for other platforms

# 2. Pull the embedding model (274MB, one-time)
ollama pull nomic-embed-text

# 3. Start Ollama server
ollama serve
```

**Then update `.env.local`:**
```env
# Comment out Voyage, add Ollama
# VOYAGE_API_KEY=pa-...
OLLAMA_BASE_URL=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
```

**Create `lib/integrations/embeddings-ollama.ts`:**
```typescript
import OpenAI from 'openai';

const ollama = new OpenAI({
  apiKey: 'ollama',
  baseURL: 'http://localhost:11434/v1',
});

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await ollama.embeddings.create({
    model: 'nomic-embed-text',
    input: text,
  });
  return response.data[0].embedding;
}

export function getEmbeddingDimension(): number {
  return 768; // nomic-embed-text dimension
}
```

**Update `scripts/ingest-hotel-etuna-knowledge.ts` imports:**
```typescript
// Change from:
import { getEmbedding } from '../lib/integrations/embeddings-voyage';

// To:
import { getEmbedding } from '../lib/integrations/embeddings-ollama';
```

**Run ingestion:**
```bash
npx tsx scripts/ingest-hotel-etuna-knowledge.ts
# ✅ No rate limits! Runs as fast as your CPU allows
```

---

## 🧪 **VERIFY SOFIA AI IS WORKING**

Once ingestion completes, test Sofia:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Visit:** `http://localhost:3000`

3. **Open Sofia chat widget** (bottom-right corner)

4. **Ask test questions:**
   ```
   "What does Etuna mean?"
   → Should explain Kiswahili meaning & cultural significance

   "Tell me about the rooms"
   → Should describe all 5 room types

   "What's on the restaurant menu?"
   → Should list menu items from Etuna Restaurant

   "What tours are available?"
   → Should describe local experiences
   ```

5. **Expected:** Detailed, accurate answers about Hotel Etuna ✅

---

## 📦 **WHAT'S ALREADY WORKING**

You can test these **right now** (no knowledge ingestion needed):

```bash
npm run dev
```

Then visit:

| Feature | URL | Status |
|---------|-----|--------|
| **Homepage** | `/` | ✅ |
| **Rooms** | `/rooms` | ✅ |
| **Restaurant** | `/dining` | ✅ |
| **Tours** | `/tours` | ✅ |
| **Admin Dashboard** | `/admin/dashboard` | ✅ |
| **Partner Portal** | `/partner/dashboard` | ✅ |
| **Booking System** | Create booking from admin | ✅ |

**Login Credentials:**

**Hub Admin:**
- Email: `admin@etuna.com`
- Password: `admin123456`

**Partner: JayLa**
- Email: `admin@jayla.com`
- Password: `admin123456`

**Partner: Aquarius**
- Email: `admin@aquarius.com`
- Password: `admin123456`

---

## 🎯 **PRODUCTION DEPLOYMENT**

Once Sofia AI knowledge is ingested:

```bash
# 1. Commit changes
git add .
git commit -m "feat: complete Hotel Etuna production setup"

# 2. Push to Vercel (auto-deploys)
git push origin main

# 3. Verify environment variables in Vercel dashboard
# Go to: https://vercel.com/your-project/settings/environment-variables

# Required vars:
# - DATABASE_URL (Neon DB connection string)
# - QDRANT_URL (Vector database URL)
# - QDRANT_API_KEY (Vector database auth)
# - VOYAGE_API_KEY or OLLAMA_BASE_URL (Embeddings provider)
# - DEEPSEEK_API_KEY (Sofia AI LLM)
# - GROQ_API_KEY (Alternative LLM)
# - HUB_TENANT_ID (c8cba92f-cbb1-4a79-b02f-d8d6d66b31a8)
# - DEFAULT_PROPERTY_ID (58d8c4ae-65e4-44f0-a70d-ec829a7a946a)

# 4. Run post-deploy smoke tests
# - Visit production URL
# - Test all public pages
# - Test Sofia AI chat
# - Create test booking via admin
# - Verify RLS (different tenants can't see each other's data)
```

---

## 📚 **DOCUMENTATION**

Full reports available in `docs/reports/`:

| Document | Purpose |
|----------|---------|
| `FINAL_PRODUCTION_STATUS.md` | Comprehensive production readiness report |
| `PRODUCTION_READINESS_VERIFICATION.md` | RLS, TypeScript, build verification |
| `PRODUCTION_CLEANUP_SUMMARY.md` | Codebase cleanup details |

---

## 🆘 **TROUBLESHOOTING**

### "Rate limit error" when running ingestion
**Solution:** Wait 30 minutes OR switch to Ollama (Option B above)

### "Qdrant connection failed"
**Check:** `QDRANT_URL` and `QDRANT_API_KEY` in `.env.local`
```bash
curl -H "api-key: YOUR_KEY" https://YOUR_CLUSTER.cloud.qdrant.io/collections
```

### "Sofia AI not responding"
1. **Check:** Knowledge ingestion completed successfully
2. **Check:** `DEEPSEEK_API_KEY` or `GROQ_API_KEY` in `.env.local`
3. **Check:** Qdrant collection exists:
   ```bash
   # Should show "sofia_knowledge" collection
   curl -H "api-key: YOUR_KEY" https://YOUR_CLUSTER.cloud.qdrant.io/collections
   ```

### "TypeScript errors"
```bash
# Should show zero errors
npm run typecheck
```

### "Build failures"
```bash
# Should complete successfully
npm run build
```

---

## ✅ **COMPLETION CHECKLIST**

- [x] Database schema created
- [x] RLS policies enforced
- [x] Hub property seeded (Hotel Etuna)
- [x] Partner properties seeded (JayLa, Aquarius)
- [x] TypeScript compilation clean
- [x] Production build successful
- [x] Public website functional
- [x] Admin dashboard functional
- [x] Partner portal functional
- [ ] **Sofia AI knowledge ingested** ← YOU ARE HERE
- [ ] Sofia AI tested and verified
- [ ] Deployed to production
- [ ] Production smoke tests passed

---

## 🎉 **YOU'RE ALMOST THERE!**

The platform is **95% complete**. Just:
1. Wait 30 min and retry ingestion, OR
2. Set up Ollama locally (15 min)
3. Test Sofia AI
4. Deploy to production

**That's it!** 🚀
