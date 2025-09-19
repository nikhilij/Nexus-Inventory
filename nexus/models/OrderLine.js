// models/OrderLine.js
import mongoose from "mongoose";

const orderLineSchema = new mongoose.Schema(
   {
      order: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Order",
         required: true,
      },
      product: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Product",
         required: true,
      },
      variant: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "ProductVariant",
      },
      warehouse: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Warehouse",
         required: true,
      },
      batch: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Batch",
      },
      quantity: {
         type: Number,
         required: true,
         min: [1, "Quantity must be at least 1"],
         validate: {
            validator: Number.isInteger,
            message: "Quantity must be a whole number",
         },
      },
      unitPrice: {
         type: Number,
         required: true,
         min: [0, "Unit price cannot be negative"],
      },
      discount: {
         type: Number,
         default: 0,
         min: [0, "Discount cannot be negative"],
         max: [100, "Discount cannot exceed 100%"],
      },
      discountAmount: {
         type: Number,
         default: 0,
         min: [0, "Discount amount cannot be negative"],
      },
      taxRate: {
         type: Number,
         default: 0,
         min: [0, "Tax rate cannot be negative"],
         max: [100, "Tax rate cannot exceed 100%"],
      },
      taxAmount: {
         type: Number,
         default: 0,
         min: [0, "Tax amount cannot be negative"],
      },
      lineTotal: {
         type: Number,
         required: true,
         min: [0, "Line total cannot be negative"],
      },
      status: {
         type: String,
         enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"],
         default: "pending",
      },
      notes: String,
      serialNumbers: [
         {
            type: String,
            trim: true,
         },
      ],
      customFields: {
         type: Map,
         of: mongoose.Schema.Types.Mixed,
      },
      fulfilledQuantity: {
         type: Number,
         default: 0,
         min: [0, "Fulfilled quantity cannot be negative"],
      },
      backorderedQuantity: {
         type: Number,
         default: 0,
         min: [0, "Backordered quantity cannot be negative"],
      },
      expectedDeliveryDate: Date,
      actualDeliveryDate: Date,
      qualityCheck: {
         passed: {
            type: Boolean,
            default: null,
         },
         notes: String,
         checkedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
         },
         checkedAt: Date,
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
orderLineSchema.index({ order: 1 });
orderLineSchema.index({ product: 1 });
orderLineSchema.index({ warehouse: 1 });
orderLineSchema.index({ status: 1 });
orderLineSchema.index({ expectedDeliveryDate: 1 });
orderLineSchema.index({ actualDeliveryDate: 1 });

// Compound indexes
orderLineSchema.index({ order: 1, product: 1 });
orderLineSchema.index({ order: 1, status: 1 });
orderLineSchema.index({ product: 1, warehouse: 1 });
orderLineSchema.index({ warehouse: 1, status: 1 });

// Virtuals
orderLineSchema.virtual("subtotal").get(function () {
   return this.quantity * this.unitPrice;
});

orderLineSchema.virtual("totalDiscount").get(function () {
   return this.discountAmount + this.subtotal * (this.discount / 100);
});

orderLineSchema.virtual("totalTax").get(function () {
   return this.taxAmount + (this.subtotal - this.totalDiscount) * (this.taxRate / 100);
});

orderLineSchema.virtual("finalTotal").get(function () {
   return this.subtotal - this.totalDiscount + this.totalTax;
});

orderLineSchema.virtual("remainingQuantity").get(function () {
   return this.quantity - this.fulfilledQuantity;
});

orderLineSchema.virtual("isFullyFulfilled").get(function () {
   return this.fulfilledQuantity >= this.quantity;
});

orderLineSchema.virtual("isBackordered").get(function () {
   return this.backorderedQuantity > 0;
});

orderLineSchema.virtual("fulfillmentRate").get(function () {
   return this.quantity > 0 ? (this.fulfilledQuantity / this.quantity) * 100 : 0;
});

// Pre-save middleware
orderLineSchema.pre("save", function (next) {
   // Calculate line total
   const subtotal = this.quantity * this.unitPrice;
   const discountFromPercent = subtotal * (this.discount / 100);
   const totalDiscount = discountFromPercent + this.discountAmount;
   const taxableAmount = subtotal - totalDiscount;
   const taxFromPercent = taxableAmount * (this.taxRate / 100);
   const totalTax = taxFromPercent + this.taxAmount;

   this.lineTotal = subtotal - totalDiscount + totalTax;

   // Validate fulfilled quantity doesn't exceed ordered quantity
   if (this.fulfilledQuantity > this.quantity) {
      return next(new Error("Fulfilled quantity cannot exceed ordered quantity"));
   }

   // Validate backordered quantity
   if (this.backorderedQuantity > this.remainingQuantity) {
      return next(new Error("Backordered quantity cannot exceed remaining quantity"));
   }

   next();
});

// Instance methods
orderLineSchema.methods.fulfill = function (quantity, userId) {
   if (quantity <= 0) {
      throw new Error("Fulfillment quantity must be positive");
   }

   if (this.fulfilledQuantity + quantity > this.quantity) {
      throw new Error("Cannot fulfill more than remaining quantity");
   }

   this.fulfilledQuantity += quantity;
   this.updatedBy = userId;

   if (this.isFullyFulfilled) {
      this.status = "delivered";
      this.actualDeliveryDate = new Date();
   } else if (this.fulfilledQuantity > 0) {
      this.status = "shipped";
   }

   return this.save();
};

