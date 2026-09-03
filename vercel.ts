import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  crons: [
    // Argentina is fixed at UTC-03:00 (no DST).
    { path: "/api/cron/morning-reminder", schedule: "0 12 * * *" }, // 09:00 ART
    { path: "/api/cron/evening-reminder", schedule: "0 23 * * *" }, // 20:00 ART
  ],
};
