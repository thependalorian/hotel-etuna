---
name: database-design
description: This skill should be used when designing database schemas, choosing between SQL and NoSQL databases, modeling relationships, or optimizing database queries. It provides guidance on relational data modeling, SQL vs NoSQL decision-making, and database best practices.
---

# Database Design

This skill provides comprehensive guidance on database design, from relational data modeling to choosing between SQL and NoSQL databases.

## When to Use This Skill

Use this skill when:
- Designing database schemas
- Choosing between SQL and NoSQL
- Modeling relationships between entities
- Optimizing database queries
- Planning database migrations
- Deciding on database architecture

## Relational Data Modeling

### The Master Trick

**Underline all NOUNS and VERBS in requirements:**
- **Nouns** → Entities or Attributes
- **Verbs** → Status changes or Relationships

### Relationship Types

#### One-to-Many
```
USER (1) ←————→ (Many) POSTS
USER (1) ←————→ (Many) TWEETS
```

**Solution:** Add the "one" side's ID as foreign key in the "many" side

```sql
CREATE TABLE posts (
    id INT PRIMARY KEY,
    user_id INT REFERENCES users(id),  -- Foreign Key
    content TEXT,
    created_at TIMESTAMP
);
```

#### Many-to-Many
```
USER (Many) ←————→ (Many) SKILLS
```

**Solution:** Create a mapping/junction table

```sql
CREATE TABLE user_skills (
    id INT PRIMARY KEY,
    user_id INT REFERENCES users(id),
    skill_id INT REFERENCES skills(id)
);
```

### LinkedIn Schema Example

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    USERS     │     │ USER_SKILLS  │     │   SKILLS     │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │────▶│ id (PK)      │◀────│ id (PK)      │
│ name         │     │ user_id (FK) │     │ name         │
│ email        │     │ skill_id (FK)│     └──────────────┘
│ profile_pic  │     └──────────────┘
└──────────────┘
```

### Critical Rule: Never Store Lists in a Single Column

```sql
-- ❌ BAD: This causes O(n) scan operations
skills: "Java, JavaScript, Python"

-- Query becomes:
SELECT * FROM users WHERE skills LIKE '%Java%'  -- SCAN!

-- ✅ GOOD: Use junction table
CREATE TABLE user_skills (
    user_id INT REFERENCES users(id),
    skill_id INT REFERENCES skills(id),
    PRIMARY KEY (user_id, skill_id)
);
```

### When to Split Tables

Even if columns are similar (Education vs Company), split when:
- Different attributes needed later (CGPA vs Salary)
- Avoid NULL columns
- Keep database logic out of application

## SQL vs NoSQL Databases

### Relational Databases (SQL)

**Examples:** PostgreSQL, MySQL, Oracle, SQLite

**Structure:**
- Tables with columns and rows
- Like spreadsheets
- Strict schema

**Advantages:**
| Feature | Description |
|---------|-------------|
| Complex JOINs | Combine multiple tables |
| ACID Transactions | Atomic, Consistent, Isolated, Durable |
| Data Integrity | Strong consistency |

**ACID Explained:**
```
A - Atomic      → All or nothing (entire transaction succeeds/fails)
C - Consistent  → Valid state to valid state
I - Isolated    → Concurrent transactions don't interfere
D - Durable     → Data persists even after system failure
```

### Non-Relational Databases (NoSQL)

#### Types of NoSQL:

| Type | Example | Best For |
|------|---------|----------|
| **Document Store** | MongoDB | JSON-like documents, complex structures |
| **Wide Column** | Cassandra, CosmosDB | Massive scale, many writes |
| **Graph** | Neo4j, Amazon Neptune | Relationships, recommendations |
| **Key-Value** | Redis, Memcached | Speed, simplicity, caching |

**Document Store Example (MongoDB):**
```json
{
  "user_id": 123,
  "name": "John",
  "orders": [
    {"product": "Laptop", "price": 999},
    {"product": "Mouse", "price": 29}
  ],
  "addresses": [
    {"type": "home", "city": "NYC"},
    {"type": "work", "city": "Boston"}
  ]
}
```

### Decision Matrix

| Use SQL When | Use NoSQL When |
|--------------|----------------|
| Data is well-structured with clear relationships | Unstructured/semi-structured data |
| Need strong consistency (banking, finance) | Need super low latency |
| Complex queries with JOINs | Flexible, scalable storage |
| ACID transactions critical | Massive data volumes |
| E-commerce with customers/orders | Recommendation engines, activity logs |

## Database Selection Guide

### Choose SQL When:
- ✅ Structured data with clear relationships
- ✅ Need ACID transactions (financial, e-commerce)
- ✅ Complex queries with JOINs
- ✅ Strong consistency required
- ✅ Examples: User accounts, orders, transactions, relational data

### Choose NoSQL When:
- ✅ Unstructured or semi-structured data
- ✅ High write throughput needed
- ✅ Horizontal scaling required
- ✅ Flexible schema needed
- ✅ Examples: User sessions, logs, real-time analytics, content management

## Database Options

### PostgreSQL (Recommended for most cases)
```typescript
// Supabase (PostgreSQL with built-in auth)
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

