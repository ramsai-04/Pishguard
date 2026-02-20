import dns from "node:dns/promises";
import tls from "node:tls";
import { env } from "../config/env.js";

type ReputationInput = {
  domain: string;
  normalizedUrl: string;
  safeCount: number;
  phishCount: number;
  timeoutMs: number;
};

export type ReputationResult = {
  delta: number;
  reasons: string[];
  preventBlocking: boolean;
  externalMaliciousHit: boolean;
};

const clip = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
const reputationCache = new Map<string, { expiresAt: number; value: ReputationResult }>();

const fetchJsonWithTimeout = async (url: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const getDomainAgeDays = async (
  domain: string,
  timeoutMs: number
): Promise<{ ok: boolean; ageDays?: number }> => {
  const base = env.RDAP_LOOKUP_BASE_URL.endsWith("/")
    ? env.RDAP_LOOKUP_BASE_URL
    : `${env.RDAP_LOOKUP_BASE_URL}/`;
  const data = await fetchJsonWithTimeout(`${base}${encodeURIComponent(domain)}`, { method: "GET" }, timeoutMs);
  if (!data || typeof data !== "object") {
    return { ok: false };
  }

  const events = Array.isArray((data as Record<string, unknown>).events)
    ? ((data as Record<string, unknown>).events as Array<Record<string, unknown>>)
    : [];

  const registrationDates = events
    .filter((e) => {
      const action = typeof e.eventAction === "string" ? e.eventAction.toLowerCase() : "";
      return action.includes("registration") || action.includes("create");
    })
    .map((e) => (typeof e.eventDate === "string" ? new Date(e.eventDate).getTime() : NaN))
    .filter((ts) => Number.isFinite(ts) && ts > 0);

  if (registrationDates.length === 0) {
    return { ok: false };
  }

  const createdAt = Math.min(...registrationDates);
  const ageDays = Math.max(0, Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24)));
  return { ok: true, ageDays };
};

