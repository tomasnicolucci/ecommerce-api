export type AttributeType =
  | "string"
  | "number"
  | "boolean"
  | "select";

export type AttributeScope =
  | "product"
  | "variant";

export interface AttributeDefinition {
  name: string;
  type: AttributeType;
  scope: AttributeScope;
  required: boolean;
  options?: string[];
}