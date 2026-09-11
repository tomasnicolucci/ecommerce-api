import type { AttributeDefinition } from "../types/attribute-definition.js";
import type {
  AttributeValue,
  ProductAttributes
} from "../types/product-attributes.js";

export class ProductAttributeValidator {
  static validate(
    attributes: ProductAttributes,
    definitions: AttributeDefinition[]
  ): void {
    const attributeNames = Object.keys(attributes);

    for (const name of attributeNames) {
      const definition = definitions.find(
        (currentDefinition) => currentDefinition.name === name
      );

      if (!definition) {
        throw new Error(`Attribute "${name}" is not allowed`);
      }

      this.validateValue(attributes[name], definition);
    }

    for (const definition of definitions) {
      if (
        definition.required &&
        attributes[definition.name] === undefined
      ) {
        throw new Error(
          `Attribute "${definition.name}" is required`
        );
      }
    }
  }

  private static validateValue(
    value: AttributeValue | undefined,
    definition: AttributeDefinition
  ): void {
    if (value === undefined) {
      return;
    }

    if (
      definition.type !== "select" &&
      typeof value !== definition.type
    ) {
      throw new Error(
        `Attribute "${definition.name}" must be of type ${definition.type}`
      );
    }

    if (definition.type === "select") {
      if (
        typeof value !== "string" ||
        !definition.options?.includes(value)
      ) {
        throw new Error(
          `Attribute "${definition.name}" has an invalid option`
        );
      }
    }
  }
}