-- ============================================================================
-- INCIDENT MANAGEMENT SCHEMA - PSD-12 Compliance
-- Purpose: Track cybersecurity incidents and compliance with reporting requirements
-- Requirements: 
--   - Section 11.13: Report incidents within 24 hours
--   - Section 11.14: Impact assessment within 1 month
--   - Section 11.15: Report financial loss, data loss, availability loss
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Incidents Table
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., INC-2026-001
    
    -- Detection
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detected_by_user_id UUID,
    detected_by_system VARCHAR(100), -- 'SIEM', 'FRAUD_DETECTION', 'USER_REPORT', 'MANUAL'
    detection_method VARCHAR(100), -- 'AUTOMATED_ALERT', 'MANUAL_INSPECTION', 'USER_COMPLAINT'
    
    -- Classification
    incident_type VARCHAR(100) NOT NULL, -- 'CYBERATTACK', 'DATA_BREACH', 'FRAUD', 'AVAILABILITY_LOSS', 'UNAUTHORIZED_ACCESS'
    incident_category VARCHAR(100) NOT NULL, -- 'PHISHING', 'MALWARE', 'DOS_ATTACK', 'INSIDER_THREAT', 'CARD_NOT_PRESENT_FRAUD', etc.
    severity VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    
    -- Status Tracking
    status VARCHAR(50) NOT NULL DEFAULT 'DETECTED', -- 'DETECTED', 'INVESTIGATING', 'CONTAINED', 'ERADICATED', 'RECOVERED', 'CLOSED'
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    
    -- Incident Description
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    affected_systems JSONB, -- Array of affected system IDs/names
    affected_users JSONB, -- Array of affected user IDs
    
    -- Attack Details
    attack_vector VARCHAR(100), -- 'EMAIL', 'WEB', 'MOBILE_APP', 'API', 'NETWORK'
    attack_source_ip INET,
    attack_source_country VARCHAR(2), -- ISO country code
    indicators_of_compromise JSONB, -- IOCs: IPs, domains, file hashes, etc.
    
    -- PSD-12 Section 11.15 - Required Loss Reporting
    financial_loss_nad DECIMAL(15,2) DEFAULT 0.00,
    financial_loss_currency VARCHAR(3) DEFAULT 'NAD',
    data_loss_description TEXT,
    data_loss_record_count INTEGER DEFAULT 0,
    data_loss_includes_pii BOOLEAN DEFAULT FALSE,
    availability_loss_minutes INTEGER DEFAULT 0, -- Downtime in minutes
    
    -- Impact Assessment (Section 11.14 - Required within 1 month)
    impact_assessment_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED'
    impact_assessment_completed_at TIMESTAMPTZ,
    impact_assessment_completed_by UUID,
    impact_assessment_document_url TEXT,
    
    -- Bank of Namibia Reporting (Section 11.13 - Within 24 hours)
    bon_notification_required BOOLEAN NOT NULL DEFAULT TRUE,
    bon_preliminary_notification_sent_at TIMESTAMPTZ,
    bon_preliminary_notification_sent_by UUID,
    bon_final_report_sent_at TIMESTAMPTZ,
    bon_final_report_sent_by UUID,
    bon_report_reference VARCHAR(100),
    
    -- Response Actions
    containment_actions JSONB, -- Array of actions taken to contain incident
    eradication_actions JSONB, -- Array of actions to eradicate threat
    recovery_actions JSONB, -- Array of recovery actions
    lessons_learned TEXT,
    
    -- Root Cause Analysis
    root_cause TEXT,
    root_cause_analysis_completed_at TIMESTAMPTZ,
    
    -- Assignment
    assigned_to_user_id UUID,
    assigned_to_team VARCHAR(100), -- 'SECURITY_OPERATIONS', 'INCIDENT_RESPONSE', 'FRAUD_TEAM'
    
    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolved_by_user_id UUID,
    resolution_summary TEXT,
    
    -- Timeline
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB,
    
    CONSTRAINT valid_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT valid_status CHECK (status IN ('DETECTED', 'INVESTIGATING', 'CONTAINED', 'ERADICATED', 'RECOVERED', 'CLOSED')),
    CONSTRAINT valid_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT valid_impact_assessment_status CHECK (impact_assessment_status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED'))
);

