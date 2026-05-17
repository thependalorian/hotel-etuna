-- Align query pattern: SofiaConciergeService.saveConversation filters by tenant_id + session_id
CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant_session
  ON ai_conversations (tenant_id, session_id);
