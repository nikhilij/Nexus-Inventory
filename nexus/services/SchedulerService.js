// services/SchedulerService.js
import { ScheduledJob, JobExecution, JobHistory } from "../models/index.js";
import * as NotificationService from "./NotificationService.js";

class SchedulerService {
   constructor() {
      this.runningJobs = new Map();
      this.jobHandlers = new Map();
      this.intervalId = null;

      // Start the scheduler
      this.start();
   }

   // Schedule a job
   async scheduleJob(jobData) {
      const {
         jobName,
         jobType,
         schedule,
         handler,
         parameters = {},
         enabled = true,
         maxAttempts = 3,
         priority = "normal",
         organization,
      } = jobData;

      // Check if job already exists
      let job = await ScheduledJob.findOne({ jobName, organization });

      if (!job) {
         job = new ScheduledJob({
            organization,
            jobName,
            jobType,
            schedule,
            parameters,
            status: enabled ? "scheduled" : "paused",
            priority,
            maxAttempts,
            runAt: this.calculateNextRunTime(schedule),
            nextRunAt: this.calculateNextRunTime(schedule),
         });
      } else {
         job.jobType = jobType;
         job.schedule = schedule;
         job.parameters = parameters;
         job.status = enabled ? "scheduled" : "paused";
         job.priority = priority;
         job.maxAttempts = maxAttempts;
         job.nextRunAt = this.calculateNextRunTime(schedule);
      }

      await job.save();

      // Register job handler
      if (typeof handler === "function") {
         this.jobHandlers.set(jobName, handler);
      }

      return {
         jobId: job._id,
         jobName: job.jobName,
         nextRunAt: job.nextRunAt,
      };
   }

   // Run a job immediately
   async runNow(jobName, parameters = {}) {
      const job = await ScheduledJob.findOne({ jobName });
      if (!job) {
         throw new Error("Job not found");
      }

      // Execute job
      const execution = await this.executeJob(job, parameters);

      return {
         jobId: job._id,
         executionId: execution._id,
         status: execution.status,
         startedAt: execution.startedAt,
         completedAt: execution.completedAt,
      };
   }

   // Get job history
   async jobHistory(jobName, limit = 20) {
      const executions = await JobExecution.find({ jobName }).sort({ startedAt: -1 }).limit(limit);

      return executions.map((execution) => ({
         id: execution._id,
         jobName: execution.jobName,
         status: execution.status,
         startedAt: execution.startedAt,
         completedAt: execution.completedAt,
         duration: execution.duration,
         error: execution.error,
         retryCount: execution.retryCount,
      }));
   }

   // Start the scheduler
   start() {
      if (this.intervalId) {
         clearInterval(this.intervalId);
      }

      // Check for due jobs every minute
      this.intervalId = setInterval(() => {
         this.checkDueJobs();
      }, 60000);
   }

   // Stop the scheduler
   stop() {
      if (this.intervalId) {
         clearInterval(this.intervalId);
         this.intervalId = null;
      }
   }

   // Check for due jobs
   async checkDueJobs() {
      const now = new Date();

      const dueJobs = await ScheduledJob.find({
         status: { $in: ["scheduled", "queued"] },
         nextRunAt: { $lte: now },
      });

      for (const job of dueJobs) {
         // Check if job is already running
         if (this.runningJobs.has(job.jobName)) {
            continue;
         }

         // Execute job asynchronously
         this.executeJob(job).catch((error) => {
            console.error(`Error executing job ${job.jobName}:`, error);
         });
      }
   }

