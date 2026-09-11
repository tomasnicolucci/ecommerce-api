import { describe, expect, it } from "vitest";
import { ProductAttributeValidator } from "../../../modules/catalog/domain/services/product-attribute-validator.js";
import type { AttributeDefinition } from "../../../modules/catalog/domain/types/attribute-definition.js";

const definitions: AttributeDefinition[] = [
  {
    name: "processor",
    type: "string",
    scope: "product",
    required: true
  },
  {
    name: "screenSize",
    type: "number",
    scope: "product",
    required: false
  },
  {
    name: "ram",
    type: "select",
    scope: "variant",
    required: true,
    options: ["8GB", "16GB", "32GB"]
  }
];

describe("ProductAttributeValidator", () => {
  it("should validate correct attributes", () => {
    expect(() =>
      ProductAttributeValidator.validate(
        {
          processor: "Ryzen 7",
          screenSize: 14
        },
        definitions.filter(
          (definition) => definition.scope === "product"
        )
      )
    ).not.toThrow();
  });

  it("should reject an unknown attribute", () => {
    expect(() =>
      ProductAttributeValidator.validate(
        {
          processor: "Ryzen 7",
          color: "black"
        },
        definitions.filter(
          (definition) => definition.scope === "product"
        )
      )
    ).toThrow('Attribute "color" is not allowed');
  });

  it("should reject a missing required attribute", () => {
    expect(() =>
      ProductAttributeValidator.validate(
        {},
        definitions.filter(
          (definition) => definition.scope === "product"
        )
      )
    ).toThrow('Attribute "processor" is required');
  });

  it("should reject an invalid attribute type", () => {
    expect(() =>
      ProductAttributeValidator.validate(
        {
          processor: 123
        },
        definitions.filter(
          (definition) => definition.scope === "product"
        )
      )
    ).toThrow(
      'Attribute "processor" must be of type string'
    );
  });

  it("should reject an invalid select option", () => {
    expect(() =>
      ProductAttributeValidator.validate(
        {
          ram: "64GB"
        },
        definitions.filter(
          (definition) => definition.scope === "variant"
        )
      )
    ).toThrow(
      'Attribute "ram" has an invalid option'
    );
  });

  it("should validate variant attributes", () => {
    expect(() =>
      ProductAttributeValidator.validate(
        {
          ram: "16GB"
        },
        definitions.filter(
          (definition) => definition.scope === "variant"
        )
      )
    ).not.toThrow();
  });
});