import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  crons: [
    // 23:00 UTC = 20:00 America/Argentina/Buenos_Aires (fixed -03:00, no DST).
    { path: "/api/cron/evening-reminder", schedule: "0 23 * * *" },
  ],
};
