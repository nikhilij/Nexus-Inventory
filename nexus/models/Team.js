// models/Team.js
import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
         trim: true,
         maxlength: 100,
      },
      description: {
         type: String,
         trim: true,
         maxlength: 500,
      },
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      leader: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      members: [
         {
            user: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "User",
               required: true,
            },
            role: {
               type: String,
               enum: ["member", "admin", "viewer"],
               default: "member",
            },
            joinedAt: {
               type: Date,
               default: Date.now,
            },
         },
      ],
      parentTeam: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Team",
      },
      subTeams: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
         },
      ],
      settings: {
         isPrivate: {
            type: Boolean,
            default: false,
         },
         allowSelfJoin: {
            type: Boolean,
            default: true,
         },
         maxMembers: {
            type: Number,
            min: 1,
            max: 1000,
         },
      },
      color: {
         type: String,
         default: "#3B82F6",
         validate: {
            validator: function (v) {
               return /^#[0-9A-F]{6}$/i.test(v);
            },
            message: "Color must be a valid hex color code",
         },
      },
      avatar: {
         type: String,
         trim: true,
      },
      tags: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tag",
         },
      ],
      isActive: {
         type: Boolean,
         default: true,
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
teamSchema.index({ name: 1 });
teamSchema.index({ organization: 1 });
teamSchema.index({ leader: 1 });
teamSchema.index({ parentTeam: 1 });
teamSchema.index({ isActive: 1 });
teamSchema.index({ "members.user": 1 });
teamSchema.index({ organization: 1, name: 1 }, { unique: true });

// Compound indexes
teamSchema.index({ organization: 1, isActive: 1 });
teamSchema.index({ organization: 1, leader: 1 });

// Virtuals
teamSchema.virtual("memberCount").get(function () {
   return this.members.length;
});

teamSchema.virtual("activeMembers").get(function () {
   return this.members.filter((member) => member.role !== "viewer").length;
});

// Instance methods
teamSchema.methods.addMember = function (userId, role = "member") {
   if (!this.members.some((member) => member.user.toString() === userId.toString())) {
      this.members.push({
         user: userId,
         role: role,
         joinedAt: new Date(),
      });
      return this.save();
   }
   return this;
};

teamSchema.methods.removeMember = function (userId) {
   this.members = this.members.filter((member) => member.user.toString() !== userId.toString());
   return this.save();
};

teamSchema.methods.updateMemberRole = function (userId, newRole) {
   const member = this.members.find((member) => member.user.toString() === userId.toString());
   if (member) {
      member.role = newRole;
      return this.save();
   }
   throw new Error("Member not found in team");
};

teamSchema.methods.isMember = function (userId) {
   return this.members.some((member) => member.user.toString() === userId.toString());
};

teamSchema.methods.isAdmin = function (userId) {
   return this.members.some((member) => member.user.toString() === userId.toString() && member.role === "admin");
};

teamSchema.methods.getHierarchyLevel = async function () {
   let level = 0;
   let current = this;

   while (current.parentTeam) {
      const parent = await mongoose.model("Team").findById(current.parentTeam);
      if (!parent) break;
      level++;
      current = parent;
   }

   return level;
};

// Static methods
teamSchema.statics.findByOrganization = function (organizationId) {
   return this.find({ organization: organizationId, isActive: true })
      .populate("leader", "name email")
      .populate("members.user", "name email")
      .sort({ name: 1 });
};

teamSchema.statics.findUserTeams = function (userId, organizationId) {
   return this.find({
      organization: organizationId,
      "members.user": userId,
      isActive: true,
   }).populate("leader", "name email");
};

teamSchema.statics.findRootTeams = function (organizationId) {
   return this.find({
      organization: organizationId,
      parentTeam: null,
      isActive: true,
   }).sort({ name: 1 });
};

teamSchema.statics.findSubTeams = function (parentTeamId) {
   return this.find({
      parentTeam: parentTeamId,
      isActive: true,
   }).sort({ name: 1 });
};

const Team = mongoose.model("Team", teamSchema);

export default Team;
