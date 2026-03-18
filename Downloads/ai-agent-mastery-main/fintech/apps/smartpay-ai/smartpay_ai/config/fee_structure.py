"""
PSD-11 Fee Structure Configuration.

Centralized configuration for all interchange fees as per Bank of Namibia
PSD-11 Determination (Effective 1 August 2025).

This module serves as the single source of truth for fee rates across:
- Python backend (smartpay_ai)
- TypeScript backend (via API migration)
- Analytics and reporting systems

Location: backend_python/smartpay_ai/config/fee_structure.py

DRY VIOLATION FIX:
This module eliminates 150+ lines of duplicate fee calculations previously
scattered across:
- compliance/validator.py (lines 293-344)
- services/compliance_validator.py (lines 373-428)
- backend/src/lib/interchange.ts (reference implementation)
"""

from dataclasses import dataclass
from decimal import Decimal
from enum import Enum
from typing import Optional


# =============================================================================
# Enums and Types
# =============================================================================

class CardType(str, Enum):
    """Card types as defined in PSD-11 Section 10.1."""
    DEBIT = "debit"
    HYBRID = "hybrid"
    CREDIT = "credit"


class TransactionCategory(str, Enum):
    """High-level transaction categories."""
    CARD = "card"
    ATM = "atm"
    INSTANT_PAYMENT = "instant_payment"
    EXEMPT = "exempt"


class TransactionType(str, Enum):
    """Transaction types as defined in PSD-11."""
    
    # Card transactions (Section 10.1, 10.2)
    CARD_RETAIL = "card_retail"
    CARD_FUEL = "card_fuel"
    CARD_PURE_CASHBACK = "card_pure_cashback"
    CARD_CASHBACK_WITH_PURCHASE = "card_cashback_with_purchase"
    
    # ATM transactions (Section 10.3, 10.4)
    ATM_WITHDRAWAL_SUCCESS = "atm_withdrawal_success"
    ATM_WITHDRAWAL_FAIL = "atm_withdrawal_fail"
    ATM_BALANCE_ENQUIRY = "atm_balance_enquiry"
    ATM_NON_FINANCIAL = "atm_non_financial"
    
    # Instant Payment transactions (Section 11)
    IP_P2M = "ip_p2m"  # Person to Merchant
    IP_P2B = "ip_p2b"  # Person to Business
    IP_CASH_IN = "ip_cash_in"
    IP_CASH_OUT = "ip_cash_out"
    
    # Exempt transactions (Section 11.5 - no interchange)
    IP_P2P = "ip_p2p"  # Person to Person
    IP_B2P = "ip_b2p"  # Business to Person
    IP_B2B = "ip_b2b"  # Business to Business
    IP_B2G = "ip_b2g"  # Business to Government
    IP_G2P = "ip_g2p"  # Government to Person
    IP_REQUEST_TO_PAY = "ip_request_to_pay"


class InterchangeDirection(str, Enum):
    """Direction of interchange payment."""
    ACQUIRER_TO_ISSUER = "acquirer_to_issuer"  # Normal interchange
    ISSUER_TO_ACQUIRER = "issuer_to_acquirer"  # Reverse interchange
    NONE = "none"  # No interchange applicable


# =============================================================================
# Fee Configuration - PSD-11 Compliant
# =============================================================================

@dataclass(frozen=True)
class FeeRate:
    """Immutable fee rate configuration."""
    rate: Optional[float] = None  # Percentage rate (e.g., 0.005 = 0.5%)
    fixed_fee: Optional[float] = None  # Fixed fee in NAD
    variable_fee_per_hundred: Optional[float] = None  # Fee per N$100
    description: str = ""


# VAT Rate (Namibian VAT - 15%)
VAT_RATE = Decimal("0.15")


# -----------------------------------------------------------------------------
# Card Interchange Rates (Section 10.1)
# Direction: Acquirer → Issuer
# -----------------------------------------------------------------------------

