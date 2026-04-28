/**
 * Shared LangGraph state reducers
 *
 * Purpose: DRY list-aggregation patterns for Annotation-based workflow state
 * Location: /lib/workflows/graphReducers.ts
 */

/** Concatenate string arrays when multiple nodes append validation messages */
export const strListReducer = (left: string[], right: string[]) => [...left, ...right];
