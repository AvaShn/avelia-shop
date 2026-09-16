import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

const orderTransitions: Readonly<Record<OrderStatus, readonly OrderStatus[]>> =
  {
    PENDING_PAYMENT: ["WAITING_REVIEW", "REJECTED"],
    WAITING_REVIEW: ["PAID", "REJECTED"],
    PAID: [],
    REJECTED: [],
  };

const paymentTransitions: Readonly<
  Record<PaymentStatus, readonly PaymentStatus[]>
> = {
  PENDING: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

export function canTransitionOrder(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return orderTransitions[from].includes(to);
}

export function canTransitionPayment(
  from: PaymentStatus,
  to: PaymentStatus,
): boolean {
  return paymentTransitions[from].includes(to);
}

export function assertOrderTransition(from: OrderStatus, to: OrderStatus) {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`INVALID_ORDER_TRANSITION:${from}:${to}`);
  }
}

export function assertPaymentTransition(
  from: PaymentStatus,
  to: PaymentStatus,
) {
  if (!canTransitionPayment(from, to)) {
    throw new Error(`INVALID_PAYMENT_TRANSITION:${from}:${to}`);
  }
}
