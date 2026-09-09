interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money {
  private constructor(
    private readonly props: MoneyProps
  ) {}

  static create(amount: number, currency: string): Money {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("Money amount must be a non-negative number");
    }

    const normalizedCurrency = currency.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      throw new Error("Currency must be a valid ISO 4217 code");
    }

    return new Money({
      amount,
      currency: normalizedCurrency
    });
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  equals(other: Money): boolean {
    return (
      this.amount === other.amount &&
      this.currency === other.currency
    );
  }
}