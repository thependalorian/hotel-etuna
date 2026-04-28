---
name: system-design-principles
description: This skill should be used when making architectural decisions, refactoring code, or evaluating design trade-offs. It provides guidance on core software design principles including KISS, DRY, Boy Scout Rule, avoiding over-engineering, and shipping stable code.
---

# System Design Principles

This skill provides guidance on core software design principles that guide decisions from high-level architecture to small refactors, helping balance speed, stability, and long-term maintainability.

## When to Use This Skill

Use this skill when:
- Making architectural decisions
- Refactoring existing code
- Evaluating design trade-offs
- Deciding whether to abstract or duplicate code
- Planning new features or systems
- Reviewing code for maintainability

## Core Principles

### 1. KISS (Keep It Simple, Stupid)

**Core Idea:** Designs and systems should be as simple as possible. Avoid unnecessary complexity.

**Common Pitfalls:**
- Over-engineering
- Premature optimization
- Clever but unreadable code

**Example:**
```python
# ❌ Over-complicated
def calculate_total(items):
    return reduce(lambda acc, item: acc + (item.price * (1 - item.discount if item.discount else 0)), items, 0)

# ✅ Simple and clear
def calculate_total(items):
    total = 0
    for item in items:
        price = item.price
        if item.discount:
            price = price * (1 - item.discount)
        total += price
    return total
```

**When to Apply:**
- Code is hard to understand
- Premature optimization detected
- Unnecessary abstractions exist

### 2. DRY (Don't Repeat Yourself) - But Be Strategic

**Core Idea:** "Every piece of knowledge must have a single, unambiguous, authoritative representation within a system."

**Common Pitfalls:**
- Abstracting coincidental duplication
- Creating overly coupled "monster" modules
- Wrong abstraction

**When DRY is Appropriate:**
- ✅ Same business rule/logic appears 3+ times
- ✅ Changes happen for the same reason
- ✅ Single source of truth needed

**When to Keep Duplicate:**
- ✅ Code looks similar but represents different concepts
- ✅ Future changes likely to diverge
- ✅ Abstraction would create tight coupling

**Example of Wrong Abstraction:**
```python
# ❌ Wrong: Forcing different concepts into one abstraction
class DataProcessor:
    def process(self, data_type, data):
        if data_type == "user":
            # User-specific logic
        elif data_type == "order":
            # Order-specific logic
        elif data_type == "payment":
            # Payment-specific logic
        # This becomes a monster class!

# ✅ Better: Accept some duplication
class UserProcessor:
    def process(self, user_data): ...

class OrderProcessor:
    def process(self, order_data): ...

class PaymentProcessor:
    def process(self, payment_data): ...
```

**Rule of Three:** Abstract on the third repetition, not the second.

### 3. Boy Scout Rule

**Core Idea:** "Leave the code cleaner than you found it."

**Common Pitfalls:**
- Letting mess accumulation create overwhelming technical debt
- Thinking cleanup requires a dedicated "refactoring sprint"

**How to Apply:**
- Make small, positive improvements to any code you touch
- Clean up nearby messes as you add features
- Prevent decay through continuous small improvements

**Example:**
```python
# You're fixing a bug in this function...
def process_order(order):
    # ... existing code ...
    # While you're here, you notice:
    # - Unclear variable names
    # - Missing error handling
    # - No logging
    
    # ✅ Apply Boy Scout Rule: Leave it better
    def process_order(order):
        try:
            validate_order(order)
            total = calculate_total(order.items)
            apply_discounts(order, total)
            return create_order_record(order, total)
        except ValidationError as e:
            logger.error(f"Order validation failed: {e}")
            raise
```

### 4. Avoid Over-engineering

**Core Idea:** Solve the problem you have today, not every possible future problem.

**Common Pitfalls:**
- Automating non-repeated tasks
- Creating unnecessary abstractions
- Wrapping libraries without clear need
- Building for hypothetical future needs

**Questions to Ask:**
- "What is the simplest thing that could possibly work?"
- "What problem am I actually solving today?"
- "Do I need this abstraction now, or am I guessing?"

**Example:**
```python
# ❌ Over-engineered: Building for hypothetical future
class AbstractDataHandler(ABC):
    @abstractmethod
    def handle(self): pass

class UserDataHandler(AbstractDataHandler):
    def handle(self): ...

class OrderDataHandler(AbstractDataHandler):
    def handle(self): ...

# When you only need:
# ✅ Simple and sufficient
def handle_user_data(user_data):
    # Process user data
    pass

def handle_order_data(order_data):
    # Process order data
    pass
```

### 5. Prefer Duplication Over Wrong Abstraction

**Core Idea:** A little duplication is cheaper than a bad abstraction that couples unrelated concepts.

**When to Apply:**
- Code looks similar but represents different business concepts
- Future changes likely to diverge
- Abstraction would create tight coupling

**Key Question:** "Do these things change for the same reason?"

If NO → Keep them separate, even if they look similar.

### 6. Ship Stable Code

**Core Idea:** Focus on consistency, reliability, and incremental improvement to deliver user value predictably.

**Common Pitfalls:**
- Large, risky changes that cause regressions
- Ignoring bugs and debt until they force a rewrite

**How to Achieve:**
- Simple, understandable foundations
- Consistent small improvements (Boy Scout Rule)
- Focus on delivering reliable value

## Decision Framework

### When to Abstract (DRY):
- ✅ Same business rule/logic appears 3+ times
- ✅ Changes happen for the same reason
- ✅ Single source of truth needed

### When to Keep Duplicate:
- ✅ Code looks similar but represents different concepts
- ✅ Future changes likely to diverge
- ✅ Abstraction would create tight coupling

### When to Simplify (KISS):
- ✅ Code is hard to understand
- ✅ Premature optimization detected
- ✅ Unnecessary abstractions exist

### When to Clean (Boy Scout Rule):
- ✅ You're already modifying the code
- ✅ You notice obvious issues nearby
- ✅ Small improvements won't break existing functionality

## Balancing Principles in Practice

These principles form a complementary system:

1. **Start with KISS:** Build the simplest solution to your current, known problem.
2. **Apply the Boy Scout Rule daily:** As you add features, clean up nearby messes to prevent decay.
3. **Be strategic with DRY:** Only abstract code when you are consolidating a single business rule or concept, not just similar-looking code. Use the "Rule of Three" as a guideline.
4. **Avoid over-engineering by asking:** "What is the simplest thing that could possibly work?" and "What problem am I actually solving today?"
5. **Aim for stable shipments:** This is the outcome of following the above principles—resulting in a codebase that is easier to test, debug, and extend with confidence.

## Integration with Coding Standards

These principles align with coding standards:

| Principle | Coding Rule Connection |
|-----------|----------------------|
| **KISS** | Rule 2: Modular Components - Simple, manageable pieces |
| **Boy Scout Rule** | Rule 9: Maintain Existing Functionality - Leave code better |
| **DRY** | Rule 20: Consistent Styles - Reuse existing components |
| **Avoid Over-engineering** | Rule 18: Step-by-Step Planning - Plan before building |
| **Ship Stable Code** | Rule 4: Vercel Compatibility - Production-ready from start |

## Reference Material

For detailed examples and explanations, refer to:
- `../system-design-master/references/SYSTEM_DESIGN_MASTER_GUIDE.md` - Part 1: Foundations, Software Design Principles section
