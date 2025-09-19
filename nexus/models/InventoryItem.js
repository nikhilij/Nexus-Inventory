// models/InventoryItem.js
import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
   {
      product: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Product",
         required: true,
      },
      warehouse: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Warehouse",
         required: true,
      },
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      variant: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "ProductVariant",
      },
      batch: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Batch",
      },
      zone: {
         type: String,
         trim: true,
      },
      location: {
         aisle: String,
         shelf: String,
         bin: String,
         notes: String,
      },
      quantity: {
         onHand: {
            type: Number,
            default: 0,
            min: 0,
         },
         reserved: {
            type: Number,
            default: 0,
            min: 0,
         },
         available: {
            type: Number,
            default: 0,
            min: 0,
         },
         damaged: {
            type: Number,
            default: 0,
            min: 0,
         },
      },
      cost: {
         unitCost: {
            type: Number,
            min: 0,
         },
         totalCost: {
            type: Number,
            min: 0,
         },
         currency: {
            type: String,
            default: "USD",
         },
      },
      expiry: {
         date: Date,
         isExpired: {
            type: Boolean,
            default: false,
         },
         daysUntilExpiry: Number,
      },
      lastCounted: Date,
      lastMovement: Date,
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
      status: {
         type: String,
         enum: ["active", "inactive", "discontinued", "out_of_stock"],
         default: "active",
      },
      condition: {
         type: String,
         enum: ["new", "used", "refurbished", "damaged"],
         default: "new",
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
inventoryItemSchema.index({ product: 1 });
inventoryItemSchema.index({ warehouse: 1 });
inventoryItemSchema.index({ organization: 1 });
inventoryItemSchema.index({ variant: 1 });
inventoryItemSchema.index({ batch: 1 });
inventoryItemSchema.index({ status: 1 });
inventoryItemSchema.index({ "quantity.onHand": 1 });
inventoryItemSchema.index({ "expiry.date": 1 });
inventoryItemSchema.index({ lastCounted: 1 });

// Compound indexes
inventoryItemSchema.index({ product: 1, warehouse: 1 }, { unique: true });
inventoryItemSchema.index({ organization: 1, product: 1 });
inventoryItemSchema.index({ warehouse: 1, zone: 1 });
inventoryItemSchema.index({ organization: 1, status: 1 });
inventoryItemSchema.index({ "expiry.date": 1, "expiry.isExpired": 1 });

// Virtuals
inventoryItemSchema.virtual("isLowStock").get(function () {
   return this.quantity.onHand <= this.minimumStock;
});

inventoryItemSchema.virtual("isOutOfStock").get(function () {
   return this.quantity.onHand <= 0;
});

inventoryItemSchema.virtual("isExpired").get(function () {
   return this.expiry.date && this.expiry.date < new Date();
});

inventoryItemSchema.virtual("daysToExpiry").get(function () {
   if (!this.expiry.date) return null;
   const today = new Date();
   const expiry = new Date(this.expiry.date);
   const diffTime = expiry - today;
   return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update calculated fields
inventoryItemSchema.pre("save", function (next) {
   // Update available quantity
   this.quantity.available = this.quantity.onHand - this.quantity.reserved;

   // Update total cost
   if (this.cost.unitCost && this.quantity.onHand) {
      this.cost.totalCost = this.cost.unitCost * this.quantity.onHand;
   }

   // Update expiry status
   if (this.expiry.date) {
      this.expiry.isExpired = this.expiry.date < new Date();
      this.expiry.daysUntilExpiry = this.daysToExpiry;
   }

   next();
});

// Instance methods
inventoryItemSchema.methods.adjustStock = function (adjustment, type = "onHand") {
   if (type === "onHand") {
      this.quantity.onHand = Math.max(0, this.quantity.onHand + adjustment);
   } else if (type === "reserved") {
      this.quantity.reserved = Math.max(0, this.quantity.reserved + adjustment);
   } else if (type === "damaged") {
      this.quantity.damaged = Math.max(0, this.quantity.damaged + adjustment);
   }

   this.lastMovement = new Date();
   return this.save();
};

inventoryItemSchema.methods.reserveStock = function (quantity) {
   if (this.quantity.available < quantity) {
      throw new Error("Insufficient available stock");
   }
   this.quantity.reserved += quantity;
   return this.save();
};

inventoryItemSchema.methods.releaseReservation = function (quantity) {
   this.quantity.reserved = Math.max(0, this.quantity.reserved - quantity);
   return this.save();
};

inventoryItemSchema.methods.markAsCounted = function () {
   this.lastCounted = new Date();
   return this.save();
};

inventoryItemSchema.methods.isExpiringSoon = function (days = 30) {
   return this.daysToExpiry !== null && this.daysToExpiry <= days && this.daysToExpiry > 0;
};

// Static methods
inventoryItemSchema.statics.findByProductAndWarehouse = function (productId, warehouseId) {
   return this.findOne({ product: productId, warehouse: warehouseId });
};

inventoryItemSchema.statics.findLowStock = function (organizationId) {
   return this.find({
      organization: organizationId,
      $expr: { $lte: ["$quantity.onHand", "$minimumStock"] },
      status: "active",
   }).populate("product warehouse");
};

inventoryItemSchema.statics.findExpired = function (organizationId) {
   return this.find({
      organization: organizationId,
      "expiry.date": { $lt: new Date() },
      "expiry.isExpired": false,
   }).populate("product warehouse");
};

inventoryItemSchema.statics.findExpiringSoon = function (organizationId, days = 30) {
   const futureDate = new Date();
   futureDate.setDate(futureDate.getDate() + days);

   return this.find({
      organization: organizationId,
      "expiry.date": { $lte: futureDate, $gte: new Date() },
   }).populate("product warehouse");
};

inventoryItemSchema.statics.getTotalValue = async function (organizationId) {
   const result = await this.aggregate([
      { $match: { organization: mongoose.Types.ObjectId(organizationId) } },
      {
         $group: {
            _id: null,
            totalValue: { $sum: "$cost.totalCost" },
            totalItems: { $sum: "$quantity.onHand" },
         },
      },
   ]);

   return result[0] || { totalValue: 0, totalItems: 0 };
};

inventoryItemSchema.statics.findByWarehouse = function (warehouseId, organizationId) {
   return this.find({ warehouse: warehouseId, organization: organizationId })
      .populate("product variant batch")
      .sort({ "product.name": 1 });
};

const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);

export default InventoryItem;