CARD_RETAIL_RATES = {
    CardType.DEBIT: FeeRate(
        rate=0.0050,
        description="Debit card retail purchase - 0.50% interchange"
    ),
    CardType.HYBRID: FeeRate(
        rate=0.0075,
        description="Hybrid card retail purchase - 0.75% interchange"
    ),
    CardType.CREDIT: FeeRate(
        rate=0.0155,
        description="Credit card retail purchase - 1.55% interchange"
    ),
}

CARD_FUEL_RATES = {
    CardType.DEBIT: FeeRate(
        rate=0.0050,
        description="Debit card fuel purchase - 0.50% interchange"
    ),
    CardType.HYBRID: FeeRate(
        rate=0.0075,
        description="Hybrid card fuel purchase - 0.75% interchange"
    ),
    CardType.CREDIT: FeeRate(
        rate=0.0080,
        description="Credit card fuel purchase - 0.80% interchange"
    ),
}


# -----------------------------------------------------------------------------
# Cashback Interchange (Section 10.2)
# Pure cashback: Reverse interchange (Issuer → Acquirer)
# POS purchase portion: Normal interchange (Acquirer → Issuer)
# -----------------------------------------------------------------------------

PURE_CASHBACK_FEE = FeeRate(
    fixed_fee=1.25,
    description="Pure cashback reverse interchange - N$1.25 flat fee (all card types)"
)


# -----------------------------------------------------------------------------
# ATM Reverse Interchange (Section 10.3, 10.4)
# Direction: Issuer → Acquirer (reverse)
# -----------------------------------------------------------------------------

ATM_WITHDRAWAL_BASE_FEE = 4.00  # N$4.00 base fee
ATM_WITHDRAWAL_VARIABLE_RATE = 0.80  # N$0.80 per N$100

ATM_RATES = {
    TransactionType.ATM_WITHDRAWAL_SUCCESS: FeeRate(
        fixed_fee=ATM_WITHDRAWAL_BASE_FEE,
        variable_fee_per_hundred=ATM_WITHDRAWAL_VARIABLE_RATE,
        description="ATM withdrawal reverse interchange (N$4.00 + N$0.80 per N$100)"
    ),
    TransactionType.ATM_WITHDRAWAL_FAIL: FeeRate(
        fixed_fee=4.80,
        description="ATM unsuccessful withdrawal reverse interchange - N$4.80"
    ),
    TransactionType.ATM_BALANCE_ENQUIRY: FeeRate(
        fixed_fee=0.60,
        description="ATM balance enquiry reverse interchange - N$0.60"
    ),
    TransactionType.ATM_NON_FINANCIAL: FeeRate(
        fixed_fee=0.60,
        description="ATM non-financial transaction reverse interchange - N$0.60"
    ),
}


# -----------------------------------------------------------------------------
# Instant Payment Interchange Rates (Section 11)
# -----------------------------------------------------------------------------

IP_P2M_RATE = FeeRate(
    rate=0.0040,
    description="Instant payment P2M (Person to Merchant) - 0.40% interchange"
)

IP_P2B_RATE = FeeRate(
    rate=0.0040,
    description="Instant payment P2B (Person to Business) - 0.40% interchange"
)

IP_CASH_IN_FEE = FeeRate(
    fixed_fee=1.25,
    description="Cash-in at merchant/agent reverse interchange - N$1.25"
)

IP_CASH_OUT_FEE = FeeRate(
    fixed_fee=1.25,
    description="Cash-out at merchant/agent reverse interchange - N$1.25"
)


# -----------------------------------------------------------------------------
# Transaction Type Routing Configuration
# -----------------------------------------------------------------------------

