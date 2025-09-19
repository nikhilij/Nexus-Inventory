// models/Warehouse.js
import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
         trim: true,
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
      location: {
         address: {
            street: String,
            city: {
               type: String,
               required: true,
            },
            state: String,
            zipCode: String,
            country: {
               type: String,
               required: true,
               default: "US",
            },
         },
         coordinates: {
            latitude: Number,
            longitude: Number,
         },
      },
      contact: {
         phone: String,
         email: String,
         manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
         },
      },
      capacity: {
         total: {
            type: Number,
            min: 0,
         },
         used: {
            type: Number,
            default: 0,
            min: 0,
         },
         unit: {
            type: String,
            enum: ["sqft", "sqm", "pallets", "items"],
            default: "sqft",
         },
      },
      zones: [
         {
            name: {
               type: String,
               required: true,
               trim: true,
            },
            code: {
               type: String,
               required: true,
               trim: true,
               uppercase: true,
            },
            type: {
               type: String,
               enum: ["storage", "picking", "shipping", "receiving", "damaged"],
               default: "storage",
            },
            capacity: Number,
            temperature: {
               min: Number,
               max: Number,
               unit: {
                  type: String,
                  enum: ["celsius", "fahrenheit"],
                  default: "celsius",
               },
            },
         },
      ],
      operatingHours: {
         monday: { open: String, close: String },
         tuesday: { open: String, close: String },
         wednesday: { open: String, close: String },
         thursday: { open: String, close: String },
         friday: { open: String, close: String },
         saturday: { open: String, close: String },
         sunday: { open: String, close: String },
      },
      settings: {
         allowNegativeStock: {
            type: Boolean,
            default: false,
         },
         autoReorder: {
            type: Boolean,
            default: false,
         },
         trackBatches: {
            type: Boolean,
            default: true,
         },
         trackExpiry: {
            type: Boolean,
            default: true,
         },
      },
      status: {
         type: String,
         enum: ["active", "inactive", "maintenance", "closed"],
         default: "active",
      },
      isPrimary: {
         type: Boolean,
         default: false,
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
warehouseSchema.index({ organization: 1 });
warehouseSchema.index({ status: 1 });
warehouseSchema.index({ isPrimary: 1 });
warehouseSchema.index({ "location.address.city": 1 });
warehouseSchema.index({ "location.address.country": 1 });

// Compound indexes
warehouseSchema.index({ organization: 1, code: 1 }, { unique: true });
warehouseSchema.index({ organization: 1, isPrimary: 1 });

// Virtuals
warehouseSchema.virtual("availableCapacity").get(function () {
   if (this.capacity.total) {
      return this.capacity.total - this.capacity.used;
   }
   return null;
});

warehouseSchema.virtual("utilizationRate").get(function () {
   if (this.capacity.total && this.capacity.total > 0) {
      return (this.capacity.used / this.capacity.total) * 100;
   }
   return 0;
});

warehouseSchema.virtual("inventoryItemCount", {
   ref: "InventoryItem",
   localField: "_id",
   foreignField: "warehouse",
   count: true,
});

// Instance methods
warehouseSchema.methods.updateCapacity = function (used) {
   this.capacity.used = Math.max(0, used);
   return this.save();
};

warehouseSchema.methods.addZone = function (zoneData) {
   this.zones.push(zoneData);
   return this.save();
};

warehouseSchema.methods.removeZone = function (zoneId) {
   this.zones = this.zones.filter((zone) => zone._id.toString() !== zoneId);
   return this.save();
};

warehouseSchema.methods.getZone = function (zoneCode) {
   return this.zones.find((zone) => zone.code === zoneCode.toUpperCase());
};

warehouseSchema.methods.isOpen = function (dayOfWeek, time) {
   const daySchedule = this.operatingHours[dayOfWeek.toLowerCase()];
   if (!daySchedule || !daySchedule.open || !daySchedule.close) {
      return false;
   }

   const openTime = new Date(`1970-01-01T${daySchedule.open}:00`);
   const closeTime = new Date(`1970-01-01T${daySchedule.close}:00`);
   const checkTime = new Date(`1970-01-01T${time}:00`);

   return checkTime >= openTime && checkTime <= closeTime;
};

// Static methods
warehouseSchema.statics.findByCode = function (code, organizationId) {
   return this.findOne({ code: code.toUpperCase(), organization: organizationId });
};

warehouseSchema.statics.findByOrganization = function (organizationId) {
   return this.find({ organization: organizationId, status: "active" }).sort({ isPrimary: -1, name: 1 });
};

warehouseSchema.statics.findPrimary = function (organizationId) {
   return this.findOne({ organization: organizationId, isPrimary: true, status: "active" });
};

warehouseSchema.statics.findByLocation = function (city, country, organizationId) {
   return this.find({
      organization: organizationId,
      "location.address.city": new RegExp(city, "i"),
      "location.address.country": new RegExp(country, "i"),
      status: "active",
   });
};

const Warehouse = mongoose.model("Warehouse", warehouseSchema);

export default Warehouse;