orderLineSchema.methods.backorder = function (quantity, userId) {
   if (quantity <= 0) {
      throw new Error("Backorder quantity must be positive");
   }

   if (this.backorderedQuantity + quantity > this.remainingQuantity) {
      throw new Error("Cannot backorder more than remaining quantity");
   }

   this.backorderedQuantity += quantity;
   this.updatedBy = userId;

   return this.save();
};

orderLineSchema.methods.cancel = function (reason, userId) {
   this.status = "cancelled";
   this.notes = this.notes ? `${this.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`;
   this.updatedBy = userId;

   return this.save();
};

orderLineSchema.methods.return = function (quantity, reason, userId) {
   if (quantity <= 0) {
      throw new Error("Return quantity must be positive");
   }

   if (quantity > this.fulfilledQuantity) {
      throw new Error("Cannot return more than fulfilled quantity");
   }

   this.fulfilledQuantity -= quantity;
   this.status = "returned";
   this.notes = this.notes
      ? `${this.notes}\nReturned ${quantity} units: ${reason}`
      : `Returned ${quantity} units: ${reason}`;
   this.updatedBy = userId;

   return this.save();
};

orderLineSchema.methods.performQualityCheck = function (passed, notes, userId) {
   this.qualityCheck.passed = passed;
   this.qualityCheck.notes = notes;
   this.qualityCheck.checkedBy = userId;
   this.qualityCheck.checkedAt = new Date();

   return this.save();
};

orderLineSchema.methods.updateQuantities = function (fulfilled, backordered, userId) {
   if (fulfilled < 0 || backordered < 0) {
      throw new Error("Quantities cannot be negative");
   }

   if (fulfilled + backordered > this.quantity) {
      throw new Error("Combined fulfilled and backordered quantities cannot exceed ordered quantity");
   }

   this.fulfilledQuantity = fulfilled;
   this.backorderedQuantity = backordered;
   this.updatedBy = userId;

   // Update status based on fulfillment
   if (this.isFullyFulfilled) {
      this.status = "delivered";
      if (!this.actualDeliveryDate) {
         this.actualDeliveryDate = new Date();
      }
   } else if (this.fulfilledQuantity > 0) {
      this.status = "shipped";
   }

   return this.save();
};

// Static methods
orderLineSchema.statics.findByOrder = function (orderId) {
   return this.find({ order: orderId })
      .populate("product", "name sku")
      .populate("variant", "name sku")
      .populate("warehouse", "name code")
      .populate("batch", "batchNumber expiryDate")
      .sort({ createdAt: 1 });
};

orderLineSchema.statics.findByProduct = function (productId, organizationId) {
   return this.find({ product: productId })
      .populate({
         path: "order",
         match: { organization: organizationId },
         select: "orderNumber status",
      })
      .sort({ createdAt: -1 });
};

orderLineSchema.statics.findByWarehouse = function (warehouseId) {
   return this.find({ warehouse: warehouseId })
      .populate("product", "name sku")
      .populate("order", "orderNumber status")
      .sort({ createdAt: -1 });
};

orderLineSchema.statics.findPendingFulfillment = function (warehouseId) {
   return this.find({
      warehouse: warehouseId,
      status: { $in: ["pending", "confirmed"] },
      fulfilledQuantity: { $lt: mongoose.Types.Decimal128("$quantity") },
   })
      .populate("product", "name sku")
      .populate("order", "orderNumber priority expectedDeliveryDate")
      .sort({ "order.priority": -1, expectedDeliveryDate: 1 });
};

orderLineSchema.statics.findBackordered = function (organizationId) {
   return this.find({
      backorderedQuantity: { $gt: 0 },
   })
      .populate({
         path: "order",
         match: { organization: organizationId },
         select: "orderNumber status",
      })
      .populate("product", "name sku")
      .populate("warehouse", "name code")
      .sort({ createdAt: -1 });
};

orderLineSchema.statics.getOrderLineStats = async function (orderId) {
   const stats = await this.aggregate([
      { $match: { order: mongoose.Types.ObjectId(orderId) } },
      {
         $group: {
            _id: null,
            totalLines: { $sum: 1 },
            totalQuantity: { $sum: "$quantity" },
            fulfilledQuantity: { $sum: "$fulfilledQuantity" },
            backorderedQuantity: { $sum: "$backorderedQuantity" },
            totalValue: { $sum: "$lineTotal" },
            pendingLines: {
               $sum: {
                  $cond: [{ $in: ["$status", ["pending", "confirmed"]] }, 1, 0],
               },
            },
         },
      },
   ]);

   const result = stats[0] || {
      totalLines: 0,
      totalQuantity: 0,
      fulfilledQuantity: 0,
      backorderedQuantity: 0,
      totalValue: 0,
      pendingLines: 0,
   };

   result.fulfillmentRate = result.totalQuantity > 0 ? (result.fulfilledQuantity / result.totalQuantity) * 100 : 0;

   return result;
};

const OrderLine = mongoose.model("OrderLine", orderLineSchema);

export default OrderLine;
