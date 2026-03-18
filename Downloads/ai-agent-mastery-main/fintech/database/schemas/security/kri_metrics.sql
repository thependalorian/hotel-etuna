-- ============================================================================
-- KEY RISK INDICATORS (KRI) SCHEMA - PSD-12 Compliance
-- Purpose: Track and monitor all KRIs required by Section 13
-- Requirements:
--   - Uptime/Availability: 99.9%
--   - Recovery Time Objective (RTO): Within 2 hours
--   - Recovery Point Objective (RPO): 5 minutes
--   - Test DR plans: 2 successful tests per year
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- System Availability Metrics (KRI 1: 99.9% uptime requirement)
CREATE TABLE system_availability_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- System Identification
    system_name VARCHAR(100) NOT NULL, -- 'PAYMENT_GATEWAY', 'DATABASE', 'API', 'MOBILE_APP', 'WEB_APP'
    system_type VARCHAR(50) NOT NULL, -- 'CRITICAL', 'NON_CRITICAL'
    system_category VARCHAR(50) NOT NULL, -- 'FMI', 'RETAIL_PAYMENT', 'SUPPORTING'
    
    -- Availability Status
    is_available BOOLEAN NOT NULL,
    uptime_percentage DECIMAL(5,2), -- Current uptime percentage
    
    -- Downtime Tracking
    downtime_start TIMESTAMPTZ,
    downtime_end TIMESTAMPTZ,
    downtime_duration_minutes INTEGER,
    downtime_reason TEXT,
    downtime_category VARCHAR(50), -- 'PLANNED_MAINTENANCE', 'UNPLANNED_OUTAGE', 'CYBERATTACK', 'HARDWARE_FAILURE'
    
    -- Response Metrics
    response_time_ms INTEGER, -- Average response time in milliseconds
    error_rate DECIMAL(5,2), -- Error rate percentage
    
    -- Metadata
    metadata JSONB,
    
    CONSTRAINT valid_system_type CHECK (system_type IN ('CRITICAL', 'NON_CRITICAL')),
    CONSTRAINT valid_downtime_category CHECK (downtime_category IN ('PLANNED_MAINTENANCE', 'UNPLANNED_OUTAGE', 'CYBERATTACK', 'HARDWARE_FAILURE', 'NETWORK_ISSUE'))
);

CREATE INDEX idx_availability_timestamp ON system_availability_metrics(timestamp DESC);
CREATE INDEX idx_availability_system ON system_availability_metrics(system_name);
CREATE INDEX idx_availability_downtime ON system_availability_metrics(is_available) WHERE is_available = FALSE;
CREATE INDEX idx_availability_critical ON system_availability_metrics(system_type) WHERE system_type = 'CRITICAL';

-- Recovery Metrics (KRI 2 & 3: RTO and RPO tracking)
CREATE TABLE recovery_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Incident Reference
    incident_id UUID, -- References incidents table
    incident_type VARCHAR(100) NOT NULL,
    
    -- System Details
    system_name VARCHAR(100) NOT NULL,
    
    -- Recovery Time Objective (RTO) - Must be within 2 hours
    rto_target_minutes INTEGER NOT NULL DEFAULT 120, -- 2 hours = 120 minutes
    rto_actual_minutes INTEGER,
    rto_met BOOLEAN, -- TRUE if RTO_actual <= RTO_target
    
    -- Recovery Point Objective (RPO) - Must be <= 5 minutes
    rpo_target_minutes INTEGER NOT NULL DEFAULT 5,
    rpo_actual_minutes INTEGER,
    data_loss_minutes INTEGER, -- Actual data loss
    rpo_met BOOLEAN, -- TRUE if data_loss <= RPO_target
    
    -- Timeline
    disruption_start TIMESTAMPTZ NOT NULL,
    recovery_initiated TIMESTAMPTZ,
    recovery_completed TIMESTAMPTZ,
    
    -- Actions Taken
    recovery_actions JSONB,
    challenges_encountered TEXT,
    
    -- Validation
    recovery_validated BOOLEAN DEFAULT FALSE,
    validated_by_user_id UUID,
    validated_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB
);