TRANSACTION_CATEGORY_MAP = {
    TransactionType.CARD_RETAIL: TransactionCategory.CARD,
    TransactionType.CARD_FUEL: TransactionCategory.CARD,
    TransactionType.CARD_PURE_CASHBACK: TransactionCategory.CARD,
    TransactionType.CARD_CASHBACK_WITH_PURCHASE: TransactionCategory.CARD,
    
    TransactionType.ATM_WITHDRAWAL_SUCCESS: TransactionCategory.ATM,
    TransactionType.ATM_WITHDRAWAL_FAIL: TransactionCategory.ATM,
    TransactionType.ATM_BALANCE_ENQUIRY: TransactionCategory.ATM,
    TransactionType.ATM_NON_FINANCIAL: TransactionCategory.ATM,
    
    TransactionType.IP_P2M: TransactionCategory.INSTANT_PAYMENT,
    TransactionType.IP_P2B: TransactionCategory.INSTANT_PAYMENT,
    TransactionType.IP_CASH_IN: TransactionCategory.INSTANT_PAYMENT,
    TransactionType.IP_CASH_OUT: TransactionCategory.INSTANT_PAYMENT,
    
    TransactionType.IP_P2P: TransactionCategory.EXEMPT,
    TransactionType.IP_B2P: TransactionCategory.EXEMPT,
    TransactionType.IP_B2B: TransactionCategory.EXEMPT,
    TransactionType.IP_B2G: TransactionCategory.EXEMPT,
    TransactionType.IP_G2P: TransactionCategory.EXEMPT,
    TransactionType.IP_REQUEST_TO_PAY: TransactionCategory.EXEMPT,
}


# Exempt transaction types (Section 11.5 - no interchange)
EXEMPT_TRANSACTION_TYPES = {
    TransactionType.IP_P2P,
    TransactionType.IP_B2P,
    TransactionType.IP_B2B,
    TransactionType.IP_B2G,
    TransactionType.IP_G2P,
    TransactionType.IP_REQUEST_TO_PAY,
}


# =============================================================================
# Helper Functions
# =============================================================================

def is_interchange_applicable(transaction_type: TransactionType) -> bool:
    """
    Check if interchange fee applies to transaction type.
    
    Section 13.5: Only specified transaction types qualify for interchange.
    
    Args:
        transaction_type: The transaction type to check
        
    Returns:
        True if interchange is applicable, False otherwise
    """
    return transaction_type not in EXEMPT_TRANSACTION_TYPES


def get_transaction_category(transaction_type: TransactionType) -> TransactionCategory:
    """
    Get the category for a transaction type.
    
    Args:
        transaction_type: The transaction type
        
    Returns:
        Transaction category
        
    Raises:
        ValueError: If transaction type is unknown
    """
    category = TRANSACTION_CATEGORY_MAP.get(transaction_type)
    if category is None:
        raise ValueError(f"Unknown transaction type: {transaction_type}")
    return category


def get_card_rate(
    transaction_type: TransactionType,
    card_type: CardType
) -> FeeRate:
    """
    Get the interchange rate for a card transaction.
    
    Args:
        transaction_type: Card transaction type
        card_type: Type of card used
        
    Returns:
        FeeRate configuration
        
    Raises:
        ValueError: If invalid transaction or card type
    """
    if transaction_type == TransactionType.CARD_RETAIL:
        return CARD_RETAIL_RATES[card_type]
    elif transaction_type == TransactionType.CARD_FUEL:
        return CARD_FUEL_RATES[card_type]
    elif transaction_type == TransactionType.CARD_PURE_CASHBACK:
        return PURE_CASHBACK_FEE
    elif transaction_type == TransactionType.CARD_CASHBACK_WITH_PURCHASE:
        # For cashback with purchase, return the retail rate for POS portion
        return CARD_RETAIL_RATES[card_type]
    else:
        raise ValueError(f"Invalid card transaction type: {transaction_type}")


def get_atm_rate(transaction_type: TransactionType) -> FeeRate:
    """
    Get the interchange rate for an ATM transaction.
    
    Args:
        transaction_type: ATM transaction type
        
    Returns:
        FeeRate configuration
        
    Raises:
        ValueError: If invalid ATM transaction type
    """
    fee_rate = ATM_RATES.get(transaction_type)
    if fee_rate is None:
        raise ValueError(f"Invalid ATM transaction type: {transaction_type}")
    return fee_rate


