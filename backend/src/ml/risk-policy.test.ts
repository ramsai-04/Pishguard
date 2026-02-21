import { describe, expect, it } from "vitest";
import { applyRiskPolicy } from "./risk-policy.js";
import type { UrlFeatures } from "./feature-extractor.js";

const baseFeatures: UrlFeatures = {
  urlLength: 40,
  domainLength: 12,
  isDomainIP: 0,
  tldLength: 3,
  noOfSubDomain: 0,
  hasObfuscation: 0,
  noOfObfuscatedChar: 0,
  obfuscationRatio: 0,
  noOfLettersInURL: 28,
  letterRatioInURL: 0.7,
  noOfDigitsInURL: 2,
  digitRatioInURL: 0.05,
  noOfEqualsInURL: 0,
  noOfQMarkInURL: 0,
  noOfAmpersandInURL: 0,
  noOfOtherSpecialCharsInURL: 0,
  specialCharRatioInURL: 0,
  isHTTPS: 1,
};

describe("applyRiskPolicy", () => {
  it("applies trusted domain safeguard for benign trusted domains", () => {
    const result = applyRiskPolicy({
      normalizedUrl: "https://google.com",
      domain: "google.com",
      modelProbability: 0.55,
      features: baseFeatures,
      trustedDomain: true,
    });

    expect(result.adjustedProbability).toBeLessThanOrEqual(0.12);
    expect(result.reasons).toContain("trusted domain safeguard");
  });

  it("increases probability for suspicious phishing indicators", () => {
    const result = applyRiskPolicy({
      normalizedUrl: "http://paypal-login-check.top/account?user=12&token=22&session=2",
      domain: "paypal-login-check.top",
      modelProbability: 0.4,
      features: {
        ...baseFeatures,
        isHTTPS: 0,
        hasObfuscation: 1,
        noOfSubDomain: 4,
        noOfQMarkInURL: 1,
        noOfAmpersandInURL: 3,
        noOfEqualsInURL: 4,
        digitRatioInURL: 0.3,
      },
      trustedDomain: false,
    });

    expect(result.adjustedProbability).toBeGreaterThan(0.6);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});
