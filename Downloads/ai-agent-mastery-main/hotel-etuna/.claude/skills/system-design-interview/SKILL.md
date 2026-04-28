---
name: system-design-interview
description: This skill should be used when preparing for system design interviews or designing systems following interview best practices. It provides the 5-step interview framework, scale estimation techniques, and mock interview examples.
---

# System Design Interview

This skill provides comprehensive guidance for system design interviews, including the proven 5-step framework and best practices based on 200+ interview experiences.

## When to Use This Skill

Use this skill when:
- Preparing for system design interviews
- Following structured system design process
- Estimating system scale
- Presenting system designs
- Practicing interview scenarios

## 5-Step Interview Framework

### ⏱️ Time Management (45-60 min interview)

| Step | Time | Focus |
|------|------|-------|
| 1. Gather Requirements | 3-5 min | Clarifying questions |
| 2. Estimate Scale | 5-7 min | Users, TPS, Storage |
| 3. Design Goals | 3-5 min | Trade-offs |
| 4. Single Server Design | 15-20 min | Schema, APIs, Logic |
| 5. Scale & Optimize | 15-20 min | Bottlenecks, Solutions |

---

### Step 1: Gather Requirements (3-5 min)

> **Always ask clarifying questions, even if problem seems clear!**

**URL Shortener Example Questions:**
- Do we need personalization?
- Analytics support?
- URL expiry?
- Custom short URLs?

**Freeze requirements before proceeding!**

#### Functional Requirements
- Critical product features
- What users can do
- Core workflows

#### Non-Functional Requirements
- Performance (latency, throughput)
- Reliability/Uptime
- Scalability
- Security

**Example:**
| Functional | Non-Functional |
|------------|----------------|
| Create profile | < 200ms latency |
| Follow users | 99.9% uptime |
| Post tweets | Handle 300M DAU |
| View timeline | Eventual consistency OK |
| Like/Retweet | |

> **Pro Tip:** Requirements are powerful - once noted properly, many technical options will be decided for you!

---

### Step 2: Estimate Scale (5-7 min)

**Formula:**
```
Daily Active Users (DAU)
    → % that write/read
    → Requests per second (TPS)
    → Storage requirements
```

**URL Shortener Example:**
```
Given: 1 million DAU
Assume: 90% read, 10% write

Writers: 1M × 10% = 100K writes/day
Storage per record: ~1KB
Daily storage: 100K × 1KB = 100MB/day
Yearly storage: 100MB × 365 = 36.5GB/year

Verdict: Single machine can handle storage!
```

**Key Metrics to Calculate:**
| Metric | Why It Matters |
|--------|----------------|
| Read TPS | Caching decisions |
| Write TPS | Database choice |
| Storage | Sharding needs |
| Bandwidth | CDN decisions |

**Calculation Steps:**
1. Start with DAU (Daily Active Users)
2. Estimate read/write ratio
3. Calculate requests per second:
   ```
   Write TPS = (DAU × write%) / (86400 seconds/day)
   Read TPS = (DAU × read%) / (86400 seconds/day)
   ```
4. Estimate storage:
   ```
   Daily storage = writes/day × bytes per record
   Yearly storage = daily storage × 365
   ```

---

### Step 3: Design Goals (3-5 min)

**Trade-off 1: CAP Theorem**
```
URL Shortener:
- Can live with eventual consistency
- MUST have availability
- Choice: AP system
```

**Trade-off 2: Latency**
```
URL Shortener: LOW latency (< 100ms)
Recommendation Engine: Higher latency OK (seconds)
Batch Processing: Minutes/hours OK
```

**Common Trade-offs:**
- Consistency vs Availability
- Latency vs Throughput
- Cost vs Performance
- Simplicity vs Flexibility

---

### Step 4: Design for Single Server (15-20 min)

> **⚠️ Always start with RDBMS, not NoSQL!** (Red flag in interviews)

**URL Shortener APIs:**
```
POST /shorten
Request:  { "url": "https://very-long-url.com/...", "expiry": "7d" }
Response: { "short_url": "https://short.ly/abc123" }

GET /{shortCode}
Response: 301 Redirect to original URL
```

**Schema:**
```sql
CREATE TABLE urls (
    short_code VARCHAR(10) PRIMARY KEY,  -- Not auto-increment ID!
    long_url TEXT NOT NULL,
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    user_id INT
);
```

**Business Logic - Generating Short Codes:**

❌ **Auto-increment ID:** Guessable (ID 54 → 53 others exist)

❌ **MD5/SHA256:** Too long (32+ chars)

✅ **Base62 encoding:**
```
Characters: a-z, A-Z, 0-9 = 62 chars
5 chars = 62^5 = 916 million combinations
6 chars = 62^6 = 56 billion combinations
```

**Pre-generation approach:**
```
1. Pre-generate millions of codes
2. Store in HashSet (randomized order)
3. Distribute to servers (1M codes each)
4. Each server draws from its pool
```

---

### Step 5: Scale for Numbers (15-20 min)

**Identify Bottlenecks:**

