import type { AttributeDefinition } from "../types/attribute-definition.js";

interface CategoryProps {
  name: string;
  slug: string;
  parentId: string | null;
  attributes: AttributeDefinition[];
  active: boolean;
}

export class Category {
  private constructor(
    public readonly id: string | null,
    private props: CategoryProps
  ) {}

  static create(props: CategoryProps): Category {
    if (!props.name.trim()) {
      throw new Error("Category name is required");
    }

    if (!props.slug.trim()) {
      throw new Error("Category slug is required");
    }

    return new Category(null, props);
  }

  static restore(id: string, props: CategoryProps): Category {
    return new Category(id, props);
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get parentId(): string | null {
    return this.props.parentId;
  }

  get attributes(): AttributeDefinition[] {
    return [...this.props.attributes];
  }

  get active(): boolean {
    return this.props.active;
  }

  rename(name: string): void {
    if (!name.trim()) {
      throw new Error("Category name is required");
    }

    this.props.name = name;
  }

  changeParent(parentId: string | null): void {
    if (parentId === this.id) {
      throw new Error("Category cannot be its own parent");
    }

    this.props.parentId = parentId;
  }

  changeAttributes(attributes: AttributeDefinition[]): void {
    this.props.attributes = attributes;
  }

  activate(): void {
    this.props.active = true;
  }

  deactivate(): void {
    this.props.active = false;
  }

  changeSlug(slug: string): void {
    if (!slug.trim()) {
      throw new Error("Category slug is required");
    }

    this.props.slug = slug;
  }
}