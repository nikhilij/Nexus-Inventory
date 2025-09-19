// models/Subscription.js
import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
   {
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      subscriber: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      plan: {
         type: String,
         required: true,
         enum: ["free", "starter", "professional", "enterprise", "custom"],
      },
      status: {
         type: String,
         enum: ["active", "trialing", "past_due", "canceled", "unpaid", "incomplete", "incomplete_expired", "paused"],
         default: "active",
      },
      billingCycle: {
         type: String,
         enum: ["monthly", "quarterly", "yearly"],
         default: "monthly",
      },
      currency: {
         type: String,
         default: "USD",
         trim: true,
         uppercase: true,
      },
      unitAmount: {
         type: Number,
         required: true,
         min: [0, "Unit amount cannot be negative"],
      },
      quantity: {
         type: Number,
         default: 1,
         min: [1, "Quantity must be at least 1"],
      },
      currentPeriodStart: {
         type: Date,
         default: Date.now,
      },
      currentPeriodEnd: {
         type: Date,
         required: true,
      },
      trialStart: Date,
      trialEnd: Date,
      canceledAt: Date,
      cancelAtPeriodEnd: {
         type: Boolean,
         default: false,
      },
      cancelAt: Date,
      endedAt: Date,
      startDate: {
         type: Date,
         default: Date.now,
      },
      billingDetails: {
         name: String,
         email: String,
         address: {
            line1: String,
            line2: String,
            city: String,
            state: String,
            postalCode: String,
            country: String,
         },
         taxId: String,
         taxRate: {
            type: Number,
            min: 0,
            max: 100,
         },
      },
      paymentMethod: {
         type: {
            type: String,
            enum: ["card", "bank_account", "paypal"],
         },
         last4: String,
         brand: String,
         expiryMonth: Number,
         expiryYear: Number,
      },
      discounts: [
         {
            id: String,
            coupon: String,
            amountOff: Number,
            percentOff: {
               type: Number,
               min: 0,
               max: 100,
            },
            duration: {
               type: String,
               enum: ["once", "repeating", "forever"],
            },
            durationInMonths: Number,
            start: Date,
            end: Date,
         },
      ],
      metadata: {
         type: Map,
         of: mongoose.Schema.Types.Mixed,
      },
      stripeSubscriptionId: String,
      stripeCustomerId: String,
      stripePriceId: String,
      features: {
         maxUsers: {
            type: Number,
            default: 1,
         },
         maxWarehouses: {
            type: Number,
            default: 1,
         },
         maxProducts: {
            type: Number,
            default: 100,
         },
         maxOrders: {
            type: Number,
            default: 1000,
         },
         apiCalls: {
            type: Number,
            default: 10000,
         },
         storage: {
            type: Number, // in GB
            default: 1,
         },
         support: {
            type: String,
            enum: ["email", "chat", "phone"],
            default: "email",
         },
         customFeatures: [String],
      },
      usage: {
         users: {
            type: Number,
            default: 0,
         },
         warehouses: {
            type: Number,
            default: 0,
         },
         products: {
            type: Number,
            default: 0,
         },
         orders: {
            type: Number,
            default: 0,
         },
         apiCalls: {
            type: Number,
            default: 0,
         },
         storage: {
            type: Number,
            default: 0,
         },
         lastUpdated: {
            type: Date,
            default: Date.now,
         },
      },
      invoices: [
         {
            invoiceId: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "Invoice",
            },
            stripeInvoiceId: String,
            amount: Number,
            status: {
               type: String,
               enum: ["draft", "open", "paid", "void", "uncollectible"],
            },
            date: Date,
         },
      ],
      webhooks: [
         {
            event: String,
            stripeEventId: String,
            receivedAt: {
               type: Date,
               default: Date.now,
            },
            processed: {
               type: Boolean,
               default: false,
            },
            data: mongoose.Schema.Types.Mixed,
         },
      ],
      createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
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
subscriptionSchema.index({ organization: 1 });
subscriptionSchema.index({ subscriber: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ canceledAt: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });

// Compound indexes
subscriptionSchema.index({ organization: 1, status: 1 });
subscriptionSchema.index({ organization: 1, subscriber: 1 }, { unique: true });
subscriptionSchema.index({ organization: 1, currentPeriodEnd: 1 });
subscriptionSchema.index({ subscriber: 1, status: 1 });
subscriptionSchema.index({ plan: 1, status: 1 });

