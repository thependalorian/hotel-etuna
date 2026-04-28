/**
 * Reusable LangGraph lifecycle validator (status → status)
 *
 * Purpose: One StateGraph factory for any finite state machine defined by a transition map
 * Location: /lib/workflows/genericLifecycleGraph.ts
 */

import { Annotation, StateGraph } from '@langchain/langgraph';
import { normalizeWorkflowStatus } from '@/lib/workflows/domainTransitions';

export const LifecycleTransitionState = Annotation.Root({
  /** e.g. booking | restaurant_order | consumer_rights | cyber_incident */
  domain: Annotation<string>,
  currentStatus: Annotation<string>,
  targetStatus: Annotation<string>,
  errorMessage: Annotation<string | undefined>,
  resolvedStatus: Annotation<string | undefined>,
  workflowStage: Annotation<string | undefined>,
});

export type LifecycleTransitionStateType = typeof LifecycleTransitionState.State;

function compileValidateNode(allowed: Record<string, string[]>) {
  return function validateTransition(
    state: LifecycleTransitionStateType
  ): Partial<LifecycleTransitionStateType> {
    const cur = normalizeWorkflowStatus(state.currentStatus);
    const tgt = normalizeWorkflowStatus(state.targetStatus);
    const outs = allowed[cur];
    if (!outs || !outs.includes(tgt)) {
      const hint = outs?.length ? outs.join(', ') : 'terminal — no exits';
      return {
        errorMessage: `Invalid transition: ${cur} → ${tgt}. Allowed: ${hint}`,
        workflowStage: 'invalid_transition',
        resolvedStatus: undefined,
      };
    }
    return {
      errorMessage: undefined,
      resolvedStatus: tgt,
      workflowStage: 'transition_ok',
    };
  };
}

/**
 * Build a compiled graph for the given adjacency map (mutations not supported; compile per domain).
 */
export function compileLifecycleTransitionGraph(allowed: Record<string, string[]>) {
  const validate = compileValidateNode(allowed);
  return new StateGraph(LifecycleTransitionState)
    .addNode('validate', validate)
    .addEdge('__start__', 'validate')
    .addEdge('validate', '__end__')
    .compile();
}

/** Cached graphs per reference-equal map is error-prone; cache by domain name */
const cache = new Map<string, ReturnType<typeof compileLifecycleTransitionGraph>>();

export function getLifecycleGraph(
  domainKey: string,
  allowed: Record<string, string[]>
): ReturnType<typeof compileLifecycleTransitionGraph> {
  const hit = cache.get(domainKey);
  if (hit) return hit;
  const g = compileLifecycleTransitionGraph(allowed);
  cache.set(domainKey, g);
  return g;
}

/** Single invoke — use from services to avoid duplicating graph wiring */
export async function invokeLifecycleTransition(
  domainKey: string,
  allowed: Record<string, string[]>,
  currentStatus: string,
  targetStatus: string
): Promise<LifecycleTransitionStateType> {
  const graph = getLifecycleGraph(domainKey, allowed);
  return graph.invoke({
    domain: domainKey,
    currentStatus,
    targetStatus,
  });
}
