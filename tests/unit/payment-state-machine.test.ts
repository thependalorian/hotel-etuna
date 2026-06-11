/**
 * Payment FSM unit tests — valid transitions and session mapping.
 * Location: tests/unit/payment-state-machine.test.ts
 */

import { describe, expect, it } from 'vitest';
import {
  InvalidStateTransitionError,
  PaymentState,
  PaymentStateMachine,
  assertPaymentSessionTransition,
  mapPaymentSessionToFsm,
} from '@/lib/services/payment/paymentStateMachine';

describe('PaymentStateMachine', () => {
  it('allows the happy-path chain to SUCCESS', () => {
    expect(() => {
      PaymentStateMachine.validateTransition(PaymentState.INITIATED, PaymentState.AUTHENTICATED);
      PaymentStateMachine.validateTransition(PaymentState.AUTHENTICATED, PaymentState.PROCESSING);
      PaymentStateMachine.validateTransition(PaymentState.PROCESSING, PaymentState.SUCCESS);
    }).not.toThrow();
  });

  it('rejects transitions from terminal SUCCESS', () => {
    expect(() =>
      PaymentStateMachine.validateTransition(PaymentState.SUCCESS, PaymentState.FAILURE),
    ).toThrow(InvalidStateTransitionError);
  });

  it('rejects invalid skip from INITIATED to SUCCESS', () => {
    expect(PaymentStateMachine.isValidTransition(PaymentState.INITIATED, PaymentState.SUCCESS)).toBe(
      false,
    );
  });

  it('assertReachableSuccess permits INITIATED and PROCESSING sources', () => {
    expect(() => PaymentStateMachine.assertReachableSuccess(PaymentState.INITIATED)).not.toThrow();
    expect(() => PaymentStateMachine.assertReachableSuccess(PaymentState.PROCESSING)).not.toThrow();
    expect(() => PaymentStateMachine.assertReachableSuccess(PaymentState.SUCCESS)).not.toThrow();
  });

  it('assertReachableSuccess rejects FAILURE', () => {
    expect(() => PaymentStateMachine.assertReachableSuccess(PaymentState.FAILURE)).toThrow(
      InvalidStateTransitionError,
    );
  });
});

describe('mapPaymentSessionToFsm', () => {
  it('maps pending without gateway ref to INITIATED', () => {
    expect(mapPaymentSessionToFsm('pending', false)).toBe(PaymentState.INITIATED);
  });

  it('maps pending with gateway ref to PROCESSING', () => {
    expect(mapPaymentSessionToFsm('pending', true)).toBe(PaymentState.PROCESSING);
  });

  it('assertPaymentSessionTransition validates failure from pending', () => {
    expect(() => assertPaymentSessionTransition('pending', false, 'failed')).not.toThrow();
  });

  it('assertPaymentSessionTransition validates success from processing', () => {
    expect(() => assertPaymentSessionTransition('pending', true, 'success')).not.toThrow();
  });
});
