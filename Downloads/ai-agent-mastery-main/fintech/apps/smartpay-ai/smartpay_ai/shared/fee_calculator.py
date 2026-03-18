"""
Centralized Fee Calculator - PSD-11 Compliant.

Single source of truth for all interchange fee calculations across Smartpay platform.

This module implements the complete PSD-11 interchange calculation engine,
eliminating 150+ lines of duplicate code previously scattered across:
- compliance/validator.py
- services/compliance_validator.py
- backend/src/lib/interchange.ts (TypeScript reference)

Location: backend_python/smartpay_ai/shared/fee_calculator.py

Usage:
    from smartpay_ai.shared.fee_calculator import FeeCalculator, InterchangeInput
    
    calculator = FeeCalculator()
    result = calculator.calculate_interchange(InterchangeInput(
        transaction_type="card_retail",
        card_type="debit",
        amount=100.00
    ))
    
    print(f"Interchange: N${result.interchange_amount:.2f}")
    print(f"Total with VAT: N${result.total_interchange:.2f}")
"""

import logging
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Dict, Any, List

from smartpay_ai.config.fee_structure import (
    CardType,
    TransactionType,
    TransactionCategory,
    InterchangeDirection,
    VAT_RATE,
    CARD_RETAIL_RATES,
    CARD_FUEL_RATES,
    PURE_CASHBACK_FEE,
    ATM_RATES,
    IP_P2M_RATE,
    IP_P2B_RATE,
    IP_CASH_IN_FEE,
    IP_CASH_OUT_FEE,
    EXEMPT_TRANSACTION_TYPES,
    normalize_transaction_type,
    normalize_card_type,
    get_transaction_category,
    get_card_rate,
    get_atm_rate,
    get_instant_payment_rate,
    get_psd_reference,
)

logger = logging.getLogger(__name__)


# =============================================================================
# Data Models
# =============================================================================

@dataclass
class InterchangeInput:
    """Input for interchange calculation."""
    transaction_type: str  # Transaction type (string or enum)
    amount: float
    card_type: Optional[str] = None  # Required for card transactions
    currency: str = "NAD"  # Default to Namibian Dollar


@dataclass
class InterchangeResult:
    """Result of interchange calculation."""
    interchange_amount: float
    interchange_rate: Optional[float] = None
    fixed_fee: Optional[float] = None
    variable_fee: Optional[float] = None
    vat_amount: float = 0.0
    total_interchange: float = 0.0
    direction: str = InterchangeDirection.NONE.value
    description: str = ""
    psd_reference: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "interchange_amount": round(self.interchange_amount, 2),
            "interchange_rate": self.interchange_rate,
            "fixed_fee": self.fixed_fee,
            "variable_fee": self.variable_fee,
            "vat_amount": round(self.vat_amount, 2),
            "total_interchange": round(self.total_interchange, 2),
            "direction": self.direction,
            "description": self.description,
            "psd_reference": self.psd_reference,
        }


@dataclass
class ComplexInterchangeInput:
    """Input for complex transactions (e.g., cashback with purchase)."""
    purchase_amount: float
    cashback_amount: float
    card_type: str
    is_fuel: bool = False


@dataclass
class ComplexInterchangeResult:
    """Result of complex interchange calculation."""
    purchase_interchange: InterchangeResult
    cashback_interchange: InterchangeResult
    net_interchange: float
    net_vat: float
    net_total: float
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "purchase_interchange": self.purchase_interchange.to_dict(),
            "cashback_interchange": self.cashback_interchange.to_dict(),
            "net_interchange": round(self.net_interchange, 2),
            "net_vat": round(self.net_vat, 2),
            "net_total": round(self.net_total, 2),
        }


@dataclass
class BatchTransaction:
    """Transaction for batch processing."""
    id: str
    transaction_type: str
    amount: float
    card_type: Optional[str] = None
    timestamp: Optional[str] = None


