---
name: system-design-master
description: This skill should be used when designing systems, architectures, databases, APIs, or making technical decisions. It provides comprehensive guidance on software architecture, design principles, coding standards, scaling strategies, security, and interview preparation based on 200+ interview experiences and real-world senior engineering knowledge.
---

# System Design Master

This skill provides comprehensive system design guidance based on the System Design Master Guide, combining 200+ interview experiences with real-world senior engineering knowledge.

## When to Use This Skill

Use this skill when:
- Designing new systems or architectures from scratch
- Making architectural decisions (database selection, API design, scaling strategies)
- Reviewing or refactoring existing systems
- Preparing for system design interviews
- Evaluating trade-offs between different technical approaches
- Optimizing system performance and scalability
- Implementing security best practices
- Creating UI/UX designs following psychology principles
- Writing code that needs to follow senior engineering standards

## Core Principles to Always Apply

### 1. Software Design Principles

**KISS (Keep It Simple, Stupid)**
- Build the simplest solution to your current, known problem
- Avoid unnecessary complexity and premature optimization
- Write clear, straightforward code

**DRY (Don't Repeat Yourself) - But Be Strategic**
- Only abstract when consolidating a single business rule or concept
- Use the "Rule of Three" (abstract on the third repetition)
- Prefer duplication over wrong abstraction when concepts differ

**Boy Scout Rule**
- Leave code cleaner than you found it
- Make small, positive improvements as you work
- Prevent mess accumulation through continuous cleanup

**Avoid Over-engineering**
- Solve the problem you have today, not hypothetical future problems
- Ask: "What is the simplest thing that could possibly work?"

**Ship Stable Code**
- Focus on consistency, reliability, and incremental improvement
- Avoid large, risky changes that cause regressions

### 2. The 23 Essential Coding Standards

When writing code, always follow these 23 rules:

1. **Always Use DaisyUI** - Maintain consistent styling
2. **Create Modular UI Components** - Break into smaller, manageable pieces
3. **Component Documentation** - Include purpose, functionality, location
4. **Vercel Compatibility** - Ensure all endpoints work on Vercel
5. **Quick and Scalable Endpoints** - Optimize for performance
6. **Asynchronous Data Handling** - Use async operations and streaming
7. **API Response Documentation** - Document response structures
8. **Database Integration with SSR** - Use Server-Side Rendering
9. **Maintain Existing Functionality** - Never break current features
10. **Comprehensive Error Handling** - Include detailed error checks and logging
11. **Optimize for Quick Use** - Minimize loading animations
12. **Complete Code Verification** - Ensure code is error-free and bug-free
13. **Use TypeScript** - All development with proper type definitions
14. **Security and Scalability** - Build secure, scalable applications
15. **Error Checks and Logging** - Handle edge cases effectively
16. **Protect Exposed Endpoints** - Rate limiting and authentication
17. **Secure Database Access** - Follow best practices
18. **Step-by-Step Planning** - Plan before implementing
19. **Utilize Specified Tech Stack** - Next.js, appropriate database, Vercel
20. **Consistent Use of Existing Styles** - Reuse existing components
21. **Specify Script/File for Changes** - Always specify which file to modify
22. **Organize UI Components Properly** - All in `/components` folder
23. **Efficient Communication** - Optimize AI chat interactions

### 3. System Design Process

#### Step 1: Gather Requirements (3-5 min)
- Ask clarifying questions, even if the problem seems clear
- Distinguish between functional and non-functional requirements
- Freeze requirements before proceeding

**Functional Requirements:**
- Critical product features
- What users can do
- Core workflows

**Non-Functional Requirements:**
- Performance (latency, throughput)
- Reliability/Uptime
- Scalability
- Security

#### Step 2: Estimate Scale (5-7 min)
Calculate:
- Daily Active Users (DAU)
- Read/Write ratios
- Requests per second (TPS)
- Storage requirements
- Bandwidth needs

**Formula:**
```
DAU → % that write/read → TPS → Storage requirements
```

#### Step 3: Design Goals (3-5 min)
- Apply CAP Theorem (choose Consistency vs Availability)
- Define latency requirements
- Identify trade-offs

#### Step 4: Single Server Design (15-20 min)
- **Always start with RDBMS** (not NoSQL) unless justified
- Design database schema
- Define API endpoints
- Implement business logic

#### Step 5: Scale & Optimize (15-20 min)
Identify bottlenecks:
- High read TPS → Caching, Read replicas
- High write TPS → Sharding, Message queues
- Single DB → Partition/Shard
- Single server → Load balancer + multiple servers

### 4. Database Design Principles

#### Relational Data Modeling
- **Master Trick:** Underline all NOUNS and VERBS in requirements
  - Nouns → Entities or Attributes
  - Verbs → Status changes or Relationships

#### Relationship Types
- **One-to-Many:** Add foreign key in "many" side
- **Many-to-Many:** Create mapping/junction table
- **Never store lists in a single column** (causes O(n) scans)

#### SQL vs NoSQL Decision Matrix

**Use SQL When:**
- Structured data with clear relationships
- Need ACID transactions (banking, finance)
- Complex queries with JOINs
- Strong consistency required

**Use NoSQL When:**
- Unstructured/semi-structured data
- High write throughput needed
- Horizontal scaling required
- Flexible schema needed

### 5. API Design Best Practices

#### RESTful APIs
- Use plural nouns (not verbs): `GET /products` not `GET /getProducts`
- Support filtering, sorting, pagination via query parameters
- Version APIs: `/api/v1/products`
- Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Return appropriate status codes

#### API Security
- Rate limiting (per endpoint, per user/IP, global)
- CORS configuration
- Parameterized queries (prevent SQL injection)
- Authentication (JWT, OAuth 2.0)
- Authorization (RBAC, ABAC, ACL)

### 6. Scaling Strategies

#### Vertical vs Horizontal Scaling
- **Vertical (Scale Up):** Add resources to existing server
  - Simple, but has hardware limits
- **Horizontal (Scale Out):** Add more servers
  - No hardware limits, fault tolerant, but more complex

#### Load Balancing
- Distribute traffic evenly
- Health checks (detect failed servers)
- Routing algorithms: Round Robin, Weighted, Least Connections, IP Hash
- Layer 4 (faster) vs Layer 7 (more flexible)

#### Caching Strategies
- **Write-Through:** Update cache + DB (consistent, slower writes)
- **Write-Back:** Update cache, async DB (fast, risk of data loss)
- **Write-Around:** Update DB only (cache miss on first read)
- **Cache-Aside:** Check cache, query DB on miss (most common)

#### Consistent Hashing
- Use when servers change frequently
- Minimizes data reshuffling
- Supports replication with virtual nodes

### 7. CAP Theorem & PACELC

**CAP Theorem:** You can only guarantee 2 out of 3:
- **Consistency** - All nodes see same data
- **Availability** - System remains operational
- **Partition Tolerance** - System continues despite network failures

**Reality:** In distributed systems, P is mandatory. Choose between C and A.

**PACELC Extension:**
- If PARTITION: Choose Availability or Consistency
- ELSE: Choose Latency or Consistency

### 8. Security Best Practices

#### Authentication
- Bearer tokens (JWT)
- OAuth 2.0 + JWT
- Access + Refresh tokens
- Single Sign-On (SSO)

#### Authorization
- Role-Based Access Control (RBAC)
- Attribute-Based Access Control (ABAC)
- Access Control Lists (ACL)

#### API Security Techniques
- Rate limiting
- CORS configuration
- SQL/NoSQL injection prevention
- Firewalls (WAF)
- CSRF protection
- XSS prevention

### 9. UI/UX Design Principles

#### Psychology Laws to Apply

**Fitt's Law:**
- Minimum touch target: 44x44px (mobile), 32x32px (desktop)
- Primary CTAs larger than secondary actions
- Place related actions close together

**Hick's Law:**
- Limit navigation items to 5-7 maximum
- Break complex forms into multi-step wizards
- Use progressive disclosure

**Miller's Law:**
- Group content into chunks of 7±2 items
- Use visual separators between groups

**Jakob's Law:**
- Follow platform conventions
- Place navigation where users expect
- Use familiar icons

**Doherty Threshold:**
- Target <400ms for all interactions
- Show loading states immediately
- Use skeleton screens, not spinners

### 10. Interview Mastery Framework

#### 5-Step Interview Process (45-60 min)
1. **Gather Requirements** (3-5 min) - Ask clarifying questions
2. **Estimate Scale** (5-7 min) - Calculate users, TPS, storage
3. **Design Goals** (3-5 min) - Define trade-offs
4. **Single Server Design** (15-20 min) - Schema, APIs, logic
5. **Scale & Optimize** (15-20 min) - Identify bottlenecks, solutions

#### Golden Rules for Interviews

**DO:**
- Use diagrams - Visualize everything
- Start with RDBMS - NoSQL needs justification
- Ask clarifying questions
- State assumptions
- Discuss trade-offs
- Think out loud
- Iterate

**DON'T:**
- Jump to NoSQL without justification
- Say "use Redis" without knowing WHY and HOW
- Over-engineer (YAGNI)
- Skip requirements
- Forget scale estimates
- Ignore failure scenarios

## Quick Reference

### Database Selection
- **PostgreSQL:** Structured data, ACID needed, complex queries
- **MongoDB:** Unstructured, massive scale, low latency
- **Redis:** Caching, sessions, rate limiting

### When to Use What
- **Caching:** Read-heavy, same data accessed often
- **Sharding:** Data too large for single machine
- **Replication:** High availability, read scaling
- **Load Balancer:** Multiple servers, fault tolerance
- **Message Queue:** Async processing, decouple services
- **CDN:** Static content, global users

## Implementation Checklist

When designing a system, ensure you:

- [ ] Gathered all requirements (functional + non-functional)
- [ ] Estimated scale (users, TPS, storage)
- [ ] Defined design goals and trade-offs
- [ ] Started with single server design (RDBMS first)
- [ ] Identified bottlenecks and scaling strategies
- [ ] Applied appropriate design principles (KISS, DRY, etc.)
- [ ] Followed the 23 coding standards
- [ ] Considered security (auth, rate limiting, injection prevention)
- [ ] Designed for failure (redundancy, health checks)
- [ ] Documented decisions and trade-offs

## Reference Material

For detailed information, refer to:
- `SYSTEM_DESIGN_MASTER_GUIDE.md` - Complete guide with examples, code samples, and detailed explanations
- Database connection examples (PostgreSQL, MySQL, MongoDB, Redis)
- API design patterns and examples
- Scaling strategies with diagrams
- Security implementation examples
- UI/UX design tokens and components

## Examples

### Example 1: URL Shortener Design

**Requirements:**
- 1 million DAU
- 90% read, 10% write
- Low latency (< 100ms)

**Design:**
- Start with PostgreSQL (RDBMS)
- Use Base62 encoding for short codes (6 chars = 56 billion combinations)
- Pre-generate code pools per server
- Cache hot URLs in Redis
- Use read replicas for scaling reads
- Load balancer for multiple app servers

### Example 2: Search Typeahead

**Requirements:**
- Top 5 suggestions
- Sorted by popularity
- Low latency (< 100ms)

**Design:**
- Trie data structure
- Pre-compute top 5 at each node (O(1) query)
- Batch updates (accumulate in HashMap, bulk update)
- Consistent hashing by prefix for sharding
- Client-side debouncing (300ms)

## Notes

- Always start simple and scale as needed
- Requirements dictate design - gather them thoroughly
- Trade-offs are inevitable - document them clearly
- Think about failure scenarios - what if X goes down?
- Use diagrams to visualize architecture
- Estimate numbers early - they guide decisions
