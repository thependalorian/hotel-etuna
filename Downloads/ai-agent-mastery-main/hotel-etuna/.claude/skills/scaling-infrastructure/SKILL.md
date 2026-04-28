---
name: scaling-infrastructure
description: This skill should be used when designing scalable systems, implementing load balancing, caching strategies, or planning infrastructure. It provides guidance on vertical vs horizontal scaling, load balancing, stateless vs stateful systems, consistent hashing, caching, and CAP theorem.
---

# Scaling & Infrastructure

This skill provides comprehensive guidance on scaling systems, from single server to millions of users, including load balancing, caching, and infrastructure design.

## When to Use This Skill

Use this skill when:
- Designing scalable architectures
- Planning infrastructure
- Implementing load balancing
- Designing caching strategies
- Choosing between vertical and horizontal scaling
- Understanding CAP theorem trade-offs
- Implementing consistent hashing

## Vertical vs Horizontal Scaling

### Vertical Scaling (Scale Up)
Add more resources to existing server:
- More RAM
- Better CPU
- More disk space

| Pros | Cons |
|------|------|
| Simple | Hardware limits |
| No code changes | Single point of failure |
| | Expensive at scale |

### Horizontal Scaling (Scale Out)
Add more servers to share load:

```
                    ┌─── Server 1
Client → LB ────────┼─── Server 2
                    └─── Server 3
```

| Pros | Cons |
|------|------|
| No hardware limits | More complex |
| Fault tolerant | Need load balancer |
| Cost effective | State management |

## Load Balancing

### Why Load Balancers?

```
                         ┌─── Server 1 ✓
User → DNS → Load ───────┼─── Server 2 ✓
             Balancer    ├─── Server 3 ✓
                         └─── Server 4 ✗ (down)
```

**Functions:**
- Distribute traffic evenly
- Health checks (detect failed servers)
- SSL termination
- Security layer

### Types

| Hardware LB | Software LB |
|-------------|-------------|
| F5, Citrix | Nginx, HAProxy |
| Expensive | Cost-effective |
| High performance | Flexible |

**Cloud Load Balancers:**
- AWS Elastic Load Balancing
- Azure Load Balancer
- Google Cloud Load Balancing

### Layer 4 vs Layer 7

| Layer 4 (Transport) | Layer 7 (Application) |
|--------------------|----------------------|
| Routes based on IP + Port | Routes based on headers, path, cookies |
| Faster | More flexible |
| More secure | Content-based routing |
| Can't inspect content | Can modify requests |

### Routing Algorithms

#### 1. Round Robin
```
Request 1 → Server 1
Request 2 → Server 2
Request 3 → Server 3
Request 4 → Server 1  (cycles back)
```

#### 2. Weighted Round Robin
```
Server 1 (weight=1): 25% traffic
Server 2 (weight=2): 50% traffic  ← More powerful
Server 3 (weight=1): 25% traffic
```

#### 3. Least Connections
```
Server 1: 5 connections
Server 2: 3 connections  ← Next request goes here
Server 3: 8 connections
```

#### 4. Least Response Time
Considers both connections AND response time

#### 5. IP Hash
Same client IP always goes to same server (sticky sessions)

#### 6. Geographic
Route to nearest data center

### Health Checks
```
LB ──── ping ────► Server 1 ✓
LB ──── ping ────► Server 2 ✓
LB ──── ping ────► Server 3 ✗ (remove from pool)
```

### Avoiding Single Point of Failure

```
        ┌─────────────┐
        │ Active LB   │◄── Handles traffic
        └──────┬──────┘
               │ Heartbeat
        ┌──────▼──────┐
        │ Standby LB  │◄── Takes over if Active fails
        └─────────────┘
```

## Stateless vs Stateful Systems

### Stateless Systems
**Example:** Calculator, REST APIs

```
Any server can handle any request
┌─────┐     ┌─────┐
│ S1  │     │ S2  │     2 + 2 = 4 (same result!)
└─────┘     └─────┘
```

| Pros | Cons |
|------|------|
| Easy to scale | Need external storage for state |
| Fault tolerant | Network I/O overhead |
| No sticky sessions | |

### Stateful Systems
**Example:** Chat apps, PUBG, Shopping carts

```
User must go to SAME server (has their data)
┌─────┐
│ S1  │ ◄── User A's game state here
└─────┘
```

| Pros | Cons |
|------|------|
| Lower latency | Hard to scale |
| No external storage | Not fault tolerant |
| | Sticky sessions needed |