@dataclass
class BatchInterchangeResult:
    """Result of batch interchange calculation."""
    transactions: List[Dict[str, Any]]
    summary: Dict[str, Any]


# =============================================================================
# Fee Calculator Implementation
# =============================================================================

class FeeCalculator:
    """
    Centralized fee calculator for all PSD-11 interchange fees.
    
    Features:
    - Card transaction interchange (retail, fuel, cashback)
    - ATM transaction reverse interchange
    - Instant payment interchange
    - Complex transaction handling (cashback with purchase)
    - Batch calculation for settlement
    - VAT calculation (15% Namibian VAT)
    - PSD-11 compliance validation
    """
    
    def __init__(self):
        """Initialize fee calculator."""
        self.vat_rate = float(VAT_RATE)
    
    def calculate_interchange(self, input_data: InterchangeInput) -> InterchangeResult:
        """
        Calculate interchange fee for a transaction.
        
        Main entry point for all interchange calculations.
        Implements sections 10 and 11 of PSD-11.
        
        Args:
            input_data: Transaction details
            
        Returns:
            InterchangeResult with all fee components
            
        Raises:
            ValueError: If transaction type is invalid or required fields missing
        """
        # Normalize inputs
        try:
            transaction_type = normalize_transaction_type(input_data.transaction_type)
        except ValueError as e:
            logger.error(f"Invalid transaction type: {input_data.transaction_type}")
            raise
        
        # Validate amount
        if input_data.amount < 0:
            raise ValueError("Transaction amount cannot be negative")
        
        # Route to appropriate calculator
        category = get_transaction_category(transaction_type)
        
        if category == TransactionCategory.CARD:
            if not input_data.card_type:
                raise ValueError("Card type is required for card transactions")
            card_type = normalize_card_type(input_data.card_type)
            return self._calculate_card_interchange(
                transaction_type, card_type, input_data.amount
            )
        
        elif category == TransactionCategory.ATM:
            return self._calculate_atm_interchange(transaction_type, input_data.amount)
        
        elif category == TransactionCategory.INSTANT_PAYMENT:
            return self._calculate_instant_payment_interchange(
                transaction_type, input_data.amount
            )
        
        elif category == TransactionCategory.EXEMPT:
            return self._create_exempt_result(transaction_type)
        
        raise ValueError(f"Unknown transaction category: {category}")
    
    def _calculate_card_interchange(
        self,
        transaction_type: TransactionType,
        card_type: CardType,
        amount: float
    ) -> InterchangeResult:
        """
        Calculate interchange for card transactions (Section 10.1, 10.2).
        
        Args:
            transaction_type: Card transaction type
            card_type: Type of card
            amount: Transaction amount
            
        Returns:
            InterchangeResult
        """
        fee_rate = get_card_rate(transaction_type, card_type)
        
        # Pure cashback is a fixed fee (reverse interchange)
        if transaction_type == TransactionType.CARD_PURE_CASHBACK:
            interchange_amount = fee_rate.fixed_fee
            vat_amount = interchange_amount * self.vat_rate
            
            return InterchangeResult(
                interchange_amount=interchange_amount,
                fixed_fee=interchange_amount,
                vat_amount=vat_amount,
                total_interchange=interchange_amount + vat_amount,
                direction=InterchangeDirection.ISSUER_TO_ACQUIRER.value,
                description=f"{fee_rate.description} ({card_type.value})",
                psd_reference=get_psd_reference(transaction_type),
            )
        
        # Cashback with purchase uses retail rate for POS portion
        if transaction_type == TransactionType.CARD_CASHBACK_WITH_PURCHASE:
            rate = fee_rate.rate
            interchange_amount = amount * rate
            vat_amount = interchange_amount * self.vat_rate
            
            return InterchangeResult(
                interchange_amount=interchange_amount,
                interchange_rate=rate,
                vat_amount=vat_amount,
                total_interchange=interchange_amount + vat_amount,
                direction=InterchangeDirection.ACQUIRER_TO_ISSUER.value,
                description=f"Cashback with purchase - POS portion ({card_type.value})",
                psd_reference=get_psd_reference(transaction_type),
            )
        
        # Standard percentage-based interchange
        rate = fee_rate.rate
        interchange_amount = amount * rate
        vat_amount = interchange_amount * self.vat_rate
        
        return InterchangeResult(
            interchange_amount=interchange_amount,
            interchange_rate=rate,
            vat_amount=vat_amount,
            total_interchange=interchange_amount + vat_amount,
            direction=InterchangeDirection.ACQUIRER_TO_ISSUER.value,
            description=fee_rate.description,
            psd_reference=get_psd_reference(transaction_type),
        )
    
    def _calculate_atm_interchange(
        self,
        transaction_type: TransactionType,
        amount: float
    ) -> InterchangeResult:
        """
        Calculate ATM interchange (Section 10.3, 10.4).
        Direction: Issuer → Acquirer (reverse)
        
        Args:
            transaction_type: ATM transaction type
            amount: Transaction amount
            
        Returns:
            InterchangeResult
        """
        fee_rate = get_atm_rate(transaction_type)
        
        # Successful withdrawal has base + variable fee
        if transaction_type == TransactionType.ATM_WITHDRAWAL_SUCCESS:
            base_fee = fee_rate.fixed_fee
            variable_fee = (amount // 100) * fee_rate.variable_fee_per_hundred
            interchange_amount = base_fee + variable_fee
            vat_amount = interchange_amount * self.vat_rate
            
            return InterchangeResult(
                interchange_amount=interchange_amount,
                fixed_fee=base_fee,
                variable_fee=variable_fee,
                vat_amount=vat_amount,
                total_interchange=interchange_amount + vat_amount,
                direction=InterchangeDirection.ISSUER_TO_ACQUIRER.value,
                description=fee_rate.description,
                psd_reference=get_psd_reference(transaction_type),
            )
        
        # Other ATM transactions are fixed fees
        interchange_amount = fee_rate.fixed_fee
        vat_amount = interchange_amount * self.vat_rate
        
        return InterchangeResult(
            interchange_amount=interchange_amount,
            fixed_fee=interchange_amount,
            vat_amount=vat_amount,
            total_interchange=interchange_amount + vat_amount,
            direction=InterchangeDirection.ISSUER_TO_ACQUIRER.value,
            description=fee_rate.description,
            psd_reference=get_psd_reference(transaction_type),
        )
    
    def _calculate_instant_payment_interchange(
        self,
        transaction_type: TransactionType,
        amount: float
    ) -> InterchangeResult:
        """
        Calculate instant payment interchange (Section 11).
        
        Args:
            transaction_type: Instant payment type
            amount: Transaction amount
            
        Returns:
            InterchangeResult
        """
        fee_rate = get_instant_payment_rate(transaction_type)
        
        # P2M and P2B use percentage rates
        if transaction_type in [TransactionType.IP_P2M, TransactionType.IP_P2B]:
            rate = fee_rate.rate
            interchange_amount = amount * rate
            vat_amount = interchange_amount * self.vat_rate
            
            return InterchangeResult(
                interchange_amount=interchange_amount,
                interchange_rate=rate,
                vat_amount=vat_amount,
                total_interchange=interchange_amount + vat_amount,
                direction=InterchangeDirection.ACQUIRER_TO_ISSUER.value,
                description=fee_rate.description,
                psd_reference=get_psd_reference(transaction_type),
            )
        
        # Cash-in and cash-out are fixed fees (reverse)
        elif transaction_type in [TransactionType.IP_CASH_IN, TransactionType.IP_CASH_OUT]:
            interchange_amount = fee_rate.fixed_fee
            vat_amount = interchange_amount * self.vat_rate
            
            return InterchangeResult(
                interchange_amount=interchange_amount,
                fixed_fee=interchange_amount,
                vat_amount=vat_amount,
                total_interchange=interchange_amount + vat_amount,
                direction=InterchangeDirection.ISSUER_TO_ACQUIRER.value,
                description=fee_rate.description,
                psd_reference=get_psd_reference(transaction_type),
            )
        
        # Exempt transactions (no interchange)
        elif transaction_type in EXEMPT_TRANSACTION_TYPES:
            return self._create_exempt_result(transaction_type)
        
        raise ValueError(f"Invalid instant payment transaction type: {transaction_type}")
    
    def _create_exempt_result(self, transaction_type: TransactionType) -> InterchangeResult:
        """Create result for exempt transactions (no interchange)."""
        return InterchangeResult(
            interchange_amount=0.0,
            vat_amount=0.0,
            total_interchange=0.0,
            direction=InterchangeDirection.NONE.value,
            description=f"{transaction_type.value} - No interchange applicable (Section 11.5)",
            psd_reference=get_psd_reference(transaction_type),
        )
    
    def calculate_complex_interchange(
        self,
        input_data: ComplexInterchangeInput
    ) -> ComplexInterchangeResult:
        """
        Calculate interchange for complex transactions (e.g., cashback with purchase).
        
        Example: Cashback with purchase has both:
        - POS purchase portion (Acquirer → Issuer)
        - Cashback portion (Issuer → Acquirer)
        
        Args:
            input_data: Complex transaction details
            
        Returns:
            ComplexInterchangeResult with net interchange
        """
        card_type = normalize_card_type(input_data.card_type)
        
        # Calculate purchase portion (Acquirer → Issuer)
        purchase_tx_type = (
            TransactionType.CARD_FUEL if input_data.is_fuel
            else TransactionType.CARD_RETAIL
        )
        purchase_interchange = self.calculate_interchange(InterchangeInput(
            transaction_type=purchase_tx_type.value,
            card_type=input_data.card_type,
            amount=input_data.purchase_amount
        ))
        
        # Calculate cashback portion (Issuer → Acquirer)
        cashback_interchange = self.calculate_interchange(InterchangeInput(
            transaction_type=TransactionType.CARD_PURE_CASHBACK.value,
            card_type=input_data.card_type,
            amount=input_data.cashback_amount
        ))
        
        # Net interchange (purchase received - cashback paid out by acquirer)
        net_interchange = (
            purchase_interchange.interchange_amount -
            cashback_interchange.interchange_amount
        )
        net_vat = purchase_interchange.vat_amount - cashback_interchange.vat_amount
        
        return ComplexInterchangeResult(
            purchase_interchange=purchase_interchange,
            cashback_interchange=cashback_interchange,
            net_interchange=net_interchange,
            net_vat=net_vat,
            net_total=net_interchange + net_vat,
        )
    
    def calculate_batch_interchange(
        self,
        transactions: List[BatchTransaction]
    ) -> BatchInterchangeResult:
        """
        Calculate interchange for batch of transactions.
        
        Useful for daily settlement and reconciliation.
        
        Args:
            transactions: List of transactions to process
            
        Returns:
            BatchInterchangeResult with summary statistics
        """
        results = []
        summary = {
            "total_transactions": len(transactions),
            "total_interchange_amount": 0.0,
            "total_vat": 0.0,
            "total_with_vat": 0.0,
            "by_type": {},
        }
        
        for tx in transactions:
            try:
                interchange = self.calculate_interchange(InterchangeInput(
                    transaction_type=tx.transaction_type,
                    card_type=tx.card_type,
                    amount=tx.amount
                ))
                
                results.append({
                    "id": tx.id,
                    "interchange": interchange.to_dict(),
                })
                
                # Update summary
                summary["total_interchange_amount"] += interchange.interchange_amount
                summary["total_vat"] += interchange.vat_amount
                summary["total_with_vat"] += interchange.total_interchange
                
                # Track by type
                type_key = interchange.description
                if type_key not in summary["by_type"]:
                    summary["by_type"][type_key] = {
                        "count": 0,
                        "total_amount": 0.0,
                        "total_interchange": 0.0,
                    }
                
                summary["by_type"][type_key]["count"] += 1
                summary["by_type"][type_key]["total_amount"] += tx.amount
                summary["by_type"][type_key]["total_interchange"] += interchange.interchange_amount
                
            except Exception as e:
                logger.error(f"Failed to calculate interchange for transaction {tx.id}: {e}")
                results.append({
                    "id": tx.id,
                    "error": str(e),
                })
        
        return BatchInterchangeResult(
            transactions=results,
            summary=summary,
        )
    
    def get_rate_info(
        self,
        transaction_type: str,
        card_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get interchange rate information for display/disclosure purposes.
        
        Useful for:
        - Fee transparency (PSD-10 requirement)
        - User interface display
        - Documentation generation
        
        Args:
            transaction_type: Transaction type
            card_type: Card type (for card transactions)
            
        Returns:
            Dictionary with rate information
        """
        try:
            transaction_type_enum = normalize_transaction_type(transaction_type)
            category = get_transaction_category(transaction_type_enum)
            
            if category == TransactionCategory.CARD:
                if not card_type:
                    return {"error": "Card type required for card transactions"}
                
                card_type_enum = normalize_card_type(card_type)
                fee_rate = get_card_rate(transaction_type_enum, card_type_enum)
                
                if fee_rate.rate:
                    return {
                        "rate": f"{fee_rate.rate * 100:.2f}%",
                        "description": fee_rate.description,
                        "psd_reference": get_psd_reference(transaction_type_enum),
                    }
                elif fee_rate.fixed_fee:
                    return {
                        "rate": f"N${fee_rate.fixed_fee:.2f}",
                        "description": fee_rate.description,
                        "psd_reference": get_psd_reference(transaction_type_enum),
                    }
            
            elif category == TransactionCategory.ATM:
                fee_rate = get_atm_rate(transaction_type_enum)
                
                if fee_rate.variable_fee_per_hundred:
                    return {
                        "formula": f"N${fee_rate.fixed_fee:.2f} + N${fee_rate.variable_fee_per_hundred:.2f} per N$100",
                        "description": fee_rate.description,
                        "psd_reference": get_psd_reference(transaction_type_enum),
                    }
                else:
                    return {
                        "rate": f"N${fee_rate.fixed_fee:.2f}",
                        "description": fee_rate.description,
                        "psd_reference": get_psd_reference(transaction_type_enum),
                    }
            
            elif category == TransactionCategory.INSTANT_PAYMENT:
                fee_rate = get_instant_payment_rate(transaction_type_enum)
                
                if fee_rate.rate:
                    return {
                        "rate": f"{fee_rate.rate * 100:.2f}%",
                        "description": fee_rate.description,
                        "psd_reference": get_psd_reference(transaction_type_enum),
                    }
                elif fee_rate.fixed_fee:
                    return {
                        "rate": f"N${fee_rate.fixed_fee:.2f}",
                        "description": fee_rate.description,
                        "psd_reference": get_psd_reference(transaction_type_enum),
                    }
            
            elif category == TransactionCategory.EXEMPT:
                return {
                    "rate": "N$0.00",
                    "description": f"{transaction_type_enum.value} - No interchange applicable",
                    "psd_reference": get_psd_reference(transaction_type_enum),
                }
        
        except Exception as e:
            logger.error(f"Failed to get rate info: {e}")
            return {"error": str(e)}
        
        return {"error": "Unknown transaction type"}
    
    def validate_interchange_applicable(self, transaction_type: str) -> bool:
        """
        Check if interchange fee applies to transaction type.
        
        Section 13.5: Only specified transaction types qualify for interchange.
        
        Args:
            transaction_type: Transaction type to check
            
        Returns:
            True if interchange is applicable
        """
        try:
            transaction_type_enum = normalize_transaction_type(transaction_type)
            return transaction_type_enum not in EXEMPT_TRANSACTION_TYPES
        except ValueError:
            return False


# =============================================================================
# Legacy Compatibility Layer
# =============================================================================

class LegacyFeeCalculator:
    """
    Compatibility layer for legacy fee calculation calls.
    
    Provides backward-compatible interface matching the old duplicate
    implementations while using the centralized calculator internally.
    """
    
    def __init__(self):
        self.calculator = FeeCalculator()
    
    def estimate_fee_local(
        self,
        transaction_type: str,
        card_type: Optional[str],
        amount: float,
    ) -> Dict[str, Any]:
        """
        Legacy interface matching old _estimate_fee_local methods.
        
        This method maintains backward compatibility with:
        - compliance/validator.py::_estimate_fee_local
        - services/compliance_validator.py::_estimate_fee_local
        
        Args:
            transaction_type: Transaction type string
            card_type: Card type string (optional)
            amount: Transaction amount
            
        Returns:
            Dictionary matching legacy format
        """
        try:
            result = self.calculator.calculate_interchange(InterchangeInput(
                transaction_type=transaction_type,
                card_type=card_type,
                amount=amount
            ))
            
            return {
                "interchange_amount": result.interchange_amount,
                "interchange_rate": result.interchange_rate,
                "vat_amount": result.vat_amount,
                "total_fee": result.total_interchange,
                "description": result.description,
                "source": "centralized_calculator",
            }
        
        except Exception as e:
            logger.error(f"Legacy fee calculation failed: {e}")
            return {
                "interchange_amount": 0.0,
                "total_fee": 0.0,
                "description": f"Calculation error: {str(e)}",
                "source": "centralized_calculator",
                "error": str(e),
            }


# =============================================================================
# Global Calculator Instance
# =============================================================================

# Singleton instance for convenient access
_global_calculator: Optional[FeeCalculator] = None


def get_fee_calculator() -> FeeCalculator:
    """
    Get the global fee calculator instance.
    
    Returns:
        FeeCalculator singleton instance
    """
    global _global_calculator
    if _global_calculator is None:
        _global_calculator = FeeCalculator()
    return _global_calculator


# Convenience functions for direct access
def calculate_interchange(input_data: InterchangeInput) -> InterchangeResult:
    """Convenience function for calculating interchange."""
    return get_fee_calculator().calculate_interchange(input_data)


def get_interchange_rate_info(
    transaction_type: str,
    card_type: Optional[str] = None
) -> Dict[str, Any]:
    """Convenience function for getting rate information."""
    return get_fee_calculator().get_rate_info(transaction_type, card_type)


# =============================================================================
# Validation and Testing Utilities
# =============================================================================

def validate_fee_parity(
    transaction_type: str,
    card_type: Optional[str],
    amount: float,
    expected_result: Dict[str, float],
    tolerance: float = 0.01
) -> bool:
    """
    Validate that calculated fees match expected results.
    
    Useful for testing migration from old duplicate implementations.
    
    Args:
        transaction_type: Transaction type
        card_type: Card type
        amount: Transaction amount
        expected_result: Expected calculation results
        tolerance: Acceptable difference for floating point comparison
        
    Returns:
        True if results match within tolerance
    """
    calculator = get_fee_calculator()
    
    try:
        result = calculator.calculate_interchange(InterchangeInput(
            transaction_type=transaction_type,
            card_type=card_type,
            amount=amount
        ))
        
        # Compare key fields
        checks = []
        
        if "interchange_amount" in expected_result:
            diff = abs(result.interchange_amount - expected_result["interchange_amount"])
            checks.append(diff <= tolerance)
        
        if "vat_amount" in expected_result:
            diff = abs(result.vat_amount - expected_result["vat_amount"])
            checks.append(diff <= tolerance)
        
        if "total_fee" in expected_result:
            diff = abs(result.total_interchange - expected_result["total_fee"])
            checks.append(diff <= tolerance)
        
        return all(checks)
    
    except Exception as e:
        logger.error(f"Fee parity validation failed: {e}")
        return False
