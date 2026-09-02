const AUTH_BASE = "https://api.prod.whoop.com/oauth/oauth2";
const API_BASE = "https://api.prod.whoop.com/developer";

const SCOPES = ["offline", "read:recovery", "read:sleep", "read:cycles"].join(" ");

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

export function buildAuthorizeUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: getEnv("WHOOP_CLIENT_ID"),
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
  });
  return `${AUTH_BASE}/auth?${params.toString()}`;
}

export type WhoopTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
};

async function parseTokenResponse(response: Response): Promise<WhoopTokens> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WHOOP token request failed (${response.status}): ${body}`);
  }
  const json = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: new Date(Date.now() + json.expires_in * 1000),
  };
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<WhoopTokens> {
  const response = await fetch(`${AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: getEnv("WHOOP_CLIENT_ID"),
      client_secret: getEnv("WHOOP_CLIENT_SECRET"),
      redirect_uri: redirectUri,
    }),
  });
  return parseTokenResponse(response);
}

export async function refreshTokens(refreshToken: string): Promise<WhoopTokens> {
  const response = await fetch(`${AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: getEnv("WHOOP_CLIENT_ID"),
      client_secret: getEnv("WHOOP_CLIENT_SECRET"),
      scope: "offline",
    }),
  });
  return parseTokenResponse(response);
}

export type WhoopRecovery = {
  score: number;
  restingHeartRate: number;
  hrvMilli: number;
};

export type WhoopSleep = {
  performancePercentage: number;
  efficiencyPercentage: number;
};

async function whoopGet(path: string, accessToken: string): Promise<unknown> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 401) {
    throw new Error("WHOOP_TOKEN_EXPIRED");
  }
  if (!response.ok) {
    throw new Error(`WHOOP API request failed (${response.status})`);
  }
  return response.json();
}

export async function fetchLatestRecovery(
  accessToken: string,
): Promise<WhoopRecovery | null> {
  const json = (await whoopGet("/v2/recovery?limit=1", accessToken)) as {
    records: {
      score?: {
        recovery_score: number;
        resting_heart_rate: number;
        hrv_rmssd_milli: number;
      };
    }[];
  };
  const record = json.records?.[0]?.score;
  if (!record) return null;
  return {
    score: Math.round(record.recovery_score),
    restingHeartRate: Math.round(record.resting_heart_rate),
    hrvMilli: Math.round(record.hrv_rmssd_milli),
  };
}

export async function fetchLatestSleep(
  accessToken: string,
): Promise<WhoopSleep | null> {
  const json = (await whoopGet("/v2/activity/sleep?limit=1", accessToken)) as {
    records: {
      score?: {
        sleep_performance_percentage: number;
        sleep_efficiency_percentage: number;
      };
    }[];
  };
  const record = json.records?.[0]?.score;
  if (!record) return null;
  return {
    performancePercentage: Math.round(record.sleep_performance_percentage),
    efficiencyPercentage: Math.round(record.sleep_efficiency_percentage),
  };
}