// Virtuals
subscriptionSchema.virtual("isActive").get(function () {
   return this.status === "active" || this.status === "trialing";
});

subscriptionSchema.virtual("isCanceled").get(function () {
   return this.status === "canceled";
});

subscriptionSchema.virtual("isPastDue").get(function () {
   return this.status === "past_due";
});

subscriptionSchema.virtual("isTrialing").get(function () {
   return this.status === "trialing";
});

subscriptionSchema.virtual("daysUntilRenewal").get(function () {
   const now = new Date();
   const diffTime = this.currentPeriodEnd - now;
   return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

subscriptionSchema.virtual("isExpiringSoon").get(function () {
   return this.daysUntilRenewal <= 7 && this.daysUntilRenewal > 0;
});

subscriptionSchema.virtual("totalAmount").get(function () {
   return this.unitAmount * this.quantity;
});

subscriptionSchema.virtual("formattedPrice").get(function () {
   return `${this.currency} ${(this.totalAmount / 100).toFixed(2)}/${this.billingCycle}`;
});

subscriptionSchema.virtual("usagePercentage").get(function () {
   const percentages = {};
   if (this.features.maxUsers > 0) {
      percentages.users = (this.usage.users / this.features.maxUsers) * 100;
   }
   if (this.features.maxProducts > 0) {
      percentages.products = (this.usage.products / this.features.maxProducts) * 100;
   }
   if (this.features.maxOrders > 0) {
      percentages.orders = (this.usage.orders / this.features.maxOrders) * 100;
   }
   if (this.features.apiCalls > 0) {
      percentages.apiCalls = (this.usage.apiCalls / this.features.apiCalls) * 100;
   }
   return percentages;
});

// Pre-save middleware
subscriptionSchema.pre("save", function (next) {
   // Update usage timestamp
   if (this.isModified("usage")) {
      this.usage.lastUpdated = new Date();
   }

   // Set trial end if trialing
   if (this.status === "trialing" && this.trialStart && !this.trialEnd) {
      const trialDays = 14; // Default 14 days
      this.trialEnd = new Date(this.trialStart.getTime() + trialDays * 24 * 60 * 60 * 1000);
   }

   // Set ended date when canceled
   if (this.status === "canceled" && !this.endedAt) {
      this.endedAt = new Date();
   }

   next();
});

// Instance methods
subscriptionSchema.methods.cancel = function (immediately = false, reason) {
   if (immediately) {
      this.status = "canceled";
      this.canceledAt = new Date();
      this.endedAt = new Date();
   } else {
      this.cancelAtPeriodEnd = true;
      this.cancelAt = this.currentPeriodEnd;
   }

   if (reason) {
      this.metadata = this.metadata || {};
      this.metadata.cancelReason = reason;
   }

   return this.save();
};

subscriptionSchema.methods.uncancel = function () {
   this.cancelAtPeriodEnd = false;
   this.cancelAt = null;
   this.canceledAt = null;
   this.endedAt = null;
   this.status = "active";

   return this.save();
};

subscriptionSchema.methods.pause = function () {
   this.status = "paused";
   return this.save();
};

subscriptionSchema.methods.resume = function () {
   if (this.status === "paused") {
      this.status = "active";
   }
   return this.save();
};

subscriptionSchema.methods.renew = function (newPeriodEnd) {
   this.currentPeriodStart = this.currentPeriodEnd;
   this.currentPeriodEnd = newPeriodEnd || this.calculateNextPeriodEnd();

   if (this.cancelAtPeriodEnd && this.currentPeriodEnd >= this.cancelAt) {
      this.status = "canceled";
      this.endedAt = this.currentPeriodEnd;
   }

   return this.save();
};

subscriptionSchema.methods.calculateNextPeriodEnd = function () {
   const currentEnd = this.currentPeriodEnd;
   const nextEnd = new Date(currentEnd);

   switch (this.billingCycle) {
      case "monthly":
         nextEnd.setMonth(nextEnd.getMonth() + 1);
         break;
      case "quarterly":
         nextEnd.setMonth(nextEnd.getMonth() + 3);
         break;
      case "yearly":
         nextEnd.setFullYear(nextEnd.getFullYear() + 1);
         break;
   }

   return nextEnd;
};

subscriptionSchema.methods.updateUsage = function (usageData) {
   Object.assign(this.usage, usageData);
   this.usage.lastUpdated = new Date();
   return this.save();
};

subscriptionSchema.methods.checkLimits = function () {
   const violations = [];

   if (this.usage.users > this.features.maxUsers) {
      violations.push({
         type: "users",
         current: this.usage.users,
         limit: this.features.maxUsers,
      });
   }

   if (this.usage.products > this.features.maxProducts) {
      violations.push({
         type: "products",
         current: this.usage.products,
         limit: this.features.maxProducts,
      });
   }

   if (this.usage.orders > this.features.maxOrders) {
      violations.push({
         type: "orders",
         current: this.usage.orders,
         limit: this.features.maxOrders,
      });
   }

   if (this.usage.apiCalls > this.features.apiCalls) {
      violations.push({
         type: "apiCalls",
         current: this.usage.apiCalls,
         limit: this.features.apiCalls,
      });
   }

   return violations;
};

subscriptionSchema.methods.addInvoice = function (invoiceData) {
   this.invoices.push({
      ...invoiceData,
      date: new Date(),
   });
   return this.save();
};

subscriptionSchema.methods.addWebhook = function (webhookData) {
   this.webhooks.push({
      ...webhookData,
      receivedAt: new Date(),
   });
   return this.save();
};

subscriptionSchema.methods.applyDiscount = function (discountData) {
   this.discounts.push({
      ...discountData,
      start: new Date(),
   });

   // Recalculate effective price if needed
   this.recalculatePrice();
   return this.save();
};

subscriptionSchema.methods.recalculatePrice = function () {
   // This would contain logic to recalculate the effective price
   // based on discounts, but for now it's a placeholder
   return this;
};

// Static methods
subscriptionSchema.statics.findActive = function (organizationId) {
   return this.find({
      organization: organizationId,
      status: { $in: ["active", "trialing"] },
   })
      .populate("subscriber", "name email")
      .sort({ currentPeriodEnd: 1 });
};

subscriptionSchema.statics.findExpiringSoon = function (organizationId, days = 7) {
   const futureDate = new Date();
   futureDate.setDate(futureDate.getDate() + days);

   return this.find({
      organization: organizationId,
      status: { $in: ["active", "trialing"] },
      currentPeriodEnd: {
         $gte: new Date(),
         $lte: futureDate,
      },
   })
      .populate("subscriber", "name email")
      .sort({ currentPeriodEnd: 1 });
};

subscriptionSchema.statics.findByPlan = function (plan, organizationId) {
   return this.find({
      organization: organizationId,
      plan: plan,
   })
      .populate("subscriber", "name email")
      .sort({ createdAt: -1 });
};

subscriptionSchema.statics.findPastDue = function (organizationId) {
   return this.find({
      organization: organizationId,
      status: "past_due",
   })
      .populate("subscriber", "name email")
      .sort({ currentPeriodEnd: -1 });
};

subscriptionSchema.statics.getSubscriptionStats = async function (organizationId) {
   const stats = await this.aggregate([
      { $match: { organization: mongoose.Types.ObjectId(organizationId) } },
      {
         $group: {
            _id: null,
            totalSubscriptions: { $sum: 1 },
            activeSubscriptions: {
               $sum: {
                  $cond: [{ $in: ["$status", ["active", "trialing"]] }, 1, 0],
               },
            },
            canceledSubscriptions: {
               $sum: {
                  $cond: [{ $eq: ["$status", "canceled"] }, 1, 0],
               },
            },
            totalRevenue: { $sum: "$totalAmount" },
            byPlan: {
               $push: "$plan",
            },
            byStatus: {
               $push: "$status",
            },
         },
      },
   ]);

   if (stats.length === 0) {
      return {
         totalSubscriptions: 0,
         activeSubscriptions: 0,
         canceledSubscriptions: 0,
         totalRevenue: 0,
         plans: {},
         statuses: {},
      };
   }

   const result = stats[0];

   // Count plans
   result.plans = result.byPlan.reduce((acc, plan) => {
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
   }, {});

   // Count statuses
   result.statuses = result.byStatus.reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
   }, {});

   delete result.byPlan;
   delete result.byStatus;

   return result;
};

subscriptionSchema.statics.findByStripeId = function (stripeSubscriptionId) {
   return this.findOne({ stripeSubscriptionId: stripeSubscriptionId });
};

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