| Bottleneck | Solution |
|------------|----------|
| High read TPS | Caching, Read replicas |
| High write TPS | Sharding, Message queues |
| Single DB | Partition/Shard |
| Single server | Load balancer + multiple servers |

**Scaling URL Shortener:**
```
┌────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client   │────►│ Load Balancer│────►│  App Server │
└────────────┘     └─────────────┘     │  (Pool of   │
                                        │  pre-gen    │
                                        │  codes)     │
                                        └──────┬──────┘
                                               │
                   ┌───────────────────────────┼───────────────────────────┐
                   │                           │                           │
            ┌──────▼──────┐             ┌──────▼──────┐             ┌──────▼──────┐
            │   Cache     │             │  DB Master  │             │  DB Replica │
            │   (Redis)   │             │   (Write)   │             │   (Read)    │
            └─────────────┘             └─────────────┘             └─────────────┘
```

## Mock Interview Example: Google Search Typeahead

### Requirements Gathered:
- Display top 5 suggestions
- Sorted by popularity
- Handle typos (optional)
- Low latency (< 100ms)

### Design Goals:
- **Availability** over Consistency (eventual consistency OK)
- **Very low latency** (real-time as user types)

### Data Structure: Trie

```
        root
       /    \
      d      c
     /        \
    o          a
   / \          \
  n   g         t
 /     \
a       [end]
l
d
```

**Each node stores:**
- Character
- Is end of word (boolean)
- **Top 5 suggestions** (Min Heap)
- Frequency count

### Optimization 1: Pre-compute Top K
Store top 5 at EACH node:
```
At 'do' node:
- donald (1000 searches)
- dog (800 searches)
- download (600 searches)
- doctor (400 searches)
- document (200 searches)
```
**Query complexity: O(1)** instead of traversing entire subtree!

### Optimization 2: Reduce Writes

**Problem:** Every search updates frequency → blocks reads

**Solution 1: Batching**
```
Instead of: Update on every search
Do: Accumulate in HashMap → Bulk update when count reaches 1000
```

**Solution 2: Sampling**
```
Only count every 100th search
Popular terms will still dominate (law of large numbers)
```

### Scaling: Consistent Hashing by Prefix

```
Prefixes: aa, ab, ac... → Shard 1
Prefixes: ba, bb, bc... → Shard 2
...
```

```
                    ┌─── Shard 1 (a-f prefixes)
Query → Load    ────┼─── Shard 2 (g-m prefixes)
        Balancer    ├─── Shard 3 (n-s prefixes)
                    └─── Shard 4 (t-z prefixes)
```

### Replication for Fault Tolerance
Each shard replicated to 2-3 servers using consistent hashing

### Client-Side Optimization
**Debouncing:** Don't send request on every keystroke
```javascript
// Wait 300ms after user stops typing
// Then send request
```

## Golden Rules for Interviews

### DO ✅

1. **Use diagrams** - Visualize everything
2. **Start with RDBMS** - NoSQL needs justification
3. **Ask clarifying questions** - Even if problem seems clear
4. **State assumptions** - "I'm assuming 90% reads, 10% writes"
5. **Discuss trade-offs** - Show you understand options
6. **Think out loud** - Let interviewer follow your reasoning
7. **Iterate** - First design is never final

### DON'T ❌

1. **Don't jump to NoSQL** - Red flag without justification
2. **Don't say "use Redis"** - Without knowing WHY and HOW
3. **Don't over-engineer** - YAGNI (You Ain't Gonna Need It)
4. **Don't skip requirements** - They dictate design
5. **Don't forget scale** - Estimate numbers early
6. **Don't ignore failures** - What if X goes down?

## Interview Checklist

Before presenting your design:

- [ ] Gathered all requirements (functional + non-functional)
- [ ] Estimated scale (users, TPS, storage)
- [ ] Defined design goals and trade-offs
- [ ] Started with single server design (RDBMS first)
- [ ] Identified bottlenecks and scaling strategies
- [ ] Discussed failure scenarios
- [ ] Used diagrams to visualize architecture
- [ ] Explained trade-offs clearly
- [ ] Thought out loud throughout the process

## Common Interview Questions

### URL Shortener
- Requirements: Shorten URLs, redirect, analytics
- Scale: 1M DAU, 90% read, 10% write
- Key: Base62 encoding, pre-generated codes, caching

### Search Typeahead
- Requirements: Top 5 suggestions, sorted by popularity
- Scale: 10M DAU, very low latency
- Key: Trie data structure, pre-computed top K, sharding

### Chat System
- Requirements: Real-time messaging, group chats
- Scale: 100M DAU, low latency
- Key: WebSockets, message queues, read replicas

### News Feed
- Requirements: Personalized feed, real-time updates
- Scale: 500M DAU, high read TPS
- Key: Fan-out on write, caching, CDN

## Reference Material

For detailed examples and explanations, refer to:
- `../system-design-master/references/SYSTEM_DESIGN_MASTER_GUIDE.md` - Part 7: Interview Mastery section
