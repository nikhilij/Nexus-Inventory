// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
         trim: true,
      },
      description: {
         type: String,
         trim: true,
      },
      sku: {
         type: String,
         required: true,
         unique: true,
         trim: true,
         uppercase: true,
      },
      barcode: {
         type: String,
         trim: true,
      },
      category: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Category",
         required: true,
      },
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      supplier: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Supplier",
      },
      tags: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tag",
         },
      ],
      pricing: {
         costPrice: {
            type: Number,
            required: true,
            min: 0,
         },
         sellingPrice: {
            type: Number,
            required: true,
            min: 0,
         },
         wholesalePrice: {
            type: Number,
            min: 0,
         },
         retailPrice: {
            type: Number,
            min: 0,
         },
         currency: {
            type: String,
            default: "USD",
            trim: true,
         },
      },
      inventory: {
         minimumStock: {
            type: Number,
            default: 0,
            min: 0,
         },
         maximumStock: {
            type: Number,
            min: 0,
         },
         reorderPoint: {
            type: Number,
            default: 0,
            min: 0,
         },
         currentStock: {
            type: Number,
            default: 0,
            min: 0,
         },
      },
      dimensions: {
         length: Number,
         width: Number,
         height: Number,
         weight: Number,
         unit: {
            type: String,
            enum: ["cm", "in", "mm", "m", "kg", "g", "lb", "oz"],
            default: "cm",
         },
      },
      images: [
         {
            url: {
               type: String,
               required: true,
            },
            alt: String,
            isPrimary: {
               type: Boolean,
               default: false,
            },
         },
      ],
      attributes: [
         {
            name: {
               type: String,
               required: true,
               trim: true,
            },
            value: {
               type: String,
               required: true,
               trim: true,
            },
         },
      ],
      variants: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductVariant",
         },
      ],
      status: {
         type: String,
         enum: ["active", "inactive", "discontinued", "out_of_stock"],
         default: "active",
      },
      isTrackable: {
         type: Boolean,
         default: true,
      },
      isSellable: {
         type: Boolean,
         default: true,
      },
      taxRate: {
         type: Number,
         default: 0,
         min: 0,
         max: 100,
      },
      notes: String,
      createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      updatedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes
productSchema.index({ sku: 1 });
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ organization: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ status: 1 });
productSchema.index({ "inventory.currentStock": 1 });
productSchema.index({ createdAt: -1 });

// Compound indexes
productSchema.index({ organization: 1, sku: 1 }, { unique: true });
productSchema.index({ organization: 1, category: 1 });
productSchema.index({ organization: 1, status: 1 });

// Virtuals
productSchema.virtual("profitMargin").get(function () {
   if (this.pricing.costPrice && this.pricing.sellingPrice) {
      return ((this.pricing.sellingPrice - this.pricing.costPrice) / this.pricing.costPrice) * 100;
   }
   return 0;
});

productSchema.virtual("isLowStock").get(function () {
   return this.inventory.currentStock <= this.inventory.minimumStock;
});

productSchema.virtual("isOutOfStock").get(function () {
   return this.inventory.currentStock <= 0;
});

productSchema.virtual("primaryImage").get(function () {
   return this.images.find((img) => img.isPrimary) || this.images[0];
});

// Instance methods
productSchema.methods.updateStock = function (quantity, operation = "add") {
   if (operation === "add") {
      this.inventory.currentStock += quantity;
   } else if (operation === "subtract") {
      this.inventory.currentStock = Math.max(0, this.inventory.currentStock - quantity);
   } else if (operation === "set") {
      this.inventory.currentStock = Math.max(0, quantity);
   }
   return this.save();
};

productSchema.methods.addVariant = function (variantId) {
   if (!this.variants.includes(variantId)) {
      this.variants.push(variantId);
   }
   return this.save();
};

productSchema.methods.removeVariant = function (variantId) {
   this.variants = this.variants.filter((id) => !id.equals(variantId));
   return this.save();
};

// Static methods
productSchema.statics.findBySKU = function (sku, organizationId) {
   return this.findOne({ sku: sku.toUpperCase(), organization: organizationId });
};

productSchema.statics.findByCategory = function (categoryId, organizationId) {
   return this.find({ category: categoryId, organization: organizationId });
};

productSchema.statics.findLowStock = function (organizationId) {
   return this.find({
      organization: organizationId,
      "inventory.currentStock": { $lte: "$inventory.minimumStock" },
      status: "active",
   });
};

productSchema.statics.findOutOfStock = function (organizationId) {
   return this.find({
      organization: organizationId,
      "inventory.currentStock": { $lte: 0 },
      status: "active",
   });
};

productSchema.statics.findByOrganization = function (organizationId, filters = {}) {
   const query = { organization: organizationId, ...filters };
   return this.find(query).populate("category supplier tags");
};

const Product = mongoose.model("Product", productSchema);

export default Product;
