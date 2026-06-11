/**
 * Payment lifecycle finite state machine for Hotel Etuna card / gateway flows.
 *
 * Purpose: Enforce deterministic payment session transitions before persisting status.
 * Location: lib/services/payment/paymentStateMachine.ts
 *
 * States: INITIATED → AUTHENTICATED → PROCESSING → SUCCESS | FAILURE
 */

export enum PaymentState {
  INITIATED = 'INITIATED',
  AUTHENTICATED = 'AUTHENTICATED',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

const VALID_TRANSITIONS: ReadonlyMap<PaymentState, ReadonlySet<PaymentState>> = new Map([
  [
    PaymentState.INITIATED,
    new Set<PaymentState>([PaymentState.AUTHENTICATED, PaymentState.FAILURE]),
  ],
  [
    PaymentState.AUTHENTICATED,
    new Set<PaymentState>([PaymentState.PROCESSING, PaymentState.FAILURE]),
  ],
  [
    PaymentState.PROCESSING,
    new Set<PaymentState>([PaymentState.SUCCESS, PaymentState.FAILURE]),
  ],
  [PaymentState.SUCCESS, new Set<PaymentState>()],
  [PaymentState.FAILURE, new Set<PaymentState>()],
]);

export class InvalidStateTransitionError extends Error {
  constructor(
    public readonly from: PaymentState,
    public readonly to: PaymentState,
  ) {
    const valid = PaymentStateMachine.getValidNextStates(from);
    super(
      `Invalid payment state transition: ${from} -> ${to}. Valid next: ${
        valid.length ? valid.join(', ') : 'none (terminal)'
      }`,
    );
    this.name = 'InvalidStateTransitionError';
  }
}

export function isTerminalPaymentState(
  state: PaymentState,
): state is PaymentState.SUCCESS | PaymentState.FAILURE {
  return state === PaymentState.SUCCESS || state === PaymentState.FAILURE;
}

export class PaymentStateMachine {
  static isValidTransition(from: PaymentState, to: PaymentState): boolean {
    if (isTerminalPaymentState(from)) {
      return false;
    }
    return VALID_TRANSITIONS.get(from)?.has(to) ?? false;
  }

  static validateTransition(from: PaymentState, to: PaymentState): void {
    if (!this.isValidTransition(from, to)) {
      throw new InvalidStateTransitionError(from, to);
    }
  }

  static getValidNextStates(from: PaymentState): PaymentState[] {
    const next = VALID_TRANSITIONS.get(from);
    return next ? Array.from(next) : [];
  }

  static isTerminalState(state: PaymentState): boolean {
    return (VALID_TRANSITIONS.get(state)?.size ?? 0) === 0;
  }

  /**
   * Verify a multi-hop path to SUCCESS exists from the current state.
   * Used when gateway completion may skip intermediate persisted states.
   */
  static assertReachableSuccess(from: PaymentState): void {
    if (from === PaymentState.SUCCESS) {
      return;
    }
    if (from === PaymentState.FAILURE) {
      throw new InvalidStateTransitionError(from, PaymentState.SUCCESS);
    }
    if (from === PaymentState.PROCESSING) {
      this.validateTransition(from, PaymentState.SUCCESS);
      return;
    }
    if (from === PaymentState.AUTHENTICATED) {
      this.validateTransition(from, PaymentState.PROCESSING);
      this.validateTransition(PaymentState.PROCESSING, PaymentState.SUCCESS);
      return;
    }
    this.validateTransition(from, PaymentState.AUTHENTICATED);
    this.validateTransition(PaymentState.AUTHENTICATED, PaymentState.PROCESSING);
    this.validateTransition(PaymentState.PROCESSING, PaymentState.SUCCESS);
  }
}

/** Map persisted payment_sessions.status (+ gateway metadata) to FSM state. */
export function mapPaymentSessionToFsm(
  status: string,
  hasGatewayTransaction: boolean,
): PaymentState {
  if (status === 'success') {
    return PaymentState.SUCCESS;
  }
  if (status === 'failed') {
    return PaymentState.FAILURE;
  }
  if (hasGatewayTransaction) {
    return PaymentState.PROCESSING;
  }
  return PaymentState.INITIATED;
}

export function assertPaymentSessionTransition(
  currentStatus: string,
  hasGatewayTransaction: boolean,
  target: 'success' | 'failed',
): void {
  const from = mapPaymentSessionToFsm(currentStatus, hasGatewayTransaction);
  if (target === 'failed') {
    if (from === PaymentState.SUCCESS) {
      throw new InvalidStateTransitionError(from, PaymentState.FAILURE);
    }
    if (from === PaymentState.FAILURE) {
      return;
    }
    PaymentStateMachine.validateTransition(from, PaymentState.FAILURE);
    return;
  }
  PaymentStateMachine.assertReachableSuccess(from);
}
