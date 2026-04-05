import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.hourly("clean up expired rate limit entries", { minuteUTC: 0 }, internal.system.rateLimitCleanup.cleanup);

export default crons;