const checkGoogleSafeBrowsing = async (
  normalizedUrl: string,
  timeoutMs: number
): Promise<{ checked: boolean; isMalicious: boolean }> => {
  if (!env.GOOGLE_SAFE_BROWSING_API_KEY) {
    return { checked: false, isMalicious: false };
  }

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(
    env.GOOGLE_SAFE_BROWSING_API_KEY
  )}`;
  const body = {
    client: {
      clientId: "phishguard",
      clientVersion: "1.0.0",
    },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url: normalizedUrl }],
    },
  };

  const data = await fetchJsonWithTimeout(
    endpoint,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    timeoutMs
  );

  if (!data || typeof data !== "object") {
    return { checked: false, isMalicious: false };
  }

  const matches = (data as Record<string, unknown>).matches;
  const isMalicious = Array.isArray(matches) && matches.length > 0;
  return { checked: true, isMalicious };
};

const checkPhishTank = async (
  normalizedUrl: string,
  timeoutMs: number
): Promise<{ checked: boolean; isMalicious: boolean }> => {
  if (!env.PHISHTANK_API_KEY) {
    return { checked: false, isMalicious: false };
  }

  const params = new URLSearchParams();
  params.set("url", normalizedUrl);
  params.set("format", "json");
  params.set("app_key", env.PHISHTANK_API_KEY);

  const data = await fetchJsonWithTimeout(
    env.PHISHTANK_ENDPOINT,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    },
    timeoutMs
  );

  if (!data || typeof data !== "object") {
    return { checked: false, isMalicious: false };
  }

  const results =
    (data as Record<string, unknown>).results &&
    typeof (data as Record<string, unknown>).results === "object"
      ? ((data as Record<string, unknown>).results as Record<string, unknown>)
      : null;

  if (!results) {
    return { checked: false, isMalicious: false };
  }

  const inDatabase = Boolean(results.in_database);
  const valid = Boolean(results.valid);
  const verified = Boolean(results.verified);
  return { checked: true, isMalicious: inDatabase && (valid || verified) };
};

const checkTlsCertificate = (
  domain: string,
  timeoutMs: number
): Promise<{ ok: boolean; validNow: boolean; daysRemaining: number; issuer?: string }> =>
  new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: domain,
        port: 443,
        servername: domain,
        rejectUnauthorized: false,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          socket.end();
          if (!cert || !cert.valid_from || !cert.valid_to) {
            resolve({ ok: false, validNow: false, daysRemaining: -1 });
            return;
          }
          const now = Date.now();
          const from = new Date(cert.valid_from).getTime();
          const to = new Date(cert.valid_to).getTime();
          const validNow = now >= from && now <= to;
          const daysRemaining = Math.floor((to - now) / (1000 * 60 * 60 * 24));
          resolve({
            ok: true,
            validNow,
            daysRemaining,
            issuer: typeof cert.issuer?.O === "string" ? cert.issuer.O : undefined,
          });
        } catch {
          resolve({ ok: false, validNow: false, daysRemaining: -1 });
        }
      }
    );

    socket.setTimeout(timeoutMs, () => {
      socket.destroy();
      resolve({ ok: false, validNow: false, daysRemaining: -1 });
    });
    socket.on("error", () => resolve({ ok: false, validNow: false, daysRemaining: -1 }));
  });

export const evaluateDomainReputation = async (input: ReputationInput): Promise<ReputationResult> => {
  const { domain, normalizedUrl, safeCount, phishCount, timeoutMs } = input;
  const cacheKey = `${domain}|${normalizedUrl}|${safeCount}|${phishCount}|${env.REPUTATION_ENABLE_EXTERNAL}`;
  const cached = reputationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let delta = 0;
  const reasons: string[] = [];
  let preventBlocking = false;
  let externalMaliciousHit = false;

  const dnsPromise = dns
    .lookup(domain)
    .then(() => true)
    .catch(() => false);
  const isHttps = normalizedUrl.startsWith("https://");
  const tlsPromise = isHttps ? checkTlsCertificate(domain, timeoutMs) : Promise.resolve(null);
  const domainAgePromise = getDomainAgeDays(domain, timeoutMs);
  const gsbPromise = env.REPUTATION_ENABLE_EXTERNAL
    ? checkGoogleSafeBrowsing(normalizedUrl, timeoutMs)
    : Promise.resolve({ checked: false, isMalicious: false });
  const phishTankPromise = env.REPUTATION_ENABLE_EXTERNAL
    ? checkPhishTank(normalizedUrl, timeoutMs)
    : Promise.resolve({ checked: false, isMalicious: false });

  const [dnsOk, tlsCheck, domainAge, gsb, phishTank] = await Promise.all([
    dnsPromise,
    tlsPromise,
    domainAgePromise,
    gsbPromise,
    phishTankPromise,
  ]);

  if (dnsOk) {
    delta -= 0.03;
    reasons.push("domain resolves in DNS");
  } else {
    delta += 0.08;
    reasons.push("domain DNS resolution failed");
  }

  if (isHttps) {
    if (tlsCheck?.ok && tlsCheck.validNow) {
      delta -= 0.07;
      reasons.push("valid TLS certificate");
      if (tlsCheck.daysRemaining > 30) {
        delta -= 0.02;
      }
    } else {
      delta += 0.14;
      reasons.push("invalid or missing TLS certificate");
    }
  }

  if (domainAge.ok && typeof domainAge.ageDays === "number") {
    if (domainAge.ageDays < 14) {
      delta += 0.2;
      reasons.push("very new domain registration (<14 days)");
    } else if (domainAge.ageDays < 90) {
      delta += 0.1;
      reasons.push("new domain registration (<90 days)");
    } else if (domainAge.ageDays > 3650) {
      delta -= 0.05;
      reasons.push("long-lived domain registration (>10 years)");
    } else if (domainAge.ageDays > 730) {
      delta -= 0.02;
      reasons.push("established domain registration (>2 years)");
    }
  }

  if (env.REPUTATION_ENABLE_EXTERNAL) {
    if (gsb.checked && gsb.isMalicious) {
      delta += 0.35;
      externalMaliciousHit = true;
      reasons.push("flagged by Google Safe Browsing");
    }
    if (phishTank.checked && phishTank.isMalicious) {
      delta += 0.35;
      externalMaliciousHit = true;
      reasons.push("flagged by PhishTank");
    }

    if (
      (gsb.checked || phishTank.checked) &&
      !gsb.isMalicious &&
      !phishTank.isMalicious &&
      domainAge.ok &&
      (domainAge.ageDays ?? 0) > 730
    ) {
      delta -= 0.04;
      reasons.push("not flagged by external threat feeds");
      preventBlocking = true;
    }
  }

  if (safeCount >= 3 && phishCount === 0) {
    delta -= 0.12;
    reasons.push("historically safe domain behavior");
    preventBlocking = true;
  }
  if (phishCount >= 2) {
    delta += 0.15;
    reasons.push("historically malicious domain behavior");
  }

  const result = {
    delta: clip(delta, -0.35, 0.35),
    reasons,
    preventBlocking,
    externalMaliciousHit,
  };
  reputationCache.set(cacheKey, {
    expiresAt: Date.now() + env.REPUTATION_CACHE_TTL_MS,
    value: result,
  });
  return result;
};
