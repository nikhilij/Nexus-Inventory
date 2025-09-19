// models/ProductVariant.js
import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
   {
      product: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Product",
         required: true,
      },
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      name: {
         type: String,
         required: true,
         trim: true,
         maxlength: 100,
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
      pricing: {
         costPrice: {
            type: Number,
            min: 0,
         },
         sellingPrice: {
            type: Number,
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
         currentStock: {
            type: Number,
            default: 0,
            min: 0,
         },
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
      isActive: {
         type: Boolean,
         default: true,
      },
      isDefault: {
         type: Boolean,
         default: false,
      },
      sortOrder: {
         type: Number,
         default: 0,
      },
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
productVariantSchema.index({ sku: 1 });
productVariantSchema.index({ product: 1 });
productVariantSchema.index({ organization: 1 });
productVariantSchema.index({ isActive: 1 });
productVariantSchema.index({ isDefault: 1 });
productVariantSchema.index({ sortOrder: 1 });

// Compound indexes
productVariantSchema.index({ product: 1, sku: 1 }, { unique: true });
productVariantSchema.index({ organization: 1, product: 1 });
productVariantSchema.index({ organization: 1, isActive: 1 });

// Virtuals
productVariantSchema.virtual("profitMargin").get(function () {
   if (this.pricing.costPrice && this.pricing.sellingPrice) {
      return ((this.pricing.sellingPrice - this.pricing.costPrice) / this.pricing.costPrice) * 100;
   }
   return 0;
});

productVariantSchema.virtual("isLowStock").get(function () {
   return this.inventory.currentStock <= this.inventory.minimumStock;
});

productVariantSchema.virtual("isOutOfStock").get(function () {
   return this.inventory.currentStock <= 0;
});

productVariantSchema.virtual("primaryImage").get(function () {
   return this.images.find((img) => img.isPrimary) || this.images[0];
});

productVariantSchema.virtual("attributeString").get(function () {
   return this.attributes.map((attr) => `${attr.name}: ${attr.value}`).join(", ");
});

// Instance methods
productVariantSchema.methods.updateStock = function (quantity, operation = "set") {
   if (operation === "add") {
      this.inventory.currentStock += quantity;
   } else if (operation === "subtract") {
      this.inventory.currentStock = Math.max(0, this.inventory.currentStock - quantity);
   } else if (operation === "set") {
      this.inventory.currentStock = Math.max(0, quantity);
   }
   return this.save();
};

productVariantSchema.methods.setAsDefault = function () {
   // First, unset all other variants as default for this product
   return mongoose
      .model("ProductVariant")
      .updateMany({ product: this.product, _id: { $ne: this._id } }, { isDefault: false })
      .then(() => {
         this.isDefault = true;
         return this.save();
      });
};

productVariantSchema.methods.getAttributeValue = function (attributeName) {
   const attribute = this.attributes.find((attr) => attr.name === attributeName);
   return attribute ? attribute.value : null;
};

productVariantSchema.methods.addAttribute = function (name, value) {
   const existingAttr = this.attributes.find((attr) => attr.name === name);
   if (existingAttr) {
      existingAttr.value = value;
   } else {
      this.attributes.push({ name, value });
   }
   return this.save();
};

productVariantSchema.methods.removeAttribute = function (attributeName) {
   this.attributes = this.attributes.filter((attr) => attr.name !== attributeName);
   return this.save();
};

// Static methods
productVariantSchema.statics.findBySKU = function (sku, organizationId) {
   return this.findOne({ sku: sku.toUpperCase(), organization: organizationId });
};

productVariantSchema.statics.findByProduct = function (productId, organizationId) {
   return this.find({
      product: productId,
      organization: organizationId,
      isActive: true,
   }).sort({ sortOrder: 1, name: 1 });
};

productVariantSchema.statics.findDefaultVariant = function (productId) {
   return this.findOne({
      product: productId,
      isDefault: true,
      isActive: true,
   });
};

productVariantSchema.statics.findLowStockVariants = function (organizationId) {
   return this.find({
      organization: organizationId,
      isActive: true,
      $expr: { $lte: ["$inventory.currentStock", "$inventory.minimumStock"] },
   }).populate("product", "name sku");
};

productVariantSchema.statics.findOutOfStockVariants = function (organizationId) {
   return this.find({
      organization: organizationId,
      isActive: true,
      "inventory.currentStock": { $lte: 0 },
   }).populate("product", "name sku");
};

productVariantSchema.statics.findByAttribute = function (organizationId, attributeName, attributeValue) {
   return this.find({
      organization: organizationId,
      isActive: true,
      "attributes.name": attributeName,
      "attributes.value": attributeValue,
   }).populate("product", "name sku");
};

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

export default ProductVariant;