   // Execute a job
   async executeJob(job, overrideParameters = null) {
      const execution = new JobExecution({
         jobId: job._id,
         jobName: job.jobName,
         status: "running",
         startedAt: new Date(),
         retryCount: 0,
      });

      await execution.save();

      // Update job status
      job.status = "running";
      job.startedAt = new Date();
      job.attempts = (job.attempts || 0) + 1;
      await job.save();

      // Mark job as running
      this.runningJobs.set(job.jobName, execution._id);

      try {
         // Get job handler
         const handler = this.jobHandlers.get(job.jobName) || this.getDefaultHandler(job.jobType);

         // Execute with timeout
         const result = await this.executeWithTimeout(
            handler,
            [overrideParameters || job.parameters],
            300000 // 5 minutes default timeout
         );

         // Update execution
         execution.status = "completed";
         execution.completedAt = new Date();
         execution.duration = execution.completedAt - execution.startedAt;
         execution.result = result;

         // Update job
         job.status = "completed";
         job.completedAt = new Date();
         job.lastRunAt = new Date();
         job.result = {
            success: true,
            data: result,
            duration: execution.duration,
         };
         job.nextRunAt = this.calculateNextRunTime(job.schedule);
      } catch (error) {
         execution.status = "failed";
         execution.completedAt = new Date();
         execution.duration = execution.completedAt - execution.startedAt;
         execution.error = error.message;

         // Update job
         job.status = "failed";
         job.failedAt = new Date();
         job.result = {
            success: false,
            error: {
               message: error.message,
               code: error.code,
               stack: error.stack,
            },
            duration: execution.duration,
         };

         // Handle retries
         if (job.attempts < job.maxAttempts) {
            execution.retryCount++;
            execution.status = "retrying";
            job.status = "retrying";

            // Schedule retry with exponential backoff
            const delay = Math.pow(2, job.attempts) * 60000; // minutes
            setTimeout(() => {
               this.executeJob(job, overrideParameters);
            }, delay);
         } else {
            // Send failure notification
            await NotificationService.sendEmail(
               "admin@example.com",
               `Job Failed: ${job.jobName}`,
               `Job ${job.jobName} failed after ${job.maxAttempts} attempts. Error: ${error.message}`
            );
         }
      } finally {
         // Remove from running jobs
         this.runningJobs.delete(job.jobName);
      }

      await execution.save();
      await job.save();
      return execution;
   }

   // Execute function with timeout
   async executeWithTimeout(handler, args, timeout) {
      return new Promise((resolve, reject) => {
         const timer = setTimeout(() => {
            reject(new Error("Job execution timed out"));
         }, timeout);

         handler(...args)
            .then((result) => {
               clearTimeout(timer);
               resolve(result);
            })
            .catch((error) => {
               clearTimeout(timer);
               reject(error);
            });
      });
   }

   // Calculate next run time based on schedule
   calculateNextRunTime(schedule) {
      const now = new Date();

      if (schedule.type === "once") {
         return schedule.runAt || now;
      }

      if (schedule.type === "recurring") {
         if (schedule.cronExpression) {
            return this.parseCronExpression(schedule.cronExpression, now);
         }

         if (schedule.interval) {
            const { value, unit } = schedule.interval;
            const next = new Date(now);

            switch (unit) {
               case "minutes":
                  next.setMinutes(next.getMinutes() + value);
                  break;
               case "hours":
                  next.setHours(next.getHours() + value);
                  break;
               case "days":
                  next.setDate(next.getDate() + value);
                  break;
               case "weeks":
                  next.setDate(next.getDate() + value * 7);
                  break;
               case "months":
                  next.setMonth(next.getMonth() + value);
                  break;
               default:
                  next.setHours(next.getHours() + 1); // Default to 1 hour
            }

            return next;
         }
      }

      // Default to run in 1 hour
      const defaultNext = new Date(now);
      defaultNext.setHours(defaultNext.getHours() + 1);
      return defaultNext;
   }

