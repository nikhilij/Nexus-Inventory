// models/JobExecution.js
import mongoose from "mongoose";

const jobExecutionSchema = new mongoose.Schema(
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
      status: {
         type: String,
         enum: ["running", "completed", "failed", "retrying"],
         default: "running",
      },
      startedAt: {
         type: Date,
         default: Date.now,
      },
      completedAt: {
         type: Date,
      },
      duration: {
         type: Number, // in milliseconds
      },
      retryCount: {
         type: Number,
         default: 0,
      },
      error: {
         type: String,
      },
      result: {
         type: mongoose.Schema.Types.Mixed,
      },
      data: {
         type: mongoose.Schema.Types.Mixed,
      },
   },
   {
      timestamps: true,
   }
);

// Indexes
jobExecutionSchema.index({ jobName: 1, startedAt: -1 });
jobExecutionSchema.index({ status: 1, startedAt: -1 });

const JobExecution = mongoose.model("JobExecution", jobExecutionSchema);

export default JobExecution;