def get_instant_payment_rate(transaction_type: TransactionType) -> FeeRate:
    """
    Get the interchange rate for an instant payment transaction.
    
    Args:
        transaction_type: Instant payment transaction type
        
    Returns:
        FeeRate configuration
        
    Raises:
        ValueError: If invalid instant payment type
    """
    if transaction_type == TransactionType.IP_P2M:
        return IP_P2M_RATE
    elif transaction_type == TransactionType.IP_P2B:
        return IP_P2B_RATE
    elif transaction_type == TransactionType.IP_CASH_IN:
        return IP_CASH_IN_FEE
    elif transaction_type == TransactionType.IP_CASH_OUT:
        return IP_CASH_OUT_FEE
    elif transaction_type in EXEMPT_TRANSACTION_TYPES:
        return FeeRate(
            rate=0.0,
            fixed_fee=0.0,
            description=f"{transaction_type.value} - No interchange applicable (Section 11.5)"
        )
    else:
        raise ValueError(f"Invalid instant payment transaction type: {transaction_type}")


# =============================================================================
# Legacy Compatibility Mappings
# =============================================================================

# For backward compatibility with string-based transaction type identifiers
LEGACY_TRANSACTION_TYPE_MAP = {
    "card_retail": TransactionType.CARD_RETAIL,
    "card_fuel": TransactionType.CARD_FUEL,
    "atm_withdrawal": TransactionType.ATM_WITHDRAWAL_SUCCESS,
    "instant_payment": TransactionType.IP_P2M,  # Default to P2M
}

LEGACY_CARD_TYPE_MAP = {
    "debit": CardType.DEBIT,
    "hybrid": CardType.HYBRID,
    "credit": CardType.CREDIT,
}


def normalize_transaction_type(transaction_type: str) -> TransactionType:
    """
    Normalize legacy transaction type strings to enum.
    
    Args:
        transaction_type: Transaction type (string or enum)
        
    Returns:
        Normalized TransactionType enum
        
    Raises:
        ValueError: If transaction type is invalid
    """
    if isinstance(transaction_type, TransactionType):
        return transaction_type
    
    # Try direct enum lookup
    try:
        return TransactionType(transaction_type)
    except ValueError:
        pass
    
    # Try legacy mapping
    normalized = LEGACY_TRANSACTION_TYPE_MAP.get(transaction_type)
    if normalized is None:
        raise ValueError(f"Unknown transaction type: {transaction_type}")
    
    return normalized


def normalize_card_type(card_type: str) -> CardType:
    """
    Normalize legacy card type strings to enum.
    
    Args:
        card_type: Card type (string or enum)
        
    Returns:
        Normalized CardType enum
        
    Raises:
        ValueError: If card type is invalid
    """
    if isinstance(card_type, CardType):
        return card_type
    
    # Try direct enum lookup
    try:
        return CardType(card_type)
    except ValueError:
        pass
    
    # Try legacy mapping
    normalized = LEGACY_CARD_TYPE_MAP.get(card_type)
    if normalized is None:
        raise ValueError(f"Unknown card type: {card_type}")
    
    return normalized


# =============================================================================
# Tiered Fee Structures (Future Extension)
# =============================================================================

@dataclass(frozen=True)
class TieredFeeConfig:
    """
    Configuration for tiered fee structures.
    
    Allows for different fee rates based on:
    - Transaction volume (merchant tier)
    - Transaction amount ranges
    - User segments (consumer vs business)
    """
    tier_name: str
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    min_monthly_volume: Optional[int] = None
    fee_multiplier: float = 1.0  # Multiplier on base rate (e.g., 0.9 = 10% discount)