   // Parse cron expression (simplified)
   parseCronExpression(cronExpression, now) {
      // This is a simplified cron parser
      // In a real implementation, use a proper cron library
      const parts = cronExpression.split(" ");
      if (parts.length !== 5) {
         throw new Error("Invalid cron expression");
      }

      const [minute, hour, day, month, dayOfWeek] = parts;

      let next = new Date(now);

      // Handle different cron patterns
      if (minute === "*" && hour === "*") {
         // Every minute
         next.setMinutes(next.getMinutes() + 1);
      } else if (hour === "*" && minute !== "*") {
         // Every hour at specific minute
         next.setMinutes(parseInt(minute));
         if (next <= now) {
            next.setHours(next.getHours() + 1);
         }
      } else if (day === "*" && hour !== "*" && minute !== "*") {
         // Daily at specific time
         next.setHours(parseInt(hour), parseInt(minute), 0, 0);
         if (next <= now) {
            next.setDate(next.getDate() + 1);
         }
      } else {
         // Specific time
         next.setHours(parseInt(hour), parseInt(minute), 0, 0);
         if (next <= now) {
            next.setDate(next.getDate() + 1);
         }
      }

      return next;
   }

   // Get default handler for job type
   getDefaultHandler(jobType) {
      const handlers = {
         report_generation: async (parameters) => {
            // Generate report
            return { message: "Report generated", parameters };
         },

         data_cleanup: async (parameters) => {
            // Clean up old data
            return { message: "Data cleanup completed", parameters };
         },

         email_notification: async (parameters) => {
            // Send email
            await NotificationService.sendEmail(parameters.to, parameters.subject, parameters.body);
            return { message: "Email sent", parameters };
         },

         backup: async (parameters) => {
            // Perform backup
            return { message: "Backup completed", parameters };
         },

         inventory_sync: async (parameters) => {
            // Sync inventory
            return { message: "Inventory sync completed", parameters };
         },

         low_stock_alert: async (parameters) => {
            // Send low stock alerts
            return { message: "Low stock alerts sent", parameters };
         },
      };

      return (
         handlers[jobType] ||
         (async (parameters) => {
            console.log(`Executing job with parameters:`, parameters);
            return { message: "Job executed", parameters };
         })
      );
   }

   // Get all scheduled jobs
   async getScheduledJobs() {
      const jobs = await ScheduledJob.find().sort({ nextRunAt: 1 });

      return jobs.map((job) => ({
         id: job._id,
         jobName: job.jobName,
         jobType: job.jobType,
         status: job.status,
         nextRunAt: job.nextRunAt,
         lastRunAt: job.lastRunAt,
         schedule: job.schedule,
         priority: job.priority,
      }));
   }

   // Enable/disable job
   async toggleJob(jobName, enabled) {
      const status = enabled ? "scheduled" : "paused";
      const job = await ScheduledJob.findOneAndUpdate({ jobName }, { status }, { new: true });

      if (!job) {
         throw new Error("Job not found");
      }

      return job;
   }

   // Delete job
   async deleteJob(jobName) {
      const job = await ScheduledJob.findOneAndDelete({ jobName });
      if (!job) {
         throw new Error("Job not found");
      }

      // Delete job executions
      await JobExecution.deleteMany({ jobName });

      // Remove from running jobs
      this.runningJobs.delete(jobName);

      return { success: true, message: "Job deleted successfully" };
   }

   // Get job statistics
   async getJobStats(jobName) {
      const executions = await JobExecution.find({ jobName });

      const stats = {
         total: executions.length,
         completed: executions.filter((e) => e.status === "completed").length,
         failed: executions.filter((e) => e.status === "failed").length,
         running: executions.filter((e) => e.status === "running").length,
         averageDuration: 0,
         successRate: 0,
      };

      const completedExecutions = executions.filter((e) => e.status === "completed");
      if (completedExecutions.length > 0) {
         const totalDuration = completedExecutions.reduce((sum, e) => sum + e.duration, 0);
         stats.averageDuration = totalDuration / completedExecutions.length;
      }

      if (stats.total > 0) {
         stats.successRate = (stats.completed / stats.total) * 100;
      }

      return stats;
   }
}

const schedulerService = new SchedulerService();
export default schedulerService;
