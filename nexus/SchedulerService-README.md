# SchedulerService Documentation

The SchedulerService provides comprehensive job scheduling and execution capabilities for the Nexus-Inventory application. It supports various job types, scheduling patterns, and includes robust error handling and monitoring features.

## Features

- **Flexible Scheduling**: Support for one-time and recurring jobs
- **Multiple Schedule Types**: Cron expressions, intervals, and custom schedules
- **Job Types**: Predefined handlers for common tasks (reports, cleanup, notifications, etc.)
- **Custom Handlers**: Support for custom job handlers
- **Retry Logic**: Automatic retry with exponential backoff
- **Monitoring**: Job execution tracking and statistics
- **Priority System**: Job prioritization (low, normal, high, critical)
- **Timeout Protection**: Configurable job execution timeouts
- **Notification Integration**: Automatic failure notifications

## Job Types

The service includes predefined handlers for common job types:

- `report_generation`: Generate scheduled reports
- `data_cleanup`: Clean up old data and temporary files
- `email_notification`: Send scheduled email notifications
- `backup`: Perform system backups
- `inventory_sync`: Synchronize inventory data
- `low_stock_alert`: Send low stock alerts

## Scheduling Options

### One-time Jobs

```javascript
schedule: {
  type: 'once',
  runAt: new Date('2024-12-31T23:59:59Z')
}
```

### Recurring Jobs with Cron

```javascript
schedule: {
  type: 'recurring',
  cronExpression: '0 9 * * 1', // Every Monday at 9 AM
  timezone: 'UTC'
}
```

### Recurring Jobs with Intervals

```javascript
schedule: {
  type: 'recurring',
  interval: {
    value: 2,
    unit: 'hours' // minutes, hours, days, weeks, months
  },
  timezone: 'UTC'
}
```

## API Methods

### scheduleJob(jobData)

Schedules a new job or updates an existing one.

**Parameters:**

- `jobName`: Unique job identifier
- `jobType`: Type of job (see predefined types above)
- `schedule`: Scheduling configuration
- `parameters`: Job-specific parameters
- `priority`: Job priority (low, normal, high, critical)
- `maxAttempts`: Maximum retry attempts (default: 3)
- `organization`: Organization ID for multi-tenant support

**Returns:** Job scheduling result with ID and next run time

### runNow(jobName, parameters)

Executes a job immediately with optional parameter overrides.

**Parameters:**

- `jobName`: Name of the job to execute
- `parameters`: Optional parameter overrides

**Returns:** Execution result with status and timing information

### jobHistory(jobName, limit)

Retrieves execution history for a specific job.

**Parameters:**

- `jobName`: Name of the job
- `limit`: Maximum number of history entries (default: 20)

**Returns:** Array of execution records

### getScheduledJobs()

Retrieves all scheduled jobs with their current status.

**Returns:** Array of job information including schedule and status

### toggleJob(jobName, enabled)

Enables or disables a scheduled job.

**Parameters:**

- `jobName`: Name of the job
- `enabled`: Whether to enable (true) or disable (false) the job

### deleteJob(jobName)

Permanently deletes a job and its execution history.

**Parameters:**

- `jobName`: Name of the job to delete

### getJobStats(jobName)

Retrieves statistics for a specific job.

**Parameters:**

- `jobName`: Name of the job

**Returns:** Statistics including success rate, average duration, and execution counts

## Custom Job Handlers

You can register custom job handlers for specific job types:

```javascript
// Register a custom handler
SchedulerService.jobHandlers.set("my-custom-job", async (parameters) => {
   // Your custom logic here
   console.log("Executing custom job with parameters:", parameters);

   // Perform your job logic
   const result = await performCustomTask(parameters);

   return {
      success: true,
      message: "Custom job completed",
      data: result,
   };
});

// Schedule a job with the custom handler
await SchedulerService.scheduleJob({
   jobName: "my-custom-job",
   jobType: "custom",
   schedule: {
      /* schedule config */
   },
   handler: SchedulerService.jobHandlers.get("my-custom-job"),
   parameters: {
      /* job parameters */
   },
});
```

## Error Handling

The service includes comprehensive error handling:

- **Automatic Retries**: Failed jobs are automatically retried with exponential backoff
- **Timeout Protection**: Jobs are terminated if they exceed the timeout limit
- **Failure Notifications**: Administrators are notified of job failures
- **Execution Tracking**: All job executions are logged with detailed error information

## Monitoring and Maintenance

### Job Status Tracking

Jobs can have the following statuses:

- `scheduled`: Job is scheduled and waiting to run
- `queued`: Job is queued for execution
- `running`: Job is currently executing
- `completed`: Job completed successfully
- `failed`: Job failed
- `cancelled`: Job was cancelled
- `paused`: Job is paused
- `retrying`: Job is being retried after failure

### Cleanup Recommendations

- Regularly review job execution history
- Clean up old execution records for completed jobs
- Monitor job performance and adjust timeouts as needed
- Review and update job schedules based on business needs

## Integration Examples

### Report Generation

```javascript
await SchedulerService.scheduleJob({
   jobName: "monthly-inventory-report",
   jobType: "report_generation",
   schedule: {
      type: "recurring",
      cronExpression: "0 8 1 * *", // First day of month at 8 AM
      timezone: "UTC",
   },
   parameters: {
      reportType: "inventory_summary",
      format: "pdf",
      emailRecipients: ["management@example.com"],
   },
   priority: "high",
});
```

### Data Cleanup

```javascript
await SchedulerService.scheduleJob({
   jobName: "weekly-log-cleanup",
   jobType: "data_cleanup",
   schedule: {
      type: "recurring",
      interval: { value: 1, unit: "weeks" },
   },
   parameters: {
      retentionDays: 30,
      tables: ["audit_logs", "error_logs"],
   },
   priority: "normal",
});
```

### Low Stock Alerts

```javascript
await SchedulerService.scheduleJob({
   jobName: "hourly-stock-check",
   jobType: "low_stock_alert",
   schedule: {
      type: "recurring",
      interval: { value: 1, unit: "hours" },
   },
   parameters: {
      threshold: 10,
      products: ["critical_items"],
   },
   priority: "high",
});
```

## Best Practices

1. **Use Descriptive Job Names**: Choose clear, descriptive names for jobs
2. **Set Appropriate Priorities**: Use priority levels to ensure critical jobs run first
3. **Monitor Job Performance**: Regularly review job execution statistics
4. **Handle Errors Gracefully**: Implement proper error handling in custom job handlers
5. **Use Reasonable Timeouts**: Set timeouts based on expected job duration
6. **Clean Up Old Jobs**: Remove jobs that are no longer needed
7. **Test Job Logic**: Test custom job handlers thoroughly before scheduling
8. **Use Parameters Wisely**: Pass configuration through parameters rather than hardcoding

## Troubleshooting

### Common Issues

1. **Jobs Not Running**: Check if the scheduler service is started and jobs are enabled
2. **Jobs Failing**: Review job execution history for error details
3. **Performance Issues**: Monitor job execution times and adjust timeouts
4. **Memory Usage**: Clean up old execution records regularly

### Debugging

- Use `jobHistory()` to review recent executions
- Check `getJobStats()` for performance metrics
- Review application logs for scheduler-related errors
- Verify MongoDB connectivity for job persistence
