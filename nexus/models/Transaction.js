// models/Transaction.js
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
   {
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      type: {
         type: String,
         required: true,
         enum: [
            "receive", // Receiving inventory from supplier
            "ship", // Shipping inventory to customer
            "adjust", // Manual inventory adjustment
            "transfer", // Transfer between warehouses
            "return", // Customer return
            "damage", // Damaged goods
            "loss", // Lost/stolen goods
            "count", // Physical inventory count
            "reservation", // Reserve for order
            "unreservation", // Release reservation
         ],
      },
      reference: {
         type: String,
         required: true,
         trim: true,
      },
      referenceType: {
         type: String,
         required: true,
         enum: ["order", "purchase_order", "adjustment", "transfer", "return", "count"],
      },
      referenceId: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
      },
      inventoryItem: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "InventoryItem",
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
      quantityChange: {
         type: Number,
         required: true,
         validate: {
            validator: Number.isInteger,
            message: "Quantity change must be a whole number",
         },
      },
      previousQuantity: {
         type: Number,
         required: true,
         min: [0, "Previous quantity cannot be negative"],
      },
      newQuantity: {
         type: Number,
         required: true,
         min: [0, "New quantity cannot be negative"],
      },
      unitCost: {
         type: Number,
         min: [0, "Unit cost cannot be negative"],
      },
      totalValue: {
         type: Number,
         min: [0, "Total value cannot be negative"],
      },
      reason: {
         type: String,
         trim: true,
      },
      notes: String,
      metadata: {
         type: Map,
         of: mongoose.Schema.Types.Mixed,
      },
      sourceWarehouse: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Warehouse",
      },
      destinationWarehouse: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Warehouse",
      },
      performedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      approvedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      approvedAt: Date,
      reversalOf: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Transaction",
      },
      isReversed: {
         type: Boolean,
         default: false,
      },
      reversedAt: Date,
      reversedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      reversalReason: String,
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes
transactionSchema.index({ organization: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ reference: 1 });
transactionSchema.index({ referenceType: 1 });
transactionSchema.index({ referenceId: 1 });
transactionSchema.index({ inventoryItem: 1 });
transactionSchema.index({ product: 1 });
transactionSchema.index({ warehouse: 1 });
transactionSchema.index({ performedBy: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ isReversed: 1 });

// Compound indexes
transactionSchema.index({ organization: 1, type: 1 });
transactionSchema.index({ organization: 1, createdAt: -1 });
transactionSchema.index({ inventoryItem: 1, createdAt: -1 });
transactionSchema.index({ warehouse: 1, type: 1 });
transactionSchema.index({ product: 1, warehouse: 1, createdAt: -1 });
transactionSchema.index({ referenceType: 1, referenceId: 1 });

// Virtuals
transactionSchema.virtual("isPositive").get(function () {
   return this.quantityChange > 0;
});

transactionSchema.virtual("isNegative").get(function () {
   return this.quantityChange < 0;
});

transactionSchema.virtual("quantityDelta").get(function () {
   return Math.abs(this.quantityChange);
});

transactionSchema.virtual("valueChange").get(function () {
   return this.unitCost ? this.quantityChange * this.unitCost : 0;
});

transactionSchema.virtual("isAdjustment").get(function () {
   return this.type === "adjust";
});

transactionSchema.virtual("isTransfer").get(function () {
   return this.type === "transfer";
});

transactionSchema.virtual("requiresApproval").get(function () {
   return ["adjust", "damage", "loss"].includes(this.type) && Math.abs(this.quantityChange) > 10;
});

// Pre-save middleware
transactionSchema.pre("save", function (next) {
   // Calculate total value if unit cost is provided
   if (this.unitCost && this.quantityChange) {
      this.totalValue = Math.abs(this.quantityChange * this.unitCost);
   }

   // Validate warehouse transfer
   if (this.type === "transfer") {
      if (!this.sourceWarehouse || !this.destinationWarehouse) {
         return next(new Error("Transfer transactions must specify source and destination warehouses"));
      }
      if (this.sourceWarehouse.toString() === this.destinationWarehouse.toString()) {
         return next(new Error("Source and destination warehouses cannot be the same"));
      }
   }

   // Validate quantity consistency
   const expectedNewQuantity = this.previousQuantity + this.quantityChange;
   if (this.newQuantity !== expectedNewQuantity) {
      return next(new Error("New quantity must equal previous quantity plus quantity change"));
   }

   next();
});

// Instance methods
transactionSchema.methods.reverse = function (reason, userId) {
   if (this.isReversed) {
      throw new Error("Transaction is already reversed");
   }

   // Create reversal transaction
   const reversalTransaction = new mongoose.model("Transaction")({
      organization: this.organization,
      type: this.type,
      reference: `REV-${this.reference}`,
      referenceType: this.referenceType,
      referenceId: this.referenceId,
      inventoryItem: this.inventoryItem,
      product: this.product,
      variant: this.variant,
      warehouse: this.warehouse,
      batch: this.batch,
      quantityChange: -this.quantityChange,
      previousQuantity: this.newQuantity,
      newQuantity: this.previousQuantity,
      unitCost: this.unitCost,
      reason: reason,
      performedBy: userId,
      reversalOf: this._id,
   });

   // Mark current transaction as reversed
   this.isReversed = true;
   this.reversedAt = new Date();
   this.reversedBy = userId;
   this.reversalReason = reason;

   return Promise.all([this.save(), reversalTransaction.save()]);
};

