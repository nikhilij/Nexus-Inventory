// example-scheduler-usage.js
import SchedulerService from "./services/SchedulerService.js";
import mongoose from "mongoose";

// Connect to MongoDB (replace with your connection string)
await mongoose.connect("mongodb://localhost:27017/nexus-inventory", {
   useNewUrlParser: true,
   useUnifiedTopology: true,
});

// Example usage of SchedulerService
async function demonstrateScheduler() {
   try {
      // Schedule a daily report generation job
      const reportJob = await SchedulerService.scheduleJob({
         jobName: "daily-sales-report",
         jobType: "report_generation",
         schedule: {
            type: "recurring",
            cronExpression: "0 9 * * *", // Every day at 9 AM
            timezone: "UTC",
         },
         parameters: {
            reportType: "sales",
            dateRange: "daily",
            emailRecipients: ["manager@example.com"],
         },
         priority: "high",
         organization: new mongoose.Types.ObjectId(), // Replace with actual org ID
      });

      console.log("Scheduled daily report job:", reportJob);

      // Schedule a weekly data cleanup job
      const cleanupJob = await SchedulerService.scheduleJob({
         jobName: "weekly-data-cleanup",
         jobType: "data_cleanup",
         schedule: {
            type: "recurring",
            interval: {
               value: 1,
               unit: "weeks",
            },
            timezone: "UTC",
         },
         parameters: {
            retentionDays: 90,
            tables: ["audit_logs", "temp_files"],
         },
         priority: "normal",
         organization: new mongoose.Types.ObjectId(), // Replace with actual org ID
      });

      console.log("Scheduled cleanup job:", cleanupJob);

      // Run a job immediately
      const immediateResult = await SchedulerService.runNow("daily-sales-report", {
         customDate: new Date().toISOString(),
      });

      console.log("Immediate job execution result:", immediateResult);

      // Get job history
      const history = await SchedulerService.jobHistory("daily-sales-report", 5);
      console.log("Job history:", history);

      // Get all scheduled jobs
      const allJobs = await SchedulerService.getScheduledJobs();
      console.log("All scheduled jobs:", allJobs);

      // Get job statistics
      const stats = await SchedulerService.getJobStats("daily-sales-report");
      console.log("Job statistics:", stats);
   } catch (error) {
      console.error("Error demonstrating scheduler:", error);
   }
}

// Run the demonstration
demonstrateScheduler()
   .then(() => {
      console.log("Scheduler demonstration completed");
      process.exit(0);
   })
   .catch((error) => {
      console.error("Scheduler demonstration failed:", error);
      process.exit(1);
   });
