// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
   {
      orderNumber: {
         type: String,
         required: true,
         unique: true,
         trim: true,
      },
      type: {
         type: String,
         required: true,
         enum: ["purchase", "sales", "transfer", "adjustment"],
         trim: true,
      },
      status: {
         type: String,
         enum: ["draft", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"],
         default: "draft",
      },
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      customer: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      supplier: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Supplier",
      },
      warehouse: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Warehouse",
      },
      items: [
         {
            product: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "Product",
               required: true,
            },
            variant: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "ProductVariant",
            },
            quantity: {
               type: Number,
               required: true,
               min: 1,
            },
            unitPrice: {
               type: Number,
               required: true,
               min: 0,
            },
            discount: {
               type: Number,
               default: 0,
               min: 0,
            },
            tax: {
               type: Number,
               default: 0,
               min: 0,
            },
            total: {
               type: Number,
               required: true,
               min: 0,
            },
            notes: String,
         },
      ],
      pricing: {
         subtotal: {
            type: Number,
            default: 0,
            min: 0,
         },
         discount: {
            type: Number,
            default: 0,
            min: 0,
         },
         tax: {
            type: Number,
            default: 0,
            min: 0,
         },
         shipping: {
            type: Number,
            default: 0,
            min: 0,
         },
         total: {
            type: Number,
            default: 0,
            min: 0,
         },
         currency: {
            type: String,
            default: "USD",
            trim: true,
         },
      },
      shipping: {
         address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
         },
         method: String,
         trackingNumber: String,
         carrier: String,
         cost: Number,
         estimatedDelivery: Date,
         actualDelivery: Date,
      },
      billing: {
         address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
         },
         paymentMethod: String,
         paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
         },
         paymentDate: Date,
         invoiceNumber: String,
      },
      dates: {
         ordered: {
            type: Date,
            default: Date.now,
         },
         confirmed: Date,
         shipped: Date,
         delivered: Date,
         cancelled: Date,
         due: Date,
      },
      notes: String,
      tags: [String],
      priority: {
         type: String,
         enum: ["low", "normal", "high", "urgent"],
         default: "normal",
      },
      source: {
         type: String,
         enum: ["manual", "api", "import", "web", "mobile"],
         default: "manual",
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
      approvedBy: {
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
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ organization: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ supplier: 1 });
orderSchema.index({ warehouse: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ type: 1 });
orderSchema.index({ "dates.ordered": -1 });
orderSchema.index({ "dates.due": 1 });
orderSchema.index({ priority: 1 });

// Compound indexes
orderSchema.index({ organization: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ organization: 1, status: 1 });
orderSchema.index({ organization: 1, type: 1 });
orderSchema.index({ organization: 1, customer: 1 });
orderSchema.index({ organization: 1, supplier: 1 });

// Virtuals
orderSchema.virtual("itemCount").get(function () {
   return this.items.reduce((total, item) => total + item.quantity, 0);
});

orderSchema.virtual("isOverdue").get(function () {
   return this.dates.due && this.dates.due < new Date() && this.status !== "delivered" && this.status !== "cancelled";
});

orderSchema.virtual("daysOverdue").get(function () {
   if (!this.isOverdue) return 0;
   const today = new Date();
   const due = new Date(this.dates.due);
   const diffTime = today - due;
   return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
orderSchema.pre("save", function (next) {
   // Calculate totals
   this.pricing.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
   this.pricing.total = this.pricing.subtotal - this.pricing.discount + this.pricing.tax + this.pricing.shipping;

   next();
});

// Instance methods
orderSchema.methods.addItem = function (productId, quantity, unitPrice, options = {}) {
   const existingItem = this.items.find(
      (item) =>
         item.product.toString() === productId.toString() &&
         (!options.variant || item.variant?.toString() === options.variant.toString())
   );

   if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total = existingItem.quantity * existingItem.unitPrice;
   } else {
      const newItem = {
         product: productId,
         quantity,
         unitPrice,
         total: quantity * unitPrice,
         ...options,
      };
      this.items.push(newItem);
   }

   return this.save();
};

orderSchema.methods.removeItem = function (itemId) {
   this.items = this.items.filter((item) => item._id.toString() !== itemId);
   return this.save();
};

orderSchema.methods.updateStatus = function (newStatus, userId) {
   this.status = newStatus;
   this.updatedBy = userId;

   // Set appropriate dates based on status
   const now = new Date();
   switch (newStatus) {
      case "confirmed":
         this.dates.confirmed = now;
         break;
      case "shipped":
         this.dates.shipped = now;
         break;
      case "delivered":
         this.dates.delivered = now;
         break;
      case "cancelled":
         this.dates.cancelled = now;
         break;
   }

   return this.save();
};

orderSchema.methods.calculateTotals = function () {
   this.pricing.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
   this.pricing.total = this.pricing.subtotal - this.pricing.discount + this.pricing.tax + this.pricing.shipping;
   return this.pricing.total;
};

orderSchema.methods.isEditable = function () {
   return ["draft", "pending"].includes(this.status);
};

orderSchema.methods.canBeCancelled = function () {
   return !["delivered", "cancelled"].includes(this.status);
};

// Static methods
orderSchema.statics.findByOrderNumber = function (orderNumber, organizationId) {
   return this.findOne({ orderNumber, organization: organizationId });
};

orderSchema.statics.findByOrganization = function (organizationId, filters = {}) {
   const query = { organization: organizationId, ...filters };
   return this.find(query)
      .populate("customer supplier warehouse items.product items.variant")
      .sort({ "dates.ordered": -1 });
};

orderSchema.statics.findOverdue = function (organizationId) {
   return this.find({
      organization: organizationId,
      "dates.due": { $lt: new Date() },
      status: { $nin: ["delivered", "cancelled"] },
   }).populate("customer supplier");
};

orderSchema.statics.findByCustomer = function (customerId, organizationId) {
   return this.find({ customer: customerId, organization: organizationId }).sort({ "dates.ordered": -1 });
};

orderSchema.statics.findBySupplier = function (supplierId, organizationId) {
   return this.find({ supplier: supplierId, organization: organizationId }).sort({ "dates.ordered": -1 });
};

orderSchema.statics.getOrderStats = async function (organizationId, dateRange = {}) {
   const match = { organization: organizationId };
   if (dateRange.start) match["dates.ordered"] = { $gte: dateRange.start };
   if (dateRange.end) match["dates.ordered"] = { ...match["dates.ordered"], $lte: dateRange.end };

   return this.aggregate([
      { $match: match },
      {
         $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalValue: { $sum: "$pricing.total" },
         },
      },
   ]);
};

const Order = mongoose.model("Order", orderSchema);

export default Order;
