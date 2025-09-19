// models/Supplier.js
import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
         trim: true,
         maxlength: 100,
      },
      code: {
         type: String,
         required: true,
         unique: true,
         trim: true,
         uppercase: true,
      },
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      contact: {
         email: {
            type: String,
            trim: true,
            lowercase: true,
            validate: {
               validator: function (v) {
                  return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
               },
               message: "Please enter a valid email address",
            },
         },
         phone: {
            type: String,
            trim: true,
         },
         fax: {
            type: String,
            trim: true,
         },
         website: {
            type: String,
            trim: true,
            validate: {
               validator: function (v) {
                  return !v || /^https?:\/\/.+/.test(v);
               },
               message: "Website must be a valid HTTP/HTTPS URL",
            },
         },
      },
      address: {
         street: String,
         city: String,
         state: String,
         zipCode: String,
         country: {
            type: String,
            default: "US",
         },
      },
      billing: {
         address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
         },
         taxId: String,
         paymentTerms: {
            type: String,
            enum: ["net_15", "net_30", "net_45", "net_60", "cod", "due_on_receipt"],
            default: "net_30",
         },
         creditLimit: {
            type: Number,
            min: 0,
         },
         currency: {
            type: String,
            default: "USD",
            trim: true,
         },
      },
      contacts: [
         {
            name: {
               type: String,
               required: true,
               trim: true,
            },
            title: String,
            email: {
               type: String,
               trim: true,
               lowercase: true,
               validate: {
                  validator: function (v) {
                     return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                  },
                  message: "Contact email must be valid",
               },
            },
            phone: String,
            isPrimary: {
               type: Boolean,
               default: false,
            },
         },
      ],
      categories: [
         {
            type: String,
            trim: true,
         },
      ],
      rating: {
         score: {
            type: Number,
            min: 1,
            max: 5,
            default: 3,
         },
         reviewCount: {
            type: Number,
            default: 0,
            min: 0,
         },
         lastReviewed: Date,
      },
      performance: {
         onTimeDelivery: {
            type: Number,
            min: 0,
            max: 100,
            default: 100,
         },
         qualityScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 100,
         },
         averageLeadTime: {
            type: Number,
            min: 0,
         },
         totalOrders: {
            type: Number,
            default: 0,
            min: 0,
         },
         totalValue: {
            type: Number,
            default: 0,
            min: 0,
         },
      },
      status: {
         type: String,
         enum: ["active", "inactive", "blacklisted", "pending_approval"],
         default: "active",
      },
      isPreferred: {
         type: Boolean,
         default: false,
      },
      notes: String,
      tags: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tag",
         },
      ],
      documents: [
         {
            name: String,
            type: {
               type: String,
               enum: ["contract", "certificate", "license", "insurance", "other"],
            },
            url: String,
            expiryDate: Date,
            uploadedAt: {
               type: Date,
               default: Date.now,
            },
         },
      ],
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
supplierSchema.index({ name: 1 });
supplierSchema.index({ organization: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ isPreferred: 1 });
supplierSchema.index({ "contact.email": 1 });
supplierSchema.index({ "rating.score": -1 });

// Compound indexes
supplierSchema.index({ organization: 1, name: 1 });
supplierSchema.index({ organization: 1, code: 1 }, { unique: true });
supplierSchema.index({ organization: 1, status: 1 });
supplierSchema.index({ organization: 1, isPreferred: 1 });

// Virtuals
supplierSchema.virtual("primaryContact").get(function () {
   return this.contacts.find((contact) => contact.isPrimary) || this.contacts[0];
});

supplierSchema.virtual("fullAddress").get(function () {
   if (!this.address.street) return "";
   const parts = [
      this.address.street,
      this.address.city,
      this.address.state,
      this.address.zipCode,
      this.address.country,
   ].filter(Boolean);
   return parts.join(", ");
});

supplierSchema.virtual("performanceScore").get(function () {
   return (this.performance.onTimeDelivery + this.performance.qualityScore) / 2;
});

supplierSchema.virtual("orderCount", {
   ref: "Order",
   localField: "_id",
   foreignField: "supplier",
   count: true,
});

supplierSchema.virtual("productCount", {
   ref: "Product",
   localField: "_id",
   foreignField: "supplier",
   count: true,
});

