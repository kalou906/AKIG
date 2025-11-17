export class PaymentCreatedEvent {
  constructor(public readonly paymentId: string) {}
}

export class PaymentCompletedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly amount: number,
    public readonly tenantId: string,
  ) {}
}

export class PaymentFailedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly reason: string,
    public readonly method: string,
  ) {}
}
