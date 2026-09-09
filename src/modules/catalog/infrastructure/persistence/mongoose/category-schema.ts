import { Schema, model, type Types } from "mongoose";
import type { AttributeDefinition } from "../../../domain/types/attribute-definition.js";

export interface CategoryDocument {
  name: string;
  slug: string;
  parentId: Types.ObjectId | null;
  attributes: AttributeDefinition[];
  active: boolean;
}

const attributeDefinitionSchema = new Schema<AttributeDefinition>(
  {
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ["string", "number", "boolean", "select"]
    },
    scope: {
      type: String,
      required: true,
      enum: ["product", "variant"]
    },
    required: {
      type: Boolean,
      required: true
    },
    options: {
      type: [String],
      required: false
    }
  },
  {
    _id: false
  }
);

const categorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true,
      unique: true
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null
    },
    attributes: {
      type: [attributeDefinitionSchema],
      default: []
    },
    active: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const CategoryModel = model<CategoryDocument>(
  "Category",
  categorySchema
);