import mongoose, { Schema } from "mongoose";

const moneySchema = new Schema(
  {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true
    }
  },
  {
    _id: false
  }
);

const productVariantSchema = new Schema(
  {
    sku: {
      type: String,
      required: true
    },
    attributes: {
      type: Schema.Types.Mixed,
      required: true,
      default: {}
    },
    price: {
      type: moneySchema,
      required: true
    },
    active: {
      type: Boolean,
      required: true,
      default: true
    }
  }
);

const productSchema = new Schema(
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
    description: {
      type: String,
      required: true
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    attributes: {
      type: Schema.Types.Mixed,
      required: true,
      default: {}
    },
    variants: {
      type: [productVariantSchema],
      required: true,
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

productSchema.index(
  {
    "variants.sku": 1
  },
  {
    unique: true
  }
);

export const ProductModel =
  mongoose.models.Product ??
  mongoose.model("Product", productSchema);