// Instance methods
supplierSchema.methods.addContact = function (contactData) {
   // If this is the first contact or marked as primary, unset other primaries
   if (contactData.isPrimary || this.contacts.length === 0) {
      this.contacts.forEach((contact) => (contact.isPrimary = false));
      contactData.isPrimary = true;
   }

   this.contacts.push(contactData);
   return this.save();
};

supplierSchema.methods.updateRating = function (newScore) {
   if (newScore < 1 || newScore > 5) {
      throw new Error("Rating must be between 1 and 5");
   }

   const currentTotal = this.rating.score * this.rating.reviewCount;
   this.rating.reviewCount += 1;
   this.rating.score = (currentTotal + newScore) / this.rating.reviewCount;
   this.rating.lastReviewed = new Date();

   return this.save();
};

supplierSchema.methods.updatePerformance = function (orderData) {
   // Update performance metrics based on order data
   this.performance.totalOrders += 1;
   this.performance.totalValue += orderData.value || 0;

   if (orderData.onTime) {
      const newOnTimeRate =
         (this.performance.onTimeDelivery * (this.performance.totalOrders - 1) + 100) / this.performance.totalOrders;
      this.performance.onTimeDelivery = Math.round(newOnTimeRate);
   }

   if (orderData.leadTime) {
      const newAvgLeadTime =
         (this.performance.averageLeadTime * (this.performance.totalOrders - 1) + orderData.leadTime) /
         this.performance.totalOrders;
      this.performance.averageLeadTime = Math.round(newAvgLeadTime);
   }

   return this.save();
};

supplierSchema.methods.addDocument = function (documentData) {
   this.documents.push({
      ...documentData,
      uploadedAt: new Date(),
   });
   return this.save();
};

supplierSchema.methods.removeDocument = function (documentId) {
   this.documents = this.documents.filter((doc) => doc._id.toString() !== documentId);
   return this.save();
};

supplierSchema.methods.setAsPreferred = function () {
   this.isPreferred = true;
   return this.save();
};

supplierSchema.methods.unsetAsPreferred = function () {
   this.isPreferred = false;
   return this.save();
};

// Static methods
supplierSchema.statics.findByCode = function (code, organizationId) {
   return this.findOne({
      code: code.toUpperCase(),
      organization: organizationId,
   });
};

supplierSchema.statics.findActive = function (organizationId) {
   return this.find({
      organization: organizationId,
      status: "active",
   }).sort({ name: 1 });
};

supplierSchema.statics.findPreferred = function (organizationId) {
   return this.find({
      organization: organizationId,
      status: "active",
      isPreferred: true,
   }).sort({ name: 1 });
};

supplierSchema.statics.findByCategory = function (category, organizationId) {
   return this.find({
      organization: organizationId,
      status: "active",
      categories: category,
   }).sort({ name: 1 });
};

supplierSchema.statics.findTopRated = function (organizationId, limit = 10) {
   return this.find({
      organization: organizationId,
      status: "active",
   })
      .sort({ "rating.score": -1, "performance.totalOrders": -1 })
      .limit(limit);
};

supplierSchema.statics.searchSuppliers = function (query, organizationId) {
   return this.find({
      organization: organizationId,
      status: "active",
      $or: [
         { name: new RegExp(query, "i") },
         { code: new RegExp(query, "i") },
         { "contact.email": new RegExp(query, "i") },
         { categories: new RegExp(query, "i") },
      ],
   }).sort({ name: 1 });
};

supplierSchema.statics.getSupplierStats = async function (organizationId) {
   const stats = await this.aggregate([
      { $match: { organization: mongoose.Types.ObjectId(organizationId), status: "active" } },
      {
         $group: {
            _id: null,
            totalSuppliers: { $sum: 1 },
            preferredCount: { $sum: { $cond: ["$isPreferred", 1, 0] } },
            averageRating: { $avg: "$rating.score" },
            totalValue: { $sum: "$performance.totalValue" },
         },
      },
   ]);

   return (
      stats[0] || {
         totalSuppliers: 0,
         preferredCount: 0,
         averageRating: 0,
         totalValue: 0,
      }
   );
};

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier;