// Neon (Serverless PostgreSQL)
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

// Railway/Standard PostgreSQL
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

### MySQL
```typescript
// PlanetScale (Serverless MySQL)
import { connect } from '@planetscale/database';
const conn = connect({ url: process.env.DATABASE_URL });

// Standard MySQL
import mysql from 'mysql2/promise';
const connection = await mysql.createConnection(process.env.DATABASE_URL);
```

### MongoDB
```typescript
// MongoDB Atlas (Cloud)
import { MongoClient } from 'mongodb';
const client = new MongoClient(process.env.MONGODB_URI!);

// Mongoose ODM
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_URI!);
```

### Redis (Caching/Sessions)
```typescript
import { createClient } from 'redis';
const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();
```

## Query Optimization

### Parameterized Queries (Prevent SQL Injection)
```typescript
// ✅ SAFE: Parameterized query
const result = await sql`
  SELECT * FROM users 
  WHERE email = ${userEmail} AND status = ${status}
`;

// ❌ UNSAFE: String concatenation
const result = await sql.unsafe(
  `SELECT * FROM users WHERE email = '${userEmail}'`
);
```

### Indexing Strategy
- Index frequently queried columns
- Index foreign keys
- Use composite indexes for multi-column queries
- Monitor query performance and adjust indexes

### Transaction Management
```typescript
// PostgreSQL transaction example
await sql.begin(async (sql) => {
  await sql`INSERT INTO orders (user_id, total) VALUES (${userId}, ${total})`;
  await sql`UPDATE users SET balance = balance - ${total} WHERE id = ${userId}`;
  // Both succeed or both fail (ACID)
});
```

## Connection Management

### Serverless Environments (Vercel, Netlify)
- ✅ Use connection pooling libraries (`@neondatabase/serverless`, `@planetscale/database`)
- ✅ Implement connection reuse across function invocations
- ✅ Set appropriate connection timeouts
- ✅ Use HTTP-based drivers when available (Neon, PlanetScale)

### Traditional Server Environments
- ✅ Use connection pools (pg.Pool, mysql2 pool)
- ✅ Set max connections based on server capacity
- ✅ Implement connection health checks
- ✅ Graceful shutdown on server termination

## Error Handling

```typescript
try {
  const result = await sql`SELECT * FROM users WHERE id = ${id}`;
  return result;
} catch (error) {
  console.error('Database query failed:', {
    query: 'SELECT users',
    userId: id,
    error: error.message,
    timestamp: new Date().toISOString()
  });
  
  // Retry logic for transient failures
  if (isTransientError(error)) {
    return retryQuery(() => sql`SELECT * FROM users WHERE id = ${id}`);
  }
  
  throw new Error('Unable to fetch user data. Please try again.');
}
```

## Reference Material

For detailed examples and explanations, refer to:
- `../system-design-master/references/SYSTEM_DESIGN_MASTER_GUIDE.md` - Part 2: Database Design section
