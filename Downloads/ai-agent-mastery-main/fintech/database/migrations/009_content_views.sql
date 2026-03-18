-- Migration: Knowledge Base Content Views Tracking
-- Location: fintech/smartpay/backend/migrations/008_content_views.sql
-- Reference: PRD §4.6.3 - Educational Content System
-- Purpose: Track user interactions with educational content for analytics and personalization

-- Create content_views table
CREATE TABLE IF NOT EXISTS content_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_id VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  session_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_content_views_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
    
  -- Prevent duplicate views in the same second
  UNIQUE (user_id, content_id, viewed_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_views_user_id 
  ON content_views(user_id);

CREATE INDEX IF NOT EXISTS idx_content_views_content_id 
  ON content_views(content_id);

CREATE INDEX IF NOT EXISTS idx_content_views_viewed_at 
  ON content_views(viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_views_action 
  ON content_views(action);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_content_views_user_content 
  ON content_views(user_id, content_id, viewed_at DESC);

-- Create view for content popularity analytics
CREATE OR REPLACE VIEW content_popularity AS
SELECT 
  content_id,
  COUNT(*) as total_views,
  COUNT(DISTINCT user_id) as unique_viewers,
  MAX(viewed_at) as last_viewed,
  COUNT(*) FILTER (WHERE viewed_at >= NOW() - INTERVAL '7 days') as views_last_7_days,
  COUNT(*) FILTER (WHERE viewed_at >= NOW() - INTERVAL '30 days') as views_last_30_days
FROM content_views
WHERE action = 'view'
GROUP BY content_id
ORDER BY total_views DESC;

-- Create view for user learning progress
CREATE OR REPLACE VIEW user_learning_progress AS
SELECT 
  user_id,
  COUNT(DISTINCT content_id) as unique_contents_viewed,
  COUNT(*) as total_views,
  MAX(viewed_at) as last_learning_activity,
  COUNT(DISTINCT DATE(viewed_at)) as days_active,
  ARRAY_AGG(DISTINCT content_id ORDER BY viewed_at DESC) FILTER (WHERE viewed_at >= NOW() - INTERVAL '7 days') as recent_topics
FROM content_views
WHERE action = 'view'
GROUP BY user_id;

-- Add comments for documentation
COMMENT ON TABLE content_views IS 'Tracks user interactions with educational content for analytics and personalization';
COMMENT ON COLUMN content_views.user_id IS 'User who viewed the content';
COMMENT ON COLUMN content_views.content_id IS 'Educational content identifier (e.g., topic-wallet-basics)';
COMMENT ON COLUMN content_views.action IS 'Type of interaction (view, expand, learn_more, related_topic)';
COMMENT ON COLUMN content_views.viewed_at IS 'Timestamp of the interaction';
COMMENT ON COLUMN content_views.session_id IS 'Session ID for grouping related interactions';
COMMENT ON COLUMN content_views.metadata IS 'Additional metadata (e.g., device type, language preference, search query)';

COMMENT ON VIEW content_popularity IS 'Analytics view showing most popular educational content';
COMMENT ON VIEW user_learning_progress IS 'Analytics view showing individual user learning progress and patterns';
