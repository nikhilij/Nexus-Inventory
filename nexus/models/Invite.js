// models/Invite.js
import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema(
   {
      email: {
         type: String,
         required: true,
         lowercase: true,
         trim: true,
         validate: {
            validator: function (v) {
               return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: "Please enter a valid email address",
         },
      },
      token: {
         type: String,
         required: true,
         unique: true,
         trim: true,
      },
      tokenHash: {
         type: String,
         required: true,
      },
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      invitedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      role: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Role",
         required: true,
      },
      teams: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
         },
      ],
      permissions: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Permission",
         },
      ],
      inviteType: {
         type: String,
         enum: ["organization", "team", "project"],
         default: "organization",
      },
      status: {
         type: String,
         enum: ["pending", "accepted", "expired", "cancelled"],
         default: "pending",
      },
      expiresAt: {
         type: Date,
         required: true,
         default: function () {
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
         },
      },
      acceptedAt: Date,
      acceptedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      cancelledAt: Date,
      cancelledBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      metadata: {
         userAgent: String,
         ipAddress: String,
         invitedFrom: String,
      },
      maxUses: {
         type: Number,
         default: 1,
         min: 1,
      },
      usesCount: {
         type: Number,
         default: 0,
         min: 0,
      },
      customMessage: {
         type: String,
         trim: true,
         maxlength: 1000,
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes
inviteSchema.index({ tokenHash: 1 });
inviteSchema.index({ organization: 1 });
inviteSchema.index({ invitedBy: 1 });
inviteSchema.index({ status: 1 });
inviteSchema.index({ expiresAt: 1 });
inviteSchema.index({ acceptedBy: 1 });

// Compound indexes
inviteSchema.index({ organization: 1, email: 1 });
inviteSchema.index({ organization: 1, status: 1 });
inviteSchema.index({ organization: 1, expiresAt: 1 });
inviteSchema.index({ email: 1, status: 1 });

// Virtuals
inviteSchema.virtual("isExpired").get(function () {
   return this.expiresAt < new Date();
});

inviteSchema.virtual("isValid").get(function () {
   return this.status === "pending" && !this.isExpired && this.usesCount < this.maxUses;
});

inviteSchema.virtual("daysUntilExpiry").get(function () {
   if (this.isExpired) return 0;
   const diffTime = this.expiresAt - new Date();
   return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
inviteSchema.pre("save", function (next) {
   if (this.isModified("token")) {
      // In a real app, you'd hash the token here
      this.tokenHash = this.token;
   }
   next();
});

// Instance methods
inviteSchema.methods.accept = function (userId) {
   if (!this.isValid) {
      throw new Error("Invite is not valid");
   }

   this.status = "accepted";
   this.acceptedAt = new Date();
   this.acceptedBy = userId;
   this.usesCount += 1;

   return this.save();
};

inviteSchema.methods.cancel = function (userId) {
   if (this.status !== "pending") {
      throw new Error("Can only cancel pending invites");
   }

   this.status = "cancelled";
   this.cancelledAt = new Date();
   this.cancelledBy = userId;

   return this.save();
};

inviteSchema.methods.extendExpiry = function (days = 7) {
   if (this.status !== "pending") {
      throw new Error("Can only extend pending invites");
   }

   this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
   return this.save();
};

inviteSchema.methods.canBeUsed = function () {
   return this.status === "pending" && !this.isExpired && this.usesCount < this.maxUses;
};

// Static methods
inviteSchema.statics.findValidInvites = function (organizationId) {
   return this.find({
      organization: organizationId,
      status: "pending",
      expiresAt: { $gt: new Date() },
      $expr: { $lt: ["$usesCount", "$maxUses"] },
   });
};

inviteSchema.statics.findExpiredInvites = function (organizationId) {
   return this.find({
      organization: organizationId,
      status: "pending",
      expiresAt: { $lt: new Date() },
   });
};

inviteSchema.statics.findByToken = function (token) {
   return this.findOne({
      token: token,
      status: "pending",
      expiresAt: { $gt: new Date() },
   }).populate("organization invitedBy role teams permissions");
};

inviteSchema.statics.findByEmail = function (email, organizationId) {
   return this.find({
      email: email.toLowerCase(),
      organization: organizationId,
   }).sort({ createdAt: -1 });
};

inviteSchema.statics.cleanupExpired = function () {
   return this.updateMany(
      {
         status: "pending",
         expiresAt: { $lt: new Date() },
      },
      {
         status: "expired",
      }
   );
};

const Invite = mongoose.model("Invite", inviteSchema);

export default Invite;