CREATE INDEX idx_recovery_timestamp ON recovery_metrics(timestamp DESC);
CREATE INDEX idx_recovery_system ON recovery_metrics(system_name);
CREATE INDEX idx_recovery_rto_failed ON recovery_metrics(rto_met) WHERE rto_met = FALSE;
CREATE INDEX idx_recovery_rpo_failed ON recovery_metrics(rpo_met) WHERE rpo_met = FALSE;

-- Disaster Recovery (DR) Testing (KRI 4: 2 successful tests per year)
CREATE TABLE dr_testing_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Test Details
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(100) NOT NULL, -- 'FULL_DR_TEST', 'TABLETOP_EXERCISE', 'FAILOVER_TEST', 'BACKUP_RESTORE_TEST'
    test_scope JSONB, -- Systems and scenarios included in test
    
    -- Scheduling
    scheduled_date DATE NOT NULL,
    planned_duration_hours INTEGER NOT NULL DEFAULT 4,
    
    -- Execution
    test_status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    
    -- Results
    test_result VARCHAR(50), -- 'SUCCESSFUL', 'PARTIAL_SUCCESS', 'FAILED'
    success_criteria JSONB, -- Array of success criteria
    success_criteria_met JSONB, -- Which criteria were met
    
    -- RTO/RPO Validation in Test
    rto_tested_minutes INTEGER,
    rto_target_minutes INTEGER DEFAULT 120,
    rto_achieved BOOLEAN,
    rpo_tested_minutes INTEGER,
    rpo_target_minutes INTEGER DEFAULT 5,
    rpo_achieved BOOLEAN,
    
    -- Findings
    findings TEXT,
    issues_identified JSONB,
    remediation_actions JSONB,
    
    -- Participants
    test_lead_user_id UUID,
    participants JSONB, -- Array of participant user IDs
    
    -- Documentation
    test_plan_document_url TEXT,
    test_report_document_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_test_status CHECK (test_status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT valid_test_result CHECK (test_result IN ('SUCCESSFUL', 'PARTIAL_SUCCESS', 'FAILED'))
);

CREATE INDEX idx_dr_testing_scheduled_date ON dr_testing_schedule(scheduled_date);
CREATE INDEX idx_dr_testing_status ON dr_testing_schedule(test_status);
CREATE INDEX idx_dr_testing_result ON dr_testing_schedule(test_result);

-- Penetration Testing Schedule (Section 11.3: Every 3 years for critical systems)
CREATE TABLE penetration_testing_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Test Details
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(100) NOT NULL, -- 'EXTERNAL_PENTEST', 'INTERNAL_PENTEST', 'WEB_APP_PENTEST', 'MOBILE_APP_PENTEST', 'API_PENTEST'
    test_scope TEXT NOT NULL,
    
    -- Scheduling (Every 3 years per PSD-12 Section 11.3)
    scheduled_date DATE NOT NULL,
    due_date DATE NOT NULL, -- Must be within 3 years of last test
    
    -- Vendor/Team
    testing_vendor VARCHAR(255),
    vendor_contact VARCHAR(255),
    is_external_vendor BOOLEAN DEFAULT TRUE,
    
    -- Execution
    test_status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Results
    vulnerabilities_found INTEGER DEFAULT 0,
    critical_vulnerabilities INTEGER DEFAULT 0,
    high_vulnerabilities INTEGER DEFAULT 0,
    medium_vulnerabilities INTEGER DEFAULT 0,
    low_vulnerabilities INTEGER DEFAULT 0,
    
    -- Findings
    executive_summary TEXT,
    detailed_findings_document_url TEXT,
    
    -- Remediation
    remediation_plan_document_url TEXT,
    all_vulnerabilities_remediated BOOLEAN DEFAULT FALSE,
    remediation_completed_date DATE,
    
    -- Compliance
    compliance_status VARCHAR(50) DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'COMPLETED', 'OVERDUE'
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_pentest_status CHECK (test_status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE')),
    CONSTRAINT valid_compliance_status CHECK (compliance_status IN ('SCHEDULED', 'COMPLETED', 'OVERDUE'))
);

