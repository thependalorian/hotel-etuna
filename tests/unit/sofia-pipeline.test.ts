/**
 * Sofia Pipeline Service Tests
 * 
 * Tests for multi-stage AI pipeline execution
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SofiaPipelineService } from '@/lib/services/sofia/SofiaPipelineService';

describe('SofiaPipelineService', () => {
  let service: SofiaPipelineService;
  
  beforeEach(() => {
    service = new SofiaPipelineService();
  });
  
  describe('Pipeline Execution', () => {
    it('should process a simple message', async () => {
      const result = await service.process({
        message: 'Hello, I need help with booking',
        sessionId: 'test-session-123',
        tenantId: process.env.HUB_TENANT_ID!,
        channel: 'WEB',
      });
      
      expect(result.response).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.pipelineTimings).toBeDefined();
      expect(result.metadata.totalTime).toBeGreaterThan(0);
    });
    
    it('should include RAG chunks when available', async () => {
      const result = await service.process({
        message: 'What amenities does Hotel Etuna have?',
        sessionId: 'test-session-456',
        tenantId: process.env.HUB_TENANT_ID!,
        propertyId: process.env.DEFAULT_PROPERTY_ID,
        channel: 'WEB',
      });
      
      expect(result.metadata.ragChunks).toBeGreaterThanOrEqual(0);
    });
    
    it('should extract correct intent for booking', async () => {
      const result = await service.process({
        message: 'I want to book a room for next week',
        sessionId: 'test-session-789',
        tenantId: process.env.HUB_TENANT_ID!,
        channel: 'WEB',
      });
      
      expect(result.intent).toBe('booking_room');
    });
    
    it('should extract correct intent for pricing', async () => {
      const result = await service.process({
        message: 'How much does a premiere room cost?',
        sessionId: 'test-session-012',
        tenantId: process.env.HUB_TENANT_ID!,
        channel: 'WEB',
      });
      
      expect(result.intent).toBe('pricing_inquiry');
    });
    
    it('should handle errors gracefully', async () => {
      const result = await service.process({
        message: 'test',
        sessionId: 'invalid-session',
        tenantId: 'invalid-tenant',
        channel: 'WEB',
      });
      
      expect(result.response).toBeTruthy();
      expect(result.confidence).toBeLessThanOrEqual(0.5);
    });
  });
  
  describe('Stage Timings', () => {
    it('should track timing for each stage', async () => {
      const result = await service.process({
        message: 'Tell me about Hotel Etuna',
        sessionId: 'test-session-timing',
        tenantId: process.env.HUB_TENANT_ID!,
        channel: 'WEB',
      });
      
      expect(result.metadata.pipelineTimings).toBeDefined();
      expect(typeof result.metadata.totalTime).toBe('number');
      expect(result.metadata.totalTime).toBeGreaterThan(0);
    });
  });
  
  describe('Channel Handling', () => {
    it('should handle EMAIL channel', async () => {
      const result = await service.process({
        message: 'I need information about your services',
        sessionId: 'test-email-session',
        tenantId: process.env.HUB_TENANT_ID!,
        channel: 'EMAIL',
      });
      
      expect(result.response).toBeTruthy();
    });
    
    it('should handle WHATSAPP channel', async () => {
      const result = await service.process({
        message: 'Quick question about check-in time',
        sessionId: 'test-whatsapp-session',
        tenantId: process.env.HUB_TENANT_ID!,
        channel: 'WHATSAPP',
      });
      
      expect(result.response).toBeTruthy();
    });
    
    it('should handle PHONE channel with concise responses', async () => {
      const result = await service.process({
        message: 'What time is check-in?',
        sessionId: 'test-phone-session',
        tenantId: process.env.HUB_TENANT_ID!,
        channel: 'PHONE',
      });
      
      expect(result.response).toBeTruthy();
      // Phone responses should be relatively concise
      expect(result.response.length).toBeLessThan(500);
    });
  });
});
