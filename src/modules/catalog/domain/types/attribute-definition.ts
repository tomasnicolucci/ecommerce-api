export type AttributeType =
  | "string"
  | "number"
  | "boolean"
  | "select";

export interface AttributeDefinition {
  name: string;
  type: AttributeType;
  required: boolean;
  options?: string[];
}