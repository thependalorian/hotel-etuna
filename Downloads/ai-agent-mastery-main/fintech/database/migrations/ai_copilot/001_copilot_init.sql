-- ═══════════════════════════════════════════════════════════════
-- Smartpay AI Copilot - Database Schema Migration 001
-- ═══════════════════════════════════════════════════════════════
-- Purpose: Create core tables for conversation history and knowledge base
-- Location: backend_python/smartpay_ai/data/migrations/001_init.sql
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Conversation History Table ───
-- Stores user-agent conversation messages for context and personalization
CREATE TABLE IF NOT EXISTS conversation_history (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    conversation_type VARCHAR(50) DEFAULT 'chat',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    response_time_ms INTEGER,
    model_used VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    INDEX idx_conversation_user_created (user_id, created_at DESC)
);

-- Index for efficient retrieval of recent conversations by user
CREATE INDEX IF NOT EXISTS idx_conversation_user_created ON conversation_history (user_id, created_at DESC);


-- ─── 2. User Preferences Table ───
-- Stores user-specific preferences for personalization
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id VARCHAR(255) PRIMARY KEY,
    preferred_name VARCHAR(255),
    communication_style VARCHAR(50) DEFAULT 'balanced' CHECK (communication_style IN ('concise', 'balanced', 'detailed')),
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Africa/Windhoek',
    notification_preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ─── 3. Knowledge Base Documents Table ───
-- Stores curated knowledge articles (consumer protection, regulations, financial literacy)
CREATE TABLE IF NOT EXISTS knowledge_base_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    source VARCHAR(255),
    scope VARCHAR(20) NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'user')),
    user_id VARCHAR(255),
    content_search TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
    ) STORED,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure user_id is set when scope='user'
    CHECK (scope != 'user' OR user_id IS NOT NULL)
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_kb_content_search ON knowledge_base_documents USING GIN (content_search);

-- User isolation index
CREATE INDEX IF NOT EXISTS idx_kb_user_scope ON knowledge_base_documents (user_id, scope) WHERE scope = 'user';


-- ─── 4. LangGraph Checkpointer Tables ───
-- These are created automatically by AsyncPostgresSaver.setup()
-- But we document the expected schema for reference:

-- checkpoints: Stores conversation state at each step
-- checkpoint_writes: Stores pending writes
-- checkpoint_metadata: Stores checkpoint metadata

-- Note: LangGraph will handle these tables automatically.
-- If you need to manually create them, run:
-- await checkpointer.setup()


-- ═══════════════════════════════════════════════════════════════
-- Seed Data: Sample Knowledge Base Articles
-- ═══════════════════════════════════════════════════════════════

INSERT INTO knowledge_base_documents (title, content, source, scope) VALUES
(
    'Bank of Namibia PSD-3 KYC Tiers',
    'Smartpay follows the Bank of Namibia Payment System Directive (PSD-3) for KYC tiers:

    **Basic Tier (N$5,000 monthly limit):**
    - Required: Phone number verification
    - Transaction limit: N$1,000 daily
    - Max balance: N$5,000
    
    **Standard Tier (N$25,000 monthly limit):**
    - Required: ID document, address verification, selfie
    - Transaction limit: N$10,000 daily
    - Max balance: N$25,000
    
    **Premium Tier (N$50,000+ monthly):**
    - Required: Proof of income, utility bill, bank statement
    - Transaction limit: N$50,000 daily
    - Max balance: N$50,000
    
    **Full KYC (Unlimited):**
    - Required: In-person verification, advanced documentation
    - No limits
    - Suitable for business and high-volume users',
    'Bank of Namibia',
    'global'
),
(
    'NAMQR - Namibia National QR Payment Standard',
    'NAMQR is Namibia''s national QR code payment standard, similar to India''s UPI QR.

    **How it works:**
    - Each user has a unique SmartpayID (e.g., SP81123456) generated from phone number
    - SmartpayID is embedded in NAMQR code
    - Merchants and users scan NAMQR to send/receive payments
    - Instant, secure, and regulated by Bank of Namibia
    
    **Advantages:**
    - No need to share phone number
    - Works offline (QR display)
    - Universal across all Namibian payment platforms
    - Secure (encrypted payload)',
    'Bank of Namibia',
    'global'
),
(
    'Smartpay Transaction Fees',
    'Smartpay fee structure for Namibian users:

    **Free Transactions:**
    - Wallet-to-wallet transfers (within Smartpay)
    - Receiving money via NAMQR
    - Bill splitting and group contributions
    
    **Paid Transactions:**
    - Cash-out at agent: 2% (min N$10, max N$50)
    - Bank transfer: N$5 per transaction
    - Bill payment: N$2 per bill
    - International transfer: 3% + N$50
    
    **Monthly Limits:**
    - Basic: N$5,000
    - Standard: N$25,000
    - Premium: N$50,000
    - Full KYC: Unlimited',
    'Smartpay Official',
    'global'
),
(
    'Proof-of-Life Verification',
    'Smartpay requires periodic proof-of-life verification for G2P beneficiaries.

    **How it works:**
    - Notification sent 7 days before deadline
    - User takes a selfie in the app
    - Biometric verification against ID
    - Instant approval (< 30 seconds)
    
    **Frequency:**
    - Monthly for social grants
    - Quarterly for pensions
    
    **Failure to verify:**
    - Account frozen after 3 days past deadline
    - Can be unfrozen immediately after verification
    
    **Privacy:**
    - Selfies are not stored (only hash)
    - Compliant with Namibian data protection laws',
    'Smartpay Official',
    'global'
),
(
    'Consumer Protection and Complaints',
    'Your rights as a Smartpay user in Namibia:

    **Dispute Resolution:**
    - Report issues in app: Settings → Help → Report Issue
    - Email: support@smartpay.na
    - Phone: +264 61 123 4567
    - Response time: 24-48 hours
    
    **Refund Policy:**
    - Unauthorized transactions: Full refund within 7 days
    - Service failure: Refund + compensation
    - Disputed bills: Investigation within 14 days
    
    **Bank of Namibia:**
    - Smartpay is supervised by the Bank of Namibia
    - Complaint escalation: complaints@bon.org.na
    
    **Your funds are safe:**
    - Segregated trust accounts
    - Deposit insurance coverage
    - Regular audits by Bank of Namibia',
    'Bank of Namibia',
    'global'
);


-- ═══════════════════════════════════════════════════════════════
-- Migration Complete
-- ═══════════════════════════════════════════════════════════════