CREATE INDEX idx_pentest_scheduled_date ON penetration_testing_schedule(scheduled_date);
CREATE INDEX idx_pentest_due_date ON penetration_testing_schedule(due_date);
CREATE INDEX idx_pentest_status ON penetration_testing_schedule(test_status);
CREATE INDEX idx_pentest_overdue ON penetration_testing_schedule(compliance_status) WHERE compliance_status = 'OVERDUE';

-- KRI Summary Metrics (Aggregated daily metrics for dashboard)
CREATE TABLE kri_daily_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    
    -- KRI 1: System Uptime (Target: 99.9%)
    avg_uptime_percentage DECIMAL(5,2),
    min_uptime_percentage DECIMAL(5,2),
    critical_systems_uptime DECIMAL(5,2),
    uptime_target_met BOOLEAN,
    
    -- Total Downtime
    total_downtime_minutes INTEGER DEFAULT 0,
    unplanned_downtime_minutes INTEGER DEFAULT 0,
    planned_downtime_minutes INTEGER DEFAULT 0,
    
    -- KRI 2 & 3: RTO/RPO
    recovery_incidents INTEGER DEFAULT 0,
    rto_met_count INTEGER DEFAULT 0,
    rto_failed_count INTEGER DEFAULT 0,
    rpo_met_count INTEGER DEFAULT 0,
    rpo_failed_count INTEGER DEFAULT 0,
    avg_recovery_time_minutes DECIMAL(10,2),
    avg_data_loss_minutes DECIMAL(10,2),
    
    -- System Performance
    avg_response_time_ms INTEGER,
    avg_error_rate DECIMAL(5,2),
    
    -- Incidents
    total_incidents INTEGER DEFAULT 0,
    critical_incidents INTEGER DEFAULT 0,
    
    -- 2FA Compliance
    payments_processed INTEGER DEFAULT 0,
    payments_with_2fa INTEGER DEFAULT 0,
    two_fa_compliance_percentage DECIMAL(5,2),
    
    -- Fraud Detection
    fraud_attempts_detected INTEGER DEFAULT 0,
    fraud_attempts_blocked INTEGER DEFAULT 0,
    fraud_block_rate DECIMAL(5,2),
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kri_summary_date ON kri_daily_summary(date DESC);
CREATE INDEX idx_kri_summary_uptime_failed ON kri_daily_summary(uptime_target_met) WHERE uptime_target_met = FALSE;

