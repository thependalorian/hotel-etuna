"""
Transaction Analyst agent: Pydantic AI agent and run_transaction_analyst.

Location: backend_python/smartpay_ai/agents/transaction_analyst/agent.py
Purpose: Analyze spending patterns and provide budget recommendations.

REFACTORED: Now uses BaseAgent to eliminate boilerplate duplication.

COMPLIANCE INTEGRATION:
- PSD-11: Interchange fee awareness in budget recommendations
- Fee display in spending analysis
- Transaction cost transparency
"""

import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

from pydantic_ai import Agent, RunContext

from smartpay_ai.agents.base_agent import BaseAgent, BaseAgentDeps
from smartpay_ai.providers import get_llm_model
from smartpay_ai.compliance.validator import ComplianceValidator

from .models import (
    AnalysisResponse,
    CategoryBreakdown,
    SpendingInsight,
    BudgetRecommendation,
)
from .prompts import TRANSACTION_ANALYST_SYSTEM_PROMPT
from . import tools

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------

@dataclass
class TransactionAnalystDeps(BaseAgentDeps):
    """Dependencies injected into the Transaction Analyst agent."""
    pass  # All common fields inherited from BaseAgentDeps


# ---------------------------------------------------------------------------
# Transaction Analyst Agent Implementation
# ---------------------------------------------------------------------------

class TransactionAnalystAgent(BaseAgent[TransactionAnalystDeps, AnalysisResponse]):
    """
    Transaction Analyst agent using BaseAgent for DRY compliance.
    
    Eliminates ~120 lines of boilerplate by inheriting common patterns
    from BaseAgent.
    """
    
    def __init__(self):
        super().__init__(
            agent_name="transaction_analyst",
            deps_type=TransactionAnalystDeps,
            output_type=AnalysisResponse,
            system_prompt=TRANSACTION_ANALYST_SYSTEM_PROMPT,
        )
    
    def _register_tools(self, agent: Agent) -> None:
        """Register transaction analysis tools."""
        agent.tool(self._get_transactions)
        agent.tool(self._calculate_category_totals)
        agent.tool(self._detect_anomalies)
        agent.tool(self._generate_budget)
    
    def get_default_response(self, error_message: str) -> AnalysisResponse:
        """Return a safe default analysis response."""
        return AnalysisResponse(
            summary=error_message,
            total_spent=0.0,
            total_income=0.0,
            net_balance=0.0,
            period="month",
        )
    
    # -----------------------------------------------------------------------
    # Tool Implementations
    # -----------------------------------------------------------------------
    
    async def _get_transactions(
        self,
        ctx: RunContext[TransactionAnalystDeps],
        period: str = "month",
        category: Optional[str] = None,
    ) -> str:
        """Retrieve user transactions for the specified period."""
        transactions = await tools.get_transactions(
            user_id=ctx.deps.user_id,
            period=period,
            category=category,
            db_pool=ctx.deps.db_pool,
        )
        
        if not transactions:
            return f"No transactions found for period: {period}"
        
        return f"Retrieved {len(transactions)} transactions for {period}"
    
    async def _calculate_category_totals(
        self,
        ctx: RunContext[TransactionAnalystDeps],
        period: str = "month",
    ) -> str:
        """
        Calculate spending totals by category with fee awareness.
        
        COMPLIANCE INTEGRATION:
        - PSD-11: Estimates interchange fees for each category
        """
        transactions = await tools.get_transactions(
            user_id=ctx.deps.user_id,
            period=period,
            db_pool=ctx.deps.db_pool,
        )
        
        category_data = await tools.calculate_category_totals(transactions)
        
        # PSD-11: Estimate total fees
        total_fees = 0.0
        compliance = ctx.deps.compliance_validator
        
        if compliance and transactions:
            for txn in transactions:
                txn_type = txn.get("transaction_type", "instant_payment")
                card_type = txn.get("card_type")
                amount = abs(float(txn.get("amount", 0)))
                
                try:
                    fee_result = await compliance.estimate_interchange_fee(
                        transaction_type=txn_type,
                        card_type=card_type,
                        amount=amount,
                    )
                    total_fees += fee_result.get("total_fee", 0)
                except Exception as e:
                    logger.debug(f"Fee estimation failed for transaction: {e}")
        
        summary = [f"Spending by Category ({period}):"]
        
        for category, data in sorted(
            category_data.items(),
            key=lambda x: x[1]["amount"],
            reverse=True,
        ):
            summary.append(
                f"{category}: N${data['amount']:.2f} ({data['percentage']:.1f}%) - {data['count']} transactions"
            )
        
        # Add fee summary
        if total_fees > 0:
            summary.append(f"\nEstimated Transaction Fees: N${total_fees:.2f}")
            summary.append("💡 Tip: Use direct bank transfers to minimize fees")
        
        return "\n".join(summary) if summary else "No spending data available"
    
    async def _detect_anomalies(
        self,
        ctx: RunContext[TransactionAnalystDeps],
        period: str = "month",
    ) -> str:
        """Detect unusual transactions that may need attention."""
        transactions = await tools.get_transactions(
            user_id=ctx.deps.user_id,
            period=period,
            db_pool=ctx.deps.db_pool,
        )
        
        anomalies = await tools.detect_anomalies(transactions)
        
        if not anomalies:
            return "No unusual transactions detected"
        
        summary = [f"Found {len(anomalies)} unusual transactions:"]
        for i, anomaly in enumerate(anomalies[:5], 1):
            txn = anomaly["transaction"]
            summary.append(f"{i}. {anomaly['reason']} (ID: {txn['id']})")
        
        return "\n".join(summary)
    
    async def _generate_budget(
        self,
        ctx: RunContext[TransactionAnalystDeps],
        monthly_income: float,
    ) -> str:
        """
        Generate personalized budget recommendations with fee awareness.
        
        COMPLIANCE INTEGRATION:
        - PSD-11: Factors in estimated transaction fees
        - Provides fee-optimized spending recommendations
        """
        transactions = await tools.get_transactions(
            user_id=ctx.deps.user_id,
            period="month",
            db_pool=ctx.deps.db_pool,
        )
        
        category_data = await tools.calculate_category_totals(transactions)
        category_spending = {cat: data["amount"] for cat, data in category_data.items()}
        
        # PSD-11: Estimate average monthly fees
        estimated_monthly_fees = 0.0
        compliance = ctx.deps.compliance_validator
        
        if compliance and transactions:
            # Estimate fees for average transaction count
            avg_transaction_amount = sum(abs(float(t.get("amount", 0))) for t in transactions) / len(transactions) if transactions else 0
            estimated_transactions_per_month = 100  # Typical user
            
            try:
                # Estimate for typical instant payment
                fee_result = await compliance.estimate_interchange_fee(
                    transaction_type="instant_payment",
                    amount=avg_transaction_amount,
                )
                estimated_monthly_fees = fee_result.get("total_fee", 0) * estimated_transactions_per_month
            except Exception as e:
                logger.debug(f"Fee estimation failed: {e}")
        
        # Generate base budget (50/30/20 rule)
        budget = await tools.generate_budget(monthly_income, category_spending)
        
        summary = [f"Recommended Budget (N${monthly_income:.2f} monthly income):"]
        
        # Adjust for fees
        if estimated_monthly_fees > 0:
            summary.append(f"\n💰 Estimated Transaction Fees: N${estimated_monthly_fees:.2f}/month")
            summary.append(f"   (Reduces available spending by {(estimated_monthly_fees/monthly_income)*100:.1f}%)")
            summary.append(f"\n✨ Fee-Adjusted Budget:")
            
            # Reduce "Needs" category to account for fees
            if "Needs" in budget:
                budget["Needs"] -= estimated_monthly_fees
            
            summary.append("")
        
        for category, amount in sorted(budget.items(), key=lambda x: x[1], reverse=True):
            current = category_spending.get(category, 0)
            diff = amount - current
            status = "✓" if current <= amount else "⚠"
            summary.append(
                f"{status} {category}: N${amount:.2f} recommended (current: N${current:.2f}, diff: {diff:+.2f})"
            )
        
        # Add fee optimization tip
        if estimated_monthly_fees > 50:
            summary.append(f"\n💡 Save on Fees:")
            summary.append(f"   - Use bank transfers instead of card payments where possible")
            summary.append(f"   - Batch smaller purchases to reduce transaction count")
            summary.append(f"   - Potential savings: N${estimated_monthly_fees * 0.3:.2f}/month")
        
        return "\n".join(summary)