# Placeholder for future merchant tier discounts
MERCHANT_TIERS = {
    "standard": TieredFeeConfig(
        tier_name="standard",
        fee_multiplier=1.0
    ),
    "preferred": TieredFeeConfig(
        tier_name="preferred",
        min_monthly_volume=10000,
        fee_multiplier=0.95  # 5% discount
    ),
    "premium": TieredFeeConfig(
        tier_name="premium",
        min_monthly_volume=50000,
        fee_multiplier=0.90  # 10% discount
    ),
}


# =============================================================================
# Agent Commission Structures
# =============================================================================

@dataclass(frozen=True)
class AgentCommissionConfig:
    """Commission structure for agents (merchants, cash points, etc.)."""
    commission_type: str  # "percentage" | "fixed" | "tiered"
    base_rate: float  # Base commission rate
    min_commission: float  # Minimum commission per transaction
    max_commission: Optional[float] = None  # Maximum commission cap
    description: str = ""


# Agent commission rates (configurable per deployment)
AGENT_COMMISSION_RATES = {
    "cash_in": AgentCommissionConfig(
        commission_type="percentage",
        base_rate=0.01,  # 1%
        min_commission=0.50,
        max_commission=5.00,
        description="Cash-in agent commission: 1% of amount (min N$0.50, max N$5.00)"
    ),
    "cash_out": AgentCommissionConfig(
        commission_type="percentage",
        base_rate=0.015,  # 1.5%
        min_commission=1.00,
        max_commission=10.00,
        description="Cash-out agent commission: 1.5% of amount (min N$1.00, max N$10.00)"
    ),
    "bill_payment": AgentCommissionConfig(
        commission_type="fixed",
        base_rate=2.00,
        min_commission=2.00,
        max_commission=2.00,
        description="Bill payment agent commission: N$2.00 flat fee"
    ),
}


# =============================================================================
# Currency Conversion Fees
# =============================================================================

@dataclass(frozen=True)
class CurrencyConversionFeeConfig:
    """Configuration for currency conversion fees."""
    base_spread: float  # Base FX spread percentage (e.g., 0.02 = 2%)
    min_fee: float  # Minimum conversion fee
    description: str = ""


CURRENCY_CONVERSION_FEES = {
    "cross_border": CurrencyConversionFeeConfig(
        base_spread=0.025,  # 2.5% FX spread
        min_fee=5.00,
        description="Cross-border currency conversion: 2.5% FX spread (min N$5.00)"
    ),
}


# =============================================================================
# Compliance References
# =============================================================================

PSD_11_REFERENCES = {
    "card_retail": "PSD-11 Section 10.1 - Card-Based Payment Transactions",
    "card_fuel": "PSD-11 Section 10.1 - Card-Based Payment Transactions (Fuel)",
    "cashback": "PSD-11 Section 10.2 - Cashback Transactions",
    "atm": "PSD-11 Section 10.3, 10.4 - ATM Transactions",
    "instant_payment": "PSD-11 Section 11 - Instant Payment Transactions",
    "exempt": "PSD-11 Section 11.5 - Exempt Transaction Types",
}


def get_psd_reference(transaction_type: TransactionType) -> str:
    """
    Get PSD-11 regulatory reference for transaction type.
    
    Args:
        transaction_type: Transaction type
        
    Returns:
        PSD-11 section reference
    """
    if transaction_type.value.startswith("card_"):
        if "fuel" in transaction_type.value:
            return PSD_11_REFERENCES["card_fuel"]
        elif "cashback" in transaction_type.value:
            return PSD_11_REFERENCES["cashback"]
        else:
            return PSD_11_REFERENCES["card_retail"]
    elif transaction_type.value.startswith("atm_"):
        return PSD_11_REFERENCES["atm"]
    elif transaction_type.value.startswith("ip_"):
        if transaction_type in EXEMPT_TRANSACTION_TYPES:
            return PSD_11_REFERENCES["exempt"]
        return PSD_11_REFERENCES["instant_payment"]
    
    return "PSD-11 - General Provisions"