-- Board Reporting Schedule (Section 9.4: 4 times per year)
CREATE TABLE board_reporting_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reporting Period
    report_quarter VARCHAR(10) NOT NULL, -- 'Q1-2026', 'Q2-2026', etc.
    report_year INTEGER NOT NULL,
    quarter INTEGER NOT NULL, -- 1, 2, 3, 4
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    
    -- Report Status
    report_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED'
    
    -- Report Details
    prepared_by_user_id UUID,
    reviewed_by_user_id UUID,
    approved_by_user_id UUID,
    
    submitted_to_board_at TIMESTAMPTZ,
    board_meeting_date DATE,
    
    -- Report Content
    report_document_url TEXT,
    executive_summary TEXT,
    
    -- KRI Status in Report
    overall_risk_level VARCHAR(20), -- 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'
    compliance_status VARCHAR(20), -- 'COMPLIANT', 'NON_COMPLIANT', 'PARTIAL_COMPLIANCE'
    
    -- Key Metrics
    uptime_percentage DECIMAL(5,2),
    incidents_count INTEGER,
    fraud_blocked_count INTEGER,
    dr_tests_completed INTEGER,
    
    -- Recommendations
    recommendations JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_report_status CHECK (report_status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
    CONSTRAINT valid_quarter CHECK (quarter BETWEEN 1 AND 4),
    CONSTRAINT valid_risk_level CHECK (overall_risk_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    CONSTRAINT valid_compliance_status CHECK (compliance_status IN ('COMPLIANT', 'NON_COMPLIANT', 'PARTIAL_COMPLIANCE'))
);

CREATE INDEX idx_board_reporting_quarter ON board_reporting_schedule(report_year, quarter);
CREATE INDEX idx_board_reporting_status ON board_reporting_schedule(report_status);
CREATE INDEX idx_board_reporting_pending ON board_reporting_schedule(report_status) WHERE report_status = 'PENDING';

-- View: Current KRI Status Dashboard
CREATE VIEW kri_current_status AS
WITH recent_metrics AS (
    SELECT 
        date,
        avg_uptime_percentage,
        critical_systems_uptime,
        uptime_target_met,
        total_downtime_minutes,
        avg_recovery_time_minutes,
        avg_data_loss_minutes,
        two_fa_compliance_percentage,
        fraud_block_rate,
        total_incidents,
        critical_incidents
    FROM kri_daily_summary
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
),
dr_tests_this_year AS (
    SELECT 
        COUNT(*) FILTER (WHERE test_result = 'SUCCESSFUL') as successful_tests,
        COUNT(*) as total_tests
    FROM dr_testing_schedule
    WHERE EXTRACT(YEAR FROM scheduled_date) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND test_status = 'COMPLETED'
),
upcoming_pentest AS (
    SELECT 
        MIN(scheduled_date) as next_pentest_date,
        COUNT(*) FILTER (WHERE compliance_status = 'OVERDUE') as overdue_pentests
    FROM penetration_testing_schedule
    WHERE test_status NOT IN ('COMPLETED', 'CANCELLED')
)
SELECT 
    -- KRI 1: Uptime (Target: 99.9%)
    ROUND(AVG(rm.avg_uptime_percentage), 2) as avg_uptime_30d,
    99.9 as uptime_target,
    CASE WHEN AVG(rm.avg_uptime_percentage) >= 99.9 THEN TRUE ELSE FALSE END as uptime_target_met,
    
    -- KRI 2: RTO (Target: < 120 minutes)
    ROUND(AVG(rm.avg_recovery_time_minutes), 2) as avg_rto_minutes,
    120 as rto_target_minutes,
    CASE WHEN AVG(rm.avg_recovery_time_minutes) <= 120 THEN TRUE ELSE FALSE END as rto_target_met,
    
    -- KRI 3: RPO (Target: <= 5 minutes)
    ROUND(AVG(rm.avg_data_loss_minutes), 2) as avg_rpo_minutes,
    5 as rpo_target_minutes,
    CASE WHEN AVG(rm.avg_data_loss_minutes) <= 5 THEN TRUE ELSE FALSE END as rpo_target_met,
    
    -- KRI 4: DR Testing (Target: 2/year)
    COALESCE(drt.successful_tests, 0) as dr_tests_completed_this_year,
    2 as dr_tests_target,
    CASE WHEN COALESCE(drt.successful_tests, 0) >= 2 THEN TRUE ELSE FALSE END as dr_tests_target_met,
    
    -- Additional Metrics
    ROUND(AVG(rm.two_fa_compliance_percentage), 2) as two_fa_compliance,
    ROUND(AVG(rm.fraud_block_rate), 2) as fraud_block_rate,
    SUM(rm.total_incidents) as total_incidents_30d,
    SUM(rm.critical_incidents) as critical_incidents_30d,
    
    -- Penetration Testing
    pt.next_pentest_date,
    pt.overdue_pentests
FROM recent_metrics rm
CROSS JOIN dr_tests_this_year drt
CROSS JOIN upcoming_pentest pt;

-- View: KRI Compliance Status (Red/Amber/Green)
CREATE VIEW kri_compliance_traffic_light AS
SELECT 
    'System Uptime' as kri_name,
    '99.9%' as target,
    ROUND(avg_uptime_30d, 2)::TEXT || '%' as actual,
    CASE 
        WHEN avg_uptime_30d >= 99.9 THEN 'GREEN'
        WHEN avg_uptime_30d >= 99.5 THEN 'AMBER'
        ELSE 'RED'
    END as status
FROM kri_current_status

UNION ALL

SELECT 
    'Recovery Time Objective (RTO)',
    '< 120 minutes',
    ROUND(avg_rto_minutes, 2)::TEXT || ' minutes',
    CASE 
        WHEN avg_rto_minutes <= 120 THEN 'GREEN'
        WHEN avg_rto_minutes <= 150 THEN 'AMBER'
        ELSE 'RED'
    END
FROM kri_current_status

UNION ALL

SELECT 
    'Recovery Point Objective (RPO)',
    '<= 5 minutes',
    ROUND(avg_rpo_minutes, 2)::TEXT || ' minutes',
    CASE 
        WHEN avg_rpo_minutes <= 5 THEN 'GREEN'
        WHEN avg_rpo_minutes <= 10 THEN 'AMBER'
        ELSE 'RED'
    END
FROM kri_current_status

UNION ALL

SELECT 
    'DR Testing',
    '2 successful tests/year',
    dr_tests_completed_this_year::TEXT || '/2',
    CASE 
        WHEN dr_tests_completed_this_year >= 2 THEN 'GREEN'
        WHEN dr_tests_completed_this_year >= 1 THEN 'AMBER'
        ELSE 'RED'
    END
FROM kri_current_status

UNION ALL

SELECT 
    '2FA Compliance',
    '100%',
    ROUND(two_fa_compliance, 2)::TEXT || '%',
    CASE 
        WHEN two_fa_compliance = 100 THEN 'GREEN'
        WHEN two_fa_compliance >= 99 THEN 'AMBER'
        ELSE 'RED'
    END
FROM kri_current_status;

-- Function: Record system availability
CREATE OR REPLACE FUNCTION record_availability_metric(
    p_system_name VARCHAR,
    p_is_available BOOLEAN,
    p_downtime_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_metric_id UUID;
BEGIN
    INSERT INTO system_availability_metrics (
        system_name,
        system_type,
        system_category,
        is_available,
        downtime_reason
    ) VALUES (
        p_system_name,
        'CRITICAL', -- Adjust based on your system classification
        'RETAIL_PAYMENT',
        p_is_available,
        p_downtime_reason
    )
    RETURNING id INTO v_metric_id;
    
    RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if quarterly board report is due
CREATE OR REPLACE FUNCTION check_quarterly_report_due()
RETURNS TABLE (
    quarter_name VARCHAR,
    due_date DATE,
    days_until_due INTEGER,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        brs.report_quarter,
        brs.period_end_date + INTERVAL '14 days' AS due_date,
        (brs.period_end_date + INTERVAL '14 days' - CURRENT_DATE)::INTEGER as days_until_due,
        CASE 
            WHEN brs.report_status = 'COMPLETED' THEN 'COMPLETED'
            WHEN CURRENT_DATE > brs.period_end_date + INTERVAL '14 days' THEN 'OVERDUE'
            WHEN CURRENT_DATE > brs.period_end_date THEN 'DUE_SOON'
            ELSE 'UPCOMING'
        END as status
    FROM board_reporting_schedule brs
    WHERE brs.report_year = EXTRACT(YEAR FROM CURRENT_DATE)
    ORDER BY brs.quarter;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE system_availability_metrics IS 'Track system uptime - PSD-12 Section 13 KRI: 99.9% uptime';
COMMENT ON TABLE recovery_metrics IS 'Track RTO and RPO - PSD-12 Section 13: RTO < 2 hours, RPO <= 5 minutes';
COMMENT ON TABLE dr_testing_schedule IS 'DR testing schedule - PSD-12 Section 13: 2 successful tests per year';
COMMENT ON TABLE penetration_testing_schedule IS 'Penetration testing - PSD-12 Section 11.3: Every 3 years for critical systems';
COMMENT ON TABLE board_reporting_schedule IS 'Board reporting - PSD-12 Section 9.4: 4 times per year';