# ---------------------------------------------------------------------------
# Agent Instance
# ---------------------------------------------------------------------------

_transaction_analyst_instance = None

def get_transaction_analyst_agent() -> TransactionAnalystAgent:
    """Get singleton instance of TransactionAnalystAgent."""
    global _transaction_analyst_instance
    if _transaction_analyst_instance is None:
        _transaction_analyst_instance = TransactionAnalystAgent()
    return _transaction_analyst_instance


# ---------------------------------------------------------------------------
# Public Run Function (Backward Compatible)
# ---------------------------------------------------------------------------

async def run_transaction_analyst(
    query: str,
    user_id: str,
    period: str = "month",
    category: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
    db_pool: Optional[Any] = None,
    ml_service: Optional[Any] = None,
    compliance_validator: Optional[ComplianceValidator] = None,
) -> AnalysisResponse:
    """
    Run the Transaction Analyst agent with fee awareness.
    
    BACKWARD COMPATIBLE: This function maintains the same signature as before
    but now uses the refactored BaseAgent implementation internally.
    
    COMPLIANCE FEATURES:
    - PSD-11: Interchange fee estimates in all analyses
    - Fee-optimized budget recommendations
    - Transaction cost transparency
    
    Args:
        query: User's analysis request
        user_id: User ID
        period: Analysis period ("week", "month", "quarter", "year")
        category: Optional category filter
        context: Additional context
        db_pool: Database connection pool
        ml_service: ML service for advanced analysis
        compliance_validator: ComplianceValidator instance (created if None)
    
    Returns:
        AnalysisResponse with spending insights and recommendations
    """
    agent = get_transaction_analyst_agent()
    
    # Initialize compliance validator if not provided
    if compliance_validator is None:
        compliance_validator = ComplianceValidator()
    
    # Build dependencies
    deps = TransactionAnalystDeps(
        user_id=user_id,
        db_pool=db_pool,
        ml_service=ml_service,
        compliance_validator=compliance_validator,
    )
    
    # Build context with period and category
    full_context = context.copy() if context else {}
    full_context["period"] = period
    if category:
        full_context["category"] = category
    
    # Run agent with BaseAgent's standardized error handling
    return await agent.run(query, deps, full_context)
