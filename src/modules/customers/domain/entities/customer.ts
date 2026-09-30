interface CustomerProps {
  userId: string;
  firstName: string | null;
  lastName: string | null;
}

export class Customer {
  private constructor(
    public readonly id: string | null,
    private props: CustomerProps
  ) {}

  static create(props: CustomerProps): Customer {
    if (!props.userId.trim()) {
      throw new Error("User id is required");
    }

    return new Customer(null, props);
  }

  static restore(
    id: string,
    props: CustomerProps
  ): Customer {
    return new Customer(id, props);
  }

  get userId(): string {
    return this.props.userId;
  }

  get firstName(): string | null {
    return this.props.firstName;
  }

  get lastName(): string | null {
    return this.props.lastName;
  }

  updateProfile(
    firstName: string | null,
    lastName: string | null
  ): void {
    this.props.firstName = firstName;
    this.props.lastName = lastName;
  }
}