-- Indexes
CREATE INDEX idx_incidents_detected_at ON incidents(detected_at DESC);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incidents_bon_notification ON incidents(bon_notification_required, bon_preliminary_notification_sent_at) WHERE bon_notification_required = TRUE;
CREATE INDEX idx_incidents_impact_assessment ON incidents(impact_assessment_status) WHERE impact_assessment_status != 'COMPLETED';
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to_user_id);

-- Incident Timeline (Track all status changes and actions)
CREATE TABLE incident_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    event_type VARCHAR(100) NOT NULL, -- 'STATUS_CHANGE', 'ASSIGNMENT', 'COMMENT', 'ACTION_TAKEN', 'NOTIFICATION_SENT'
    event_description TEXT NOT NULL,
    
    old_value TEXT,
    new_value TEXT,
    
    created_by_user_id UUID,
    metadata JSONB
);

CREATE INDEX idx_incident_timeline_incident_id ON incident_timeline(incident_id);
CREATE INDEX idx_incident_timeline_timestamp ON incident_timeline(timestamp DESC);

-- Incident Notifications (Track all notifications sent)
CREATE TABLE incident_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    notification_type VARCHAR(100) NOT NULL, -- 'BON_PRELIMINARY', 'BON_FINAL', 'INTERNAL_ALERT', 'STAKEHOLDER_NOTIFICATION'
    recipient VARCHAR(255) NOT NULL,
    recipient_type VARCHAR(50) NOT NULL, -- 'BON', 'BOARD', 'MANAGEMENT', 'SECURITY_TEAM', 'AFFECTED_USER'
    
    subject VARCHAR(255),
    body TEXT,
    
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_by_user_id UUID,
    
    delivery_status VARCHAR(50) DEFAULT 'SENT', -- 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED'
    delivery_confirmed_at TIMESTAMPTZ,
    
    CONSTRAINT valid_notification_type CHECK (notification_type IN ('BON_PRELIMINARY', 'BON_FINAL', 'INTERNAL_ALERT', 'STAKEHOLDER_NOTIFICATION', 'USER_NOTIFICATION'))
);

CREATE INDEX idx_incident_notifications_incident_id ON incident_notifications(incident_id);
CREATE INDEX idx_incident_notifications_type ON incident_notifications(notification_type);
CREATE INDEX idx_incident_notifications_timestamp ON incident_notifications(timestamp DESC);

-- Incident Affected Resources (Track affected systems, users, transactions)
CREATE TABLE incident_affected_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    
    resource_type VARCHAR(100) NOT NULL, -- 'USER', 'TRANSACTION', 'SYSTEM', 'APPLICATION', 'DATABASE'
    resource_id UUID,
    resource_name VARCHAR(255),
    
    impact_description TEXT,
    recovery_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'RECOVERED'
    recovered_at TIMESTAMPTZ,
    
    CONSTRAINT valid_recovery_status CHECK (recovery_status IN ('PENDING', 'IN_PROGRESS', 'RECOVERED'))
);

CREATE INDEX idx_incident_resources_incident_id ON incident_affected_resources(incident_id);
CREATE INDEX idx_incident_resources_type ON incident_affected_resources(resource_type);
CREATE INDEX idx_incident_resources_recovery ON incident_affected_resources(recovery_status) WHERE recovery_status != 'RECOVERED';

-- Automated trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_incident_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_incident_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_incident_timestamp();