### PUBG Example
Why stateful makes sense:
- Game state is **short-lived** (match duration)
- **Real-time** requirements (milliseconds matter)
- State doesn't need to persist after match

```
Match State (in memory):
- Player locations
- Health points
- Weapons
- Team info
```

## Consistent Hashing

### The Problem with Modular Hashing

```python
server = hash(key) % number_of_servers
```

**When servers change, EVERYTHING reshuffles!**

| Key | 3 Servers | 4 Servers | Same Server? |
|-----|-----------|-----------|--------------|
| 11 | 11%3 = 2 | 11%4 = 3 | ❌ |
| 42 | 42%3 = 0 | 42%4 = 2 | ❌ |
| 34 | 34%3 = 1 | 34%4 = 2 | ❌ |

### Consistent Hashing Solution

**Visualize a ring (0 to 10^18):**

```
           0
      ┌────────┐
     /    S1    \
    │     │      │
   S3     │      S2
    │     ●K1    │
     \          /
      └────────┘
```

**How it works:**
1. Hash servers onto ring
2. Hash keys onto ring
3. Key belongs to **first server clockwise**

### Virtual Nodes
Solve uneven distribution:
```
Server A → A0, A1, A2, A3, A4 (5 virtual nodes)
Server B → B0, B1, B2, B3, B4, B5, B6, B7, B8, B9 (10 virtual nodes - more powerful!)
```

### When Server Removed
```
Before: K1 → S2
S2 dies...
After: K1 → S3 (next clockwise)

Only K1 moves! Other keys STAY PUT! ✨
```

### Replication with Consistent Hashing
```
Replication Factor = 2
K1 stored on: S2 (primary) + S3 (next clockwise)

If S2 dies:
- Requests route to S3
- S3 already has the data!
- No data transfer needed!
```

## Caching Strategies

### Where to Cache

```
Browser Cache → CDN → Load Balancer → App Server Cache → Database Cache → Database
     │                                        │
     └─────────── Faster ◄────────────────────┘
```

### Caching Strategies

#### 1. Write-Through
```
Write Request → Update Cache → Update DB → Return Success
```
- ✅ Cache always consistent
- ❌ Higher write latency

#### 2. Write-Back (Write-Behind)
```
Write Request → Update Cache → Return Success
                     │
                     └──► Async update DB
```
- ✅ Fast writes
- ❌ Risk of data loss

#### 3. Write-Around
```
Write Request → Update DB → Return Success
(Cache not updated - will be populated on read)
```
- ✅ Cache not flooded with writes
- ❌ Cache miss on first read

#### 4. Cache-Aside (Lazy Loading)
```
Read Request:
1. Check cache
2. If miss → Query DB → Store in cache → Return
```

### Cache Invalidation Strategies

| Strategy | How it Works |
|----------|--------------|
| TTL (Time-To-Live) | Auto-expire after duration |
| Event-Based | Invalidate when data changes |
| Version-Based | New version = cache miss |

## CAP Theorem

### The Theorem

```
         Consistency
            /\
           /  \
          /    \
         /      \
        /________\
Availability    Partition
                Tolerance
```

**You can only guarantee 2 out of 3!**

| Choice | Description | Example |
|--------|-------------|---------|
| CP | Consistent + Partition | Banking systems |
| AP | Available + Partition | Social media, DNS |
| CA | Consistent + Available | Only possible without partitions |

> **Reality:** In distributed systems, **P is mandatory** (network failures happen). So you're really choosing between C and A.

### PACELC Extension

```
If PARTITION:
    Choose Availability or Consistency
ELSE:
    Choose Latency or Consistency
```

**Example Decisions:**
| System | Partition Choice | Normal Choice |
|--------|------------------|---------------|
| Banking | Consistency | Consistency |
| Twitter | Availability | Latency |
| MongoDB | Configurable | Configurable |

## Scaling Checklist

When scaling a system, consider:

- [ ] Identify bottlenecks (read TPS, write TPS, storage)
- [ ] Choose scaling strategy (vertical vs horizontal)
- [ ] Implement load balancing if multiple servers
- [ ] Design caching strategy
- [ ] Decide on stateless vs stateful
- [ ] Apply consistent hashing if needed
- [ ] Choose CAP trade-offs (Consistency vs Availability)
- [ ] Plan for failure (redundancy, health checks)
- [ ] Monitor and measure performance

## Reference Material

For detailed examples and explanations, refer to:
- `../system-design-master/references/SYSTEM_DESIGN_MASTER_GUIDE.md` - Part 4: Scaling & Infrastructure, Part 5: Performance & Reliability sections
