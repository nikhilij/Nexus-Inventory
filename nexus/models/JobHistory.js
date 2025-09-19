// models/JobHistory.js
import mongoose from "mongoose";

const jobHistorySchema = new mongoose.Schema(
   {
      jobId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "ScheduledJob",
         required: true,
      },
      jobName: {
         type: String,
         required: true,
         index: true,
      },
      action: {
         type: String,
         enum: ["scheduled", "executed", "failed", "cancelled", "modified"],
         required: true,
      },
      timestamp: {
         type: Date,
         default: Date.now,
      },
      details: {
         type: mongoose.Schema.Types.Mixed,
      },
      userId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
   },
   {
      timestamps: true,
   }
);

// Indexes
jobHistorySchema.index({ jobName: 1, timestamp: -1 });
jobHistorySchema.index({ action: 1, timestamp: -1 });

const JobHistory = mongoose.model("JobHistory", jobHistorySchema);

export default JobHistory;