-- Automated trigger to log status changes to timeline
CREATE OR REPLACE FUNCTION log_incident_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO incident_timeline (
            incident_id,
            event_type,
            event_description,
            old_value,
            new_value
        ) VALUES (
            NEW.id,
            'STATUS_CHANGE',
            'Incident status changed from ' || OLD.status || ' to ' || NEW.status,
            OLD.status,
            NEW.status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_status_change
    AFTER UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION log_incident_status_change();

-- View: Incidents Requiring BoN Notification (Section 11.13 - 24 hour deadline)
CREATE VIEW incidents_requiring_bon_notification AS
SELECT 
    i.id,
    i.incident_number,
    i.detected_at,
    i.incident_type,
    i.severity,
    i.title,
    i.bon_preliminary_notification_sent_at,
    EXTRACT(EPOCH FROM (NOW() - i.detected_at))/3600 AS hours_since_detection,
    CASE 
        WHEN i.bon_preliminary_notification_sent_at IS NULL AND NOW() - i.detected_at > INTERVAL '24 hours' THEN 'OVERDUE'
        WHEN i.bon_preliminary_notification_sent_at IS NULL AND NOW() - i.detected_at > INTERVAL '20 hours' THEN 'URGENT'
        WHEN i.bon_preliminary_notification_sent_at IS NULL THEN 'PENDING'
        ELSE 'SENT'
    END AS notification_status
FROM incidents i
WHERE 
    i.bon_notification_required = TRUE
    AND i.status != 'CLOSED'
ORDER BY i.detected_at ASC;

-- View: Incidents Requiring Impact Assessment (Section 11.14 - 1 month deadline)
CREATE VIEW incidents_requiring_impact_assessment AS
SELECT 
    i.id,
    i.incident_number,
    i.detected_at,
    i.incident_type,
    i.severity,
    i.title,
    i.impact_assessment_status,
    i.impact_assessment_completed_at,
    EXTRACT(EPOCH FROM (NOW() - i.detected_at))/86400 AS days_since_detection,
    CASE 
        WHEN i.impact_assessment_status != 'COMPLETED' AND NOW() - i.detected_at > INTERVAL '30 days' THEN 'OVERDUE'
        WHEN i.impact_assessment_status != 'COMPLETED' AND NOW() - i.detected_at > INTERVAL '25 days' THEN 'URGENT'
        WHEN i.impact_assessment_status != 'COMPLETED' THEN 'PENDING'
        ELSE 'COMPLETED'
    END AS assessment_status
FROM incidents i
WHERE 
    i.bon_notification_required = TRUE
    AND i.status != 'CLOSED'
ORDER BY i.detected_at ASC;

-- View: Active Incidents Summary
CREATE VIEW active_incidents_summary AS
SELECT 
    i.id,
    i.incident_number,
    i.detected_at,
    i.incident_type,
    i.severity,
    i.status,
    i.title,
    i.assigned_to_user_id,
    i.financial_loss_nad,
    i.availability_loss_minutes,
    EXTRACT(EPOCH FROM (NOW() - i.detected_at))/3600 AS hours_open
FROM incidents i
WHERE i.status NOT IN ('CLOSED', 'RECOVERED')
ORDER BY 
    CASE i.severity
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
    END,
    i.detected_at ASC;

-- View: Incident Statistics by Type (for reporting)
CREATE VIEW incident_statistics_by_type AS
SELECT 
    incident_type,
    COUNT(*) as total_incidents,
    COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_count,
    COUNT(*) FILTER (WHERE severity = 'HIGH') as high_count,
    COUNT(*) FILTER (WHERE severity = 'MEDIUM') as medium_count,
    COUNT(*) FILTER (WHERE severity = 'LOW') as low_count,
    SUM(financial_loss_nad) as total_financial_loss,
    SUM(availability_loss_minutes) as total_downtime_minutes,
    AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - detected_at))/3600) as avg_resolution_hours
FROM incidents
WHERE detected_at > NOW() - INTERVAL '1 year'
GROUP BY incident_type
ORDER BY total_incidents DESC;

