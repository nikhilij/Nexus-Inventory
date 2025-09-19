// models/Organization.js
import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
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
      domain: {
         type: String,
         trim: true,
         lowercase: true,
      },
      logo: {
         type: String, // URL to logo image
         trim: true,
      },
      settings: {
         timezone: {
            type: String,
            default: "UTC",
         },
         currency: {
            type: String,
            default: "USD",
         },
         dateFormat: {
            type: String,
            default: "MM/DD/YYYY",
         },
         language: {
            type: String,
            default: "en",
         },
         theme: {
            type: String,
            enum: ["light", "dark", "auto"],
            default: "auto",
         },
      },
      subscription: {
         plan: {
            type: String,
            enum: ["free", "starter", "professional", "enterprise"],
            default: "free",
         },
         status: {
            type: String,
            enum: ["active", "inactive", "suspended", "cancelled"],
            default: "active",
         },
         startDate: Date,
         endDate: Date,
         features: [String],
      },
      billing: {
         stripeCustomerId: String,
         paymentMethod: String,
         billingAddress: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
         },
      },
      owner: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      isActive: {
         type: Boolean,
         default: true,
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes
organizationSchema.index({ name: 1 });
organizationSchema.index({ domain: 1 });
organizationSchema.index({ owner: 1 });
organizationSchema.index({ isActive: 1 });
organizationSchema.index({ "subscription.status": 1 });

// Virtuals
organizationSchema.virtual("userCount", {
   ref: "User",
   localField: "_id",
   foreignField: "organization",
   count: true,
});

organizationSchema.virtual("teamCount", {
   ref: "Team",
   localField: "_id",
   foreignField: "organization",
   count: true,
});

// Instance methods
organizationSchema.methods.isSubscriptionActive = function () {
   return (
      this.subscription.status === "active" && (!this.subscription.endDate || this.subscription.endDate > new Date())
   );
};

organizationSchema.methods.hasFeature = function (feature) {
   return this.subscription.features && this.subscription.features.includes(feature);
};

organizationSchema.methods.upgradePlan = function (newPlan, features = []) {
   this.subscription.plan = newPlan;
   this.subscription.features = features;
   this.subscription.startDate = new Date();
   return this.save();
};

// Static methods
organizationSchema.statics.findByDomain = function (domain) {
   return this.findOne({ domain: domain.toLowerCase(), isActive: true });
};

organizationSchema.statics.findActiveOrganizations = function () {
   return this.find({ isActive: true });
};

organizationSchema.statics.findByOwner = function (ownerId) {
   return this.find({ owner: ownerId, isActive: true });
};

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
