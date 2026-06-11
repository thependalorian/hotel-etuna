/**
 * Sofia tool graph unit tests — mock tools, assert graph compiles and routes.
 *
 * Location: tests/unit/sofia-tool-graph.test.ts
 */

import { describe, it, expect, vi } from 'vitest';
import { HumanMessage } from '@langchain/core/messages';
import {
  compileSofiaToolGraph,
  createSofiaTools,
  type SofiaToolGraphDeps,
} from '@/lib/workflows/sofiaToolGraph';

const baseCtx = {
  sessionId: 'test-session',
  tenantId: '00000000-0000-4000-8000-000000000001',
  propertyId: '00000000-0000-4000-8000-000000000002',
  guestId: '00000000-0000-4000-8000-000000000003',
};

function mockDeps(overrides: Partial<SofiaToolGraphDeps> = {}): SofiaToolGraphDeps {
  return {
    ragSearch: {
      search: vi.fn().mockResolvedValue([{ text: 'Pool hours: 7am–9pm', source: 'kb' }]),
    },
    customerService: {
      getGuestProfile: vi.fn().mockResolvedValue({
        loyaltyTier: 'gold',
        loyaltyPoints: 1200,
        preferredRoomType: 'premiere',
        dietaryRestrictions: [],
        accessibilityNeeds: [],
      }),
    },
    availabilityService: {
      getAvailableRooms: vi.fn().mockResolvedValue([{ id: 'room-1' }]),
      getRoomTypeAvailability: vi.fn().mockResolvedValue([
        {
          roomType: 'premiere',
          totalRooms: 4,
          availableRooms: 2,
          occupiedRooms: 2,
          unavailableRooms: 0,
          occupancyRate: 0.5,
        },
      ]),
    },
    llmRouter: {
      chat: vi.fn().mockResolvedValue({
        content: 'We have premiere rooms available for your dates.',
        providerId: 'mock',
        model: 'mock',
        degraded: false,
        attemptedProviders: ['mock'],
      }),
    },
    ...overrides,
  };
}

describe('sofiaToolGraph', () => {
  it('creates searchRag, getGuestProfile, checkAvailability, and resendGuestDocument tools', () => {
    const tools = createSofiaTools(baseCtx, mockDeps());
    expect(tools.map((t) => t.name)).toEqual([
      'searchRag',
      'getGuestProfile',
      'checkAvailability',
      'resendGuestDocument',
    ]);
  });

  it('compiles the LangGraph StateGraph', () => {
    const graph = compileSofiaToolGraph(baseCtx, mockDeps());
    expect(graph).toBeDefined();
    expect(typeof graph.invoke).toBe('function');
  });

  it('invokes mocked tools for amenity queries', async () => {
    const deps = mockDeps();
    const graph = compileSofiaToolGraph(baseCtx, deps);

    const result = await graph.invoke({
      messages: [new HumanMessage('What amenities and pool hours do you have?')],
    });

    expect(deps.ragSearch.search).toHaveBeenCalled();
    expect(result.messages.length).toBeGreaterThan(1);
    expect(deps.llmRouter.chat).toHaveBeenCalled();
  });

  it('invokes checkAvailability when booking language is used', async () => {
    const deps = mockDeps();
    const graph = compileSofiaToolGraph(baseCtx, deps);

    await graph.invoke({
      messages: [
        new HumanMessage('Do you have rooms available from 2026-07-01 to 2026-07-05?'),
      ],
    });

    expect(deps.availabilityService.getAvailableRooms).toHaveBeenCalled();
    expect(deps.availabilityService.getRoomTypeAvailability).toHaveBeenCalled();
  });

  it('invokes getGuestProfile when guest context and loyalty keywords present', async () => {
    const deps = mockDeps();
    const graph = compileSofiaToolGraph(baseCtx, deps);

    await graph.invoke({
      messages: [new HumanMessage('What is my loyalty profile and preferences?')],
    });

    expect(deps.customerService.getGuestProfile).toHaveBeenCalledWith(
      baseCtx.guestId,
      baseCtx.tenantId
    );
  });
});
