import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

// Define cron jobs for audit log maintenance
const crons = cronJobs()

// Daily cleanup job - runs every day at 2 AM
crons.daily(
  "audit-log-cleanup",
  { hourUTC: 2, minuteUTC: 0 },
  internal.auditLogs.dailyCleanup
)

// Weekly audit log archival - runs every Sunday at 3 AM
// TODO: Implement weeklyArchival function
// crons.weekly(
//   "audit-log-archival",
//   { dayOfWeek: "sunday", hourUTC: 3, minuteUTC: 0 },
//   internal.auditLogs.weeklyArchival
// )

// Monthly security report generation - runs on the 1st of each month at 4 AM
// TODO: Implement monthlySecurityReport function
// crons.monthly(
//   "security-report-generation",
//   { day: 1, hourUTC: 4, minuteUTC: 0 },
//   internal.auditLogs.monthlySecurityReport
// )

export default crons