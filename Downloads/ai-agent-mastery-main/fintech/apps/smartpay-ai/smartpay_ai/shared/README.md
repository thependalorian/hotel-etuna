# Shared Modules

Centralized utilities and compliance logic for SmartPay AI backend.

## Overview

This directory contains shared modules that eliminate code duplication across the codebase:

### Modules
- **validators.py**: Compliance validation logic (PSD-1 through PSD-13, FIA)
- **fee_calculator.py**: PSD-11 interchange fee calculations (NEW - DRY Fix #6)
- **jwt_validator.py**: JWT token validation and user context
- **rate_limiter.py**: Token bucket rate limiting

**Result**: Single source of truth for all shared business logic.

## Features

### Fee Calculator Module (NEW - DRY Fix #6)

Complete PSD-11 interchange fee calculation engine.

**Usage**:
```python
from smartpay_ai.shared.fee_calculator import FeeCalculator, InterchangeInput

calculator = FeeCalculator()

# Calculate interchange for debit card purchase
result = calculator.calculate_interchange(InterchangeInput(
    transaction_type="card_retail",
    card_type="debit",
    amount=100.00
))

print(f"Interchange: N${result.interchange_amount:.2f}")  # N$0.50
print(f"VAT: N${result.vat_amount:.2f}")  # N$0.07
print(f"Total: N${result.total_interchange:.2f}")  # N$0.57
print(f"Reference: {result.psd_reference}")  # PSD-11 Section 10.1
```

**Key Features**:
- All PSD-11 transaction types (card, ATM, instant payment)
- Complex transaction handling (cashback with purchase)
- Batch processing for settlement
- VAT calculation (15%)
- Type-safe enums
- Legacy compatibility layer

**Documentation**: See [FEE_CALCULATION_MIGRATION.md](../FEE_CALCULATION_MIGRATION.md)

### Pure Validation Functions
Fast, dependency-free validation functions for performance-critical paths:

```python
from smartpay_ai.shared.validators import (
    validate_emoney_limits,
    calculate_interchange_fee,
    check_fia_thresholds,
)

# No API calls, instant validation
is_valid, error, remaining = validate_emoney_limits(
    user_tier="basic",
    amount=500.0,
    daily_spent=2000.0,
    monthly_spent=10000.0
)

# No API calls, instant fee calculation
fees = calculate_interchange_fee(
    transaction_type="card_retail",
    amount=1000.0,
    card_type="debit"
)
```

### Unified Validator Class
Complete validator with HTTP API + optional database fallback:

```python
from smartpay_ai.shared.validators import SharedComplianceValidator

# HTTP-only mode
validator = SharedComplianceValidator(
    node_backend_url="http://localhost:4000",
    enable_db_fallback=False
)

# Full mode with database fallback
validator = SharedComplianceValidator(
    node_backend_url="http://localhost:4000",
    db_connection_string="postgresql://...",
    enable_db_fallback=True
)
await validator.initialize()

# Use validator
result = await validator.validate_transaction_limits(
    user_id="user123",
    amount=5000.0
)
```

## Compliance Coverage

### PSD Regulations
- **PSD-1**: Transaction limit validation (single, daily, monthly)
- **PSD-3**: E-Money transaction compliance
- **PSD-6**: Violation logging and reporting deadlines
- **PSD-11**: Interchange fee calculation (cards, ATM, instant payments)
- **PSD-12**: Dynamic fraud thresholds
- **PSD-13**: Security alert management

### FIA Compliance
- **FIA 2012**: Suspicious Transaction Report (STR) threshold checking
- **FIA 2012**: Cash Transaction Report (CTR) threshold checking
- Security alert logging with risk assessment

## API Reference

### Pure Functions

#### `validate_emoney_limits(user_tier, amount, daily_spent, monthly_spent)`
Validates PSD-1/PSD-3 transaction limits without external dependencies.

**Parameters**:
- `user_tier` (str): "basic" | "standard" | "premium"
- `amount` (float): Transaction amount in N$
- `daily_spent` (float): Already spent today in N$
- `monthly_spent` (float): Already spent this month in N$

**Returns**: `(is_valid, error_message, remaining_limits)`

**Example**:
```python
is_valid, error, remaining = validate_emoney_limits(
    user_tier="basic",
    amount=500.0,
    daily_spent=2000.0,
    monthly_spent=10000.0
)

if is_valid:
    print(f"✓ Remaining daily: N${remaining['daily']:.2f}")
else:
    print(f"✗ Rejected: {error}")
```

#### `calculate_interchange_fee(transaction_type, amount, card_type)`
Calculates PSD-11 compliant interchange fees.

**Parameters**:
- `transaction_type` (str): "card_retail" | "atm_withdrawal" | "instant_payment"
- `amount` (float): Transaction amount in N$
- `card_type` (Optional[str]): "debit" | "hybrid" | "credit" (for card transactions)

**Returns**: Dict with fee breakdown

**Example**:
```python
fees = calculate_interchange_fee(
    transaction_type="card_retail",
    amount=1000.0,
    card_type="debit"
)

print(f"Total fee: N${fees['total_fee']:.2f}")
print(f"Breakdown: {fees['calculation_breakdown']}")
# Output:
# Total fee: N$5.75
# Breakdown: N$1000.00 × 0.5% = N$5.00 + VAT N$0.75
```

#### `check_fia_thresholds(amount)`
Checks if transaction meets FIA reporting requirements.

**Parameters**:
- `amount` (float): Transaction amount in N$

**Returns**: `{"str_required": bool, "ctr_required": bool}`

**Example**:
```python
thresholds = check_fia_thresholds(25000.0)
if thresholds["str_required"]:
    # Trigger STR workflow
    log_suspicious_transaction(transaction)
```

#### `calculate_reporting_deadline(severity)`
Calculates PSD-6 violation reporting deadline.

**Parameters**:
- `severity` (str): "critical" | "serious" | "moderate" | "minor"

**Returns**: `datetime` object

**Example**:
```python
deadline = calculate_reporting_deadline("critical")
print(f"Report by: {deadline.isoformat()}")
# Output: Report by: 2026-03-18T14:00:00
```

#### `assess_risk_level(risk_score)`
Converts ML fraud score to risk level.

**Parameters**:
- `risk_score` (float): ML probability (0.0 to 1.0)

**Returns**: "low" | "medium" | "high" | "critical"

**Example**:
```python
risk_level = assess_risk_level(0.85)
print(f"Risk: {risk_level}")  # Output: Risk: high
```

### SharedComplianceValidator Class

#### `__init__(node_backend_url, db_connection_string, timeout, enable_db_fallback)`
Initialize validator with optional database fallback.

**Parameters**:
- `node_backend_url` (Optional[str]): Node.js backend URL (default: env var or localhost:4000)
- `db_connection_string` (Optional[str]): PostgreSQL connection string (default: env var)
- `timeout` (float): HTTP timeout in seconds (default: 5.0)
- `enable_db_fallback` (bool): Enable database fallback mode (default: True)

#### `async initialize()`
Initialize database connection pool (if enabled).

#### `async validate_transaction_limits(...)`
Validate PSD-1 transaction limits with API + fallback.

#### `async estimate_interchange_fee(...)`
Estimate PSD-11 fees with API + fallback.

#### `async log_compliance_violation(...)`
Log PSD-6 violation with API + database fallback.

#### `async log_security_alert(...)`
Log FIA security alert with API + comprehensive database fallback.

#### `check_fia_threshold(amount)`
Helper method wrapping `check_fia_thresholds()`.

#### `get_fallback_stats()`
Get monitoring statistics for fallback usage.

**Returns**:
```python
{
    "total_api_calls": int,
    "fallback_count": int,
    "fallback_rate": float,  # Percentage
    "db_pool_active": bool,
    "db_fallback_enabled": bool,
}
```

## Constants

### Transaction Limits
```python
from smartpay_ai.shared.validators import EMONEY_LIMITS, KYCTier

# Access limits for specific tier
basic_limits = EMONEY_LIMITS[KYCTier.BASIC]
print(f"Basic single tx limit: N${basic_limits['max_single_transaction']}")
```

### FIA Thresholds
```python
from smartpay_ai.shared.validators import FIA_STR_THRESHOLD, FIA_CTR_THRESHOLD

print(f"STR threshold: N${FIA_STR_THRESHOLD}")  # N$20,000
print(f"CTR threshold: N${FIA_CTR_THRESHOLD}")  # N$50,000
```

### Interchange Rates
```python
from smartpay_ai.shared.validators import INTERCHANGE_RATES

print(f"Debit card rate: {INTERCHANGE_RATES['debit'] * 100}%")  # 0.5%
print(f"Credit card rate: {INTERCHANGE_RATES['credit'] * 100}%")  # 1.55%
```

## Migration Guide

See [MIGRATION_GUIDE_VALIDATORS.md](../../../MIGRATION_GUIDE_VALIDATORS.md) for detailed migration instructions.

### Quick Migration

**Old**:
```python
from smartpay_ai.compliance.validator import ComplianceValidator
```

**New**:
```python
from smartpay_ai.shared.validators import SharedComplianceValidator
```

**Backward Compatible** (recommended for gradual migration):
```python
# Update compliance/validator.py
from smartpay_ai.shared.validators import SharedComplianceValidator as ComplianceValidator
```

## Testing

Run unit tests:
```bash
pytest tests/test_shared_validators_example.py -v
```

Run specific test class:
```bash
pytest tests/test_shared_validators_example.py::TestValidateEmoneyLimits -v
```

## Performance

### Pure Functions vs API Calls

| Operation | Pure Function | API Call |
|-----------|--------------|----------|
| Limit validation | ~0.01ms | ~50-100ms |
| Fee calculation | ~0.01ms | ~50-100ms |
| Threshold check | ~0.001ms | ~50-100ms |

**Recommendation**: Use pure functions for:
- High-frequency validation (e.g., transaction pre-checks)
- Performance-critical paths
- Unit testing
- Offline validation

Use validator class for:
- Operations requiring database state
- Audit trail requirements
- Complex workflows

## Monitoring

Monitor fallback usage in production:

```python
validator = SharedComplianceValidator()
await validator.initialize()

# ... use validator ...

stats = validator.get_fallback_stats()
logger.info(f"Fallback rate: {stats['fallback_rate']:.1f}%")

if stats['fallback_rate'] > 10:
    logger.warning("High fallback rate - check Node.js backend health")
```

## Architecture

```
shared/
├── fee_calculator.py (NEW - DRY Fix #6)
│   ├── FeeCalculator
│   │   ├── calculate_interchange()
│   │   ├── calculate_complex_interchange()
│   │   ├── calculate_batch_interchange()
│   │   ├── get_rate_info()
│   │   └── validate_interchange_applicable()
│   ├── LegacyFeeCalculator (backward compatibility)
│   ├── InterchangeInput, InterchangeResult
│   ├── ComplexInterchangeInput, ComplexInterchangeResult
│   └── BatchTransaction, BatchInterchangeResult
│
├── validators.py
│   ├── Constants & Enums
│   │   ├── KYCTier, ViolationSeverity, RiskLevel
│   │   ├── EMONEY_LIMITS
│   │   ├── FIA_STR_THRESHOLD, FIA_CTR_THRESHOLD
│   │   └── REPORTING_DEADLINES
│   │
│   ├── Pure Functions (no dependencies)
│   │   ├── validate_emoney_limits()
│   │   ├── estimate_interchange_fee_local() → delegates to fee_calculator
│   │   ├── check_fia_thresholds()
│   │   ├── calculate_reporting_deadline()
│   │   └── assess_risk_level()
│   │
│   └── SharedComplianceValidator (HTTP + optional DB)
│       ├── validate_transaction_limits()
│       ├── estimate_interchange_fee()
│       ├── log_compliance_violation()
│       ├── log_security_alert()
│       └── get_fallback_stats()
│
├── jwt_validator.py
│   └── JWT token validation
│
└── rate_limiter.py
    └── Token bucket rate limiting
```

## Benefits

1. **DRY Principle**: Single source of truth for compliance logic
2. **Performance**: Pure functions for high-speed validation
3. **Reliability**: Automatic fallback when API unavailable
4. **Maintainability**: Update validation rules in one place
5. **Testability**: Pure functions easy to unit test
6. **Monitoring**: Built-in fallback statistics
7. **Backward Compatible**: Zero breaking changes

## Related Documentation

### Validators Module
- **Analysis**: [ANALYSIS_SUMMARY.md](./ANALYSIS_SUMMARY.md)
- **Migration**: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- **Tests**: [tests/test_shared_validators_example.py](../tests/test_shared_validators_example.py)

### Fee Calculator Module (NEW)
- **Migration Guide**: [FEE_CALCULATION_MIGRATION.md](../FEE_CALCULATION_MIGRATION.md)
- **Completion Summary**: [config/DRY_VIOLATION_6_COMPLETE.md](../config/DRY_VIOLATION_6_COMPLETE.md)
- **Tests**: [tests/test_fee_calculator.py](../tests/test_fee_calculator.py)
- **Configuration**: [config/fee_structure.py](../config/fee_structure.py)

## Support

For questions or issues:
1. Review this README
2. Check migration guide
3. Review inline documentation in `validators.py`
4. Contact backend team
