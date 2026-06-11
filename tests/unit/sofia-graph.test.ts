/**
 * Sofia Graph Tests
 * 
 * Tests for LangGraph-based tool-calling workflow
 */

import { describe, it, expect } from 'vitest';
import { executeSofiaGraph } from '@/lib/workflows/sofia-graph';

describe('Sofia Graph', () => {
  describe('Tool Orchestration', () => {
    it('should execute graph with simple message', async () => {
      const result = await executeSofiaGraph(
        'Hello, how can you help me?',
        {
          sessionId: 'test-graph-123',
          tenantId: process.env.HUB_TENANT_ID!,
        }
      );
      
      expect(result.response).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.graphExecution).toBe(true);
    });
    
    it('should handle knowledge base queries', async () => {
      const result = await executeSofiaGraph(
        'What facilities do you have?',
        {
          sessionId: 'test-graph-456',
          tenantId: process.env.HUB_TENANT_ID!,
          propertyId: process.env.DEFAULT_PROPERTY_ID,
        }
      );
      
      expect(result.response).toBeTruthy();
      expect(result.metadata.graphExecution).toBe(true);
    });
    
    it('should handle availability checks', async () => {
      const result = await executeSofiaGraph(
        'Do you have rooms available for next week?',
        {
          sessionId: 'test-graph-789',
          tenantId: process.env.HUB_TENANT_ID!,
          propertyId: process.env.DEFAULT_PROPERTY_ID,
        }
      );
      
      expect(result.response).toBeTruthy();
    });
    
    it('should handle menu queries', async () => {
      const result = await executeSofiaGraph(
        'What food do you serve?',
        {
          sessionId: 'test-graph-012',
          tenantId: process.env.HUB_TENANT_ID!,
          propertyId: process.env.DEFAULT_PROPERTY_ID,
        }
      );
      
      expect(result.response).toBeTruthy();
    });
    
    it('should handle errors gracefully', async () => {
      const result = await executeSofiaGraph(
        'test',
        {
          sessionId: 'invalid',
          tenantId: 'invalid',
        }
      );
      
      expect(result.response).toBeTruthy();
      expect(result.confidence).toBeLessThanOrEqual(0.5);
      expect(result.metadata.graphExecution).toBeDefined();
    });
  });
  
  describe('Context Handling', () => {
    it('should use property context when provided', async () => {
      const result = await executeSofiaGraph(
        'Tell me about amenities',
        {
          sessionId: 'test-context-123',
          tenantId: process.env.HUB_TENANT_ID!,
          propertyId: process.env.DEFAULT_PROPERTY_ID,
        }
      );
      
      expect(result.response).toBeTruthy();
    });
    
    it('should work without property context', async () => {
      const result = await executeSofiaGraph(
        'General question about services',
        {
          sessionId: 'test-context-456',
          tenantId: process.env.HUB_TENANT_ID!,
        }
      );
      
      expect(result.response).toBeTruthy();
    });
  });
});
