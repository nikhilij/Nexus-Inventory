// models/Batch.js
import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
   {
      lotNumber: {
         type: String,
         required: true,
         trim: true,
         uppercase: true,
      },
      batchNumber: {
         type: String,
         trim: true,
         uppercase: true,
      },
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
      supplier: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Supplier",
      },
      warehouse: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Warehouse",
      },
      quantity: {
         initial: {
            type: Number,
            required: true,
            min: 0,
         },
         current: {
            type: Number,
            default: function () {
               return this.quantity.initial;
            },
            min: 0,
         },
         unit: {
            type: String,
            default: "pieces",
            trim: true,
         },
      },
      manufacturing: {
         date: Date,
         location: String,
         facility: String,
         line: String,
         operator: String,
      },
      expiry: {
         date: Date,
         isExpired: {
            type: Boolean,
            default: false,
         },
         daysUntilExpiry: Number,
         warningDays: {
            type: Number,
            default: 30,
            min: 1,
         },
      },
      quality: {
         status: {
            type: String,
            enum: ["pending", "approved", "rejected", "quarantined"],
            default: "pending",
         },
         approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
         },
         approvedAt: Date,
         rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
         },
         rejectedAt: Date,
         rejectionReason: String,
         testResults: [
            {
               testName: String,
               result: String,
               status: {
                  type: String,
                  enum: ["pass", "fail", "pending"],
               },
               testedAt: Date,
               testedBy: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "User",
               },
            },
         ],
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
            trim: true,
         },
      },
      storage: {
         temperature: {
            min: Number,
            max: Number,
            unit: {
               type: String,
               enum: ["celsius", "fahrenheit"],
               default: "celsius",
            },
         },
         humidity: {
            min: Number,
            max: Number,
            unit: {
               type: String,
               enum: ["percent"],
               default: "percent",
            },
         },
         conditions: [String], // e.g., ['refrigerated', 'dry', 'dark']
      },
      tracking: {
         serialNumbers: [String],
         rfidTags: [String],
         barcodes: [String],
      },
      status: {
         type: String,
         enum: ["active", "expired", "consumed", "discarded", "quarantined"],
         default: "active",
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
batchSchema.index({ lotNumber: 1 });
batchSchema.index({ batchNumber: 1 });
batchSchema.index({ product: 1 });
batchSchema.index({ organization: 1 });
batchSchema.index({ supplier: 1 });
batchSchema.index({ warehouse: 1 });
batchSchema.index({ "expiry.date": 1 });
batchSchema.index({ "quality.status": 1 });
batchSchema.index({ status: 1 });

// Compound indexes
batchSchema.index({ product: 1, lotNumber: 1 }, { unique: true });
batchSchema.index({ organization: 1, product: 1 });
batchSchema.index({ organization: 1, status: 1 });
batchSchema.index({ organization: 1, "expiry.date": 1 });
batchSchema.index({ organization: 1, "quality.status": 1 });

// Virtuals
batchSchema.virtual("isExpired").get(function () {
   return this.expiry.date && this.expiry.date < new Date();
});

batchSchema.virtual("isExpiringSoon").get(function () {
   if (!this.expiry.date) return false;
   const warningDate = new Date();
   warningDate.setDate(warningDate.getDate() + this.expiry.warningDays);
   return this.expiry.date <= warningDate && this.expiry.date > new Date();
});

batchSchema.virtual("daysUntilExpiry").get(function () {
   if (!this.expiry.date) return null;
   if (this.isExpired) return 0;
   const diffTime = this.expiry.date - new Date();
   return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

batchSchema.virtual("utilizationRate").get(function () {
   if (this.quantity.initial === 0) return 0;
   return ((this.quantity.initial - this.quantity.current) / this.quantity.initial) * 100;
});

batchSchema.virtual("remainingValue").get(function () {
   if (!this.cost.unitCost) return 0;
   return this.cost.unitCost * this.quantity.current;
});

// Pre-save middleware
batchSchema.pre("save", function (next) {
   // Update expiry status
   if (this.expiry.date) {
      this.expiry.isExpired = this.expiry.date < new Date();
      this.expiry.daysUntilExpiry = this.daysUntilExpiry;
   }

   // Update total cost
   if (this.cost.unitCost && this.quantity.initial) {
      this.cost.totalCost = this.cost.unitCost * this.quantity.initial;
   }

   next();
});

// Instance methods
batchSchema.methods.consume = function (quantity) {
   if (quantity > this.quantity.current) {
      throw new Error("Insufficient quantity in batch");
   }
   this.quantity.current -= quantity;

   if (this.quantity.current === 0) {
      this.status = "consumed";
   }

   return this.save();
};

batchSchema.methods.adjustQuantity = function (adjustment) {
   this.quantity.current = Math.max(0, this.quantity.current + adjustment);
   return this.save();
};

batchSchema.methods.approve = function (userId) {
   this.quality.status = "approved";
   this.quality.approvedBy = userId;
   this.quality.approvedAt = new Date();
   return this.save();
};

batchSchema.methods.reject = function (userId, reason) {
   this.quality.status = "rejected";
   this.quality.rejectedBy = userId;
   this.quality.rejectedAt = new Date();
   this.quality.rejectionReason = reason;
   this.status = "discarded";
   return this.save();
};

batchSchema.methods.quarantine = function () {
   this.quality.status = "quarantined";
   this.status = "quarantined";
   return this.save();
};

batchSchema.methods.discard = function () {
   this.status = "discarded";
   return this.save();
};

batchSchema.methods.addTestResult = function (testName, result, status, userId) {
   this.quality.testResults.push({
      testName,
      result,
      status,
      testedAt: new Date(),
      testedBy: userId,
   });
   return this.save();
};

batchSchema.methods.isQualityApproved = function () {
   return this.quality.status === "approved";
};

// Static methods
batchSchema.statics.findByLotNumber = function (lotNumber, organizationId) {
   return this.findOne({
      lotNumber: lotNumber.toUpperCase(),
      organization: organizationId,
   });
};

batchSchema.statics.findByProduct = function (productId, organizationId) {
   return this.find({
      product: productId,
      organization: organizationId,
      status: "active",
   }).sort({ "expiry.date": 1 });
};

batchSchema.statics.findExpired = function (organizationId) {
   return this.find({
      organization: organizationId,
      "expiry.date": { $lt: new Date() },
      status: "active",
   }).populate("product", "name sku");
};

batchSchema.statics.findExpiringSoon = function (organizationId, days = 30) {
   const futureDate = new Date();
   futureDate.setDate(futureDate.getDate() + days);

   return this.find({
      organization: organizationId,
      "expiry.date": { $lte: futureDate, $gte: new Date() },
      status: "active",
   }).populate("product", "name sku");
};

batchSchema.statics.findByQualityStatus = function (organizationId, status) {
   return this.find({
      organization: organizationId,
      "quality.status": status,
   }).populate("product", "name sku");
};

batchSchema.statics.findLowStock = function (organizationId, threshold = 10) {
   return this.find({
      organization: organizationId,
      status: "active",
      $expr: { $lte: ["$quantity.current", threshold] },
   }).populate("product", "name sku");
};

batchSchema.statics.getBatchStats = async function (organizationId) {
   const stats = await this.aggregate([
      { $match: { organization: mongoose.Types.ObjectId(organizationId) } },
      {
         $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalQuantity: { $sum: "$quantity.current" },
            totalValue: { $sum: "$remainingValue" },
         },
      },
   ]);

   return stats;
};

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;
