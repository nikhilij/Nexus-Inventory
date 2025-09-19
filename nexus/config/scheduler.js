// Cron / job scheduling configuration
// Example using node-cron
import cron from "node-cron";

export function setupScheduler() {
   // Example job: runs every day at midnight
   cron.schedule("0 0 * * *", () => {
      console.log("Running a daily scheduled job.");
      // import('../services/ReportingService').then(service => service.generateDailyReports());
   });
}