transactionSchema.methods.approve = function (userId) {
   if (this.approvedBy) {
      throw new Error("Transaction is already approved");
   }

   this.approvedBy = userId;
   this.approvedAt = new Date();

   return this.save();
};

transactionSchema.methods.getRelatedTransactions = function () {
   const Transaction = mongoose.model("Transaction");

   return Transaction.find({
      $or: [{ reversalOf: this._id }, { _id: this.reversalOf }],
   }).sort({ createdAt: 1 });
};

// Static methods
transactionSchema.statics.findByInventoryItem = function (inventoryItemId, limit = 50) {
   return this.find({ inventoryItem: inventoryItemId })
      .populate("performedBy", "name email")
      .populate("approvedBy", "name email")
      .populate("warehouse", "name code")
      .populate("product", "name sku")
      .sort({ createdAt: -1 })
      .limit(limit);
};

transactionSchema.statics.findByWarehouse = function (warehouseId, type = null, limit = 100) {
   const query = { warehouse: warehouseId };
   if (type) {
      query.type = type;
   }

   return this.find(query)
      .populate("performedBy", "name email")
      .populate("product", "name sku")
      .populate("inventoryItem", "quantity availableQuantity")
      .sort({ createdAt: -1 })
      .limit(limit);
};

transactionSchema.statics.findByReference = function (referenceType, referenceId) {
   return this.find({
      referenceType: referenceType,
      referenceId: referenceId,
   })
      .populate("performedBy", "name email")
      .populate("warehouse", "name code")
      .populate("product", "name sku")
      .sort({ createdAt: 1 });
};

transactionSchema.statics.findPendingApprovals = function (organizationId) {
   return this.find({
      organization: organizationId,
      approvedBy: { $exists: false },
      type: { $in: ["adjust", "damage", "loss"] },
      $expr: { $gt: [{ $abs: "$quantityChange" }, 10] },
   })
      .populate("performedBy", "name email")
      .populate("warehouse", "name code")
      .populate("product", "name sku")
      .sort({ createdAt: -1 });
};

transactionSchema.statics.getTransactionSummary = async function (organizationId, startDate, endDate) {
   const matchStage = {
      organization: mongoose.Types.ObjectId(organizationId),
      isReversed: false,
   };

   if (startDate && endDate) {
      matchStage.createdAt = {
         $gte: new Date(startDate),
         $lte: new Date(endDate),
      };
   }

   const summary = await this.aggregate([
      { $match: matchStage },
      {
         $group: {
            _id: {
               type: "$type",
               warehouse: "$warehouse",
            },
            count: { $sum: 1 },
            totalQuantityChange: { $sum: "$quantityChange" },
            totalValue: { $sum: "$totalValue" },
            positiveTransactions: {
               $sum: { $cond: [{ $gt: ["$quantityChange", 0] }, 1, 0] },
            },
            negativeTransactions: {
               $sum: { $cond: [{ $lt: ["$quantityChange", 0] }, 1, 0] },
            },
         },
      },
      {
         $group: {
            _id: "$_id.warehouse",
            warehouse: { $first: "$_id.warehouse" },
            transactions: {
               $push: {
                  type: "$_id.type",
                  count: "$count",
                  totalQuantityChange: "$totalQuantityChange",
                  totalValue: "$totalValue",
                  positiveTransactions: "$positiveTransactions",
                  negativeTransactions: "$negativeTransactions",
               },
            },
         },
      },
   ]);

   return summary;
};

transactionSchema.statics.getInventoryValueChange = async function (inventoryItemId, startDate, endDate) {
   const matchStage = {
      inventoryItem: mongoose.Types.ObjectId(inventoryItemId),
      isReversed: false,
   };

   if (startDate && endDate) {
      matchStage.createdAt = {
         $gte: new Date(startDate),
         $lte: new Date(endDate),
      };
   }

   const result = await this.aggregate([
      { $match: matchStage },
      {
         $group: {
            _id: null,
            totalValueChange: { $sum: "$valueChange" },
            transactionCount: { $sum: 1 },
            positiveValue: {
               $sum: {
                  $cond: [{ $gt: ["$valueChange", 0] }, "$valueChange", 0],
               },
            },
            negativeValue: {
               $sum: {
                  $cond: [{ $lt: ["$valueChange", 0] }, "$valueChange", 0],
               },
            },
         },
      },
   ]);

   return (
      result[0] || {
         totalValueChange: 0,
         transactionCount: 0,
         positiveValue: 0,
         negativeValue: 0,
      }
   );
};

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