-- Function: Create new incident
CREATE OR REPLACE FUNCTION create_incident(
    p_title VARCHAR,
    p_description TEXT,
    p_incident_type VARCHAR,
    p_severity VARCHAR,
    p_detected_by_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_incident_id UUID;
    v_incident_number VARCHAR;
    v_year INTEGER;
    v_sequence INTEGER;
BEGIN
    -- Generate incident number (e.g., INC-2026-001)
    v_year := EXTRACT(YEAR FROM NOW());
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(incident_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO v_sequence
    FROM incidents
    WHERE incident_number LIKE 'INC-' || v_year || '-%';
    
    v_incident_number := 'INC-' || v_year || '-' || LPAD(v_sequence::TEXT, 3, '0');
    
    -- Insert incident
    INSERT INTO incidents (
        incident_number,
        title,
        description,
        incident_type,
        severity,
        detected_by_user_id,
        status
    ) VALUES (
        v_incident_number,
        p_title,
        p_description,
        p_incident_type,
        p_severity,
        p_detected_by_user_id,
        'DETECTED'
    )
    RETURNING id INTO v_incident_id;
    
    -- Log to timeline
    INSERT INTO incident_timeline (
        incident_id,
        event_type,
        event_description,
        created_by_user_id
    ) VALUES (
        v_incident_id,
        'INCIDENT_CREATED',
        'Incident created: ' || p_title,
        p_detected_by_user_id
    );
    
    RETURN v_incident_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Send BoN preliminary notification
CREATE OR REPLACE FUNCTION send_bon_preliminary_notification(
    p_incident_id UUID,
    p_sent_by_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_hours_since_detection DECIMAL;
BEGIN
    -- Check if within 24 hour window
    SELECT EXTRACT(EPOCH FROM (NOW() - detected_at))/3600
    INTO v_hours_since_detection
    FROM incidents
    WHERE id = p_incident_id;
    
    IF v_hours_since_detection > 24 THEN
        RAISE WARNING 'BoN notification sent after 24 hour deadline (%.2f hours)', v_hours_since_detection;
    END IF;
    
    -- Update incident
    UPDATE incidents
    SET 
        bon_preliminary_notification_sent_at = NOW(),
        bon_preliminary_notification_sent_by = p_sent_by_user_id
    WHERE id = p_incident_id;
    
    -- Log notification
    INSERT INTO incident_notifications (
        incident_id,
        notification_type,
        recipient,
        recipient_type,
        subject,
        sent_by_user_id
    ) VALUES (
        p_incident_id,
        'BON_PRELIMINARY',
        'Bank of Namibia - National Payment System',
        'BON',
        'Preliminary Cybersecurity Incident Notification',
        p_sent_by_user_id
    );
    
    -- Log to timeline
    INSERT INTO incident_timeline (
        incident_id,
        event_type,
        event_description,
        created_by_user_id
    ) VALUES (
        p_incident_id,
        'NOTIFICATION_SENT',
        'BoN preliminary notification sent',
        p_sent_by_user_id
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function: Complete impact assessment
CREATE OR REPLACE FUNCTION complete_impact_assessment(
    p_incident_id UUID,
    p_financial_loss DECIMAL,
    p_data_loss_description TEXT,
    p_data_loss_record_count INTEGER,
    p_availability_loss_minutes INTEGER,
    p_completed_by_user_id UUID,
    p_document_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE incidents
    SET 
        financial_loss_nad = p_financial_loss,
        data_loss_description = p_data_loss_description,
        data_loss_record_count = p_data_loss_record_count,
        availability_loss_minutes = p_availability_loss_minutes,
        impact_assessment_status = 'COMPLETED',
        impact_assessment_completed_at = NOW(),
        impact_assessment_completed_by = p_completed_by_user_id,
        impact_assessment_document_url = p_document_url
    WHERE id = p_incident_id;
    
    -- Log to timeline
    INSERT INTO incident_timeline (
        incident_id,
        event_type,
        event_description,
        created_by_user_id
    ) VALUES (
        p_incident_id,
        'IMPACT_ASSESSMENT_COMPLETED',
        'Impact assessment completed. Financial loss: NAD ' || p_financial_loss || ', Data loss: ' || p_data_loss_record_count || ' records, Downtime: ' || p_availability_loss_minutes || ' minutes',
        p_completed_by_user_id
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE incidents IS 'Cybersecurity incident tracking - PSD-12 Sections 11.13-11.15';
COMMENT ON COLUMN incidents.bon_preliminary_notification_sent_at IS 'Must be within 24 hours of detection - PSD-12 Section 11.13';
COMMENT ON COLUMN incidents.impact_assessment_completed_at IS 'Must be within 1 month of detection - PSD-12 Section 11.14';
COMMENT ON COLUMN incidents.financial_loss_nad IS 'Financial loss in Namibian Dollars - Required by PSD-12 Section 11.15';
COMMENT ON COLUMN incidents.data_loss_record_count IS 'Number of records lost/compromised - Required by PSD-12 Section 11.15';
COMMENT ON COLUMN incidents.availability_loss_minutes IS 'System downtime in minutes - Required by PSD-12 Section 11.15';
