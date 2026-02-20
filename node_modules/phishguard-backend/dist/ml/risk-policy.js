const SUSPICIOUS_TLDS = new Set([
    "tk",
    "ml",
    "ga",
    "cf",
    "gq",
    "top",
    "xyz",
    "work",
    "click",
    "link",
    "zip",
    "ru",
    "cn",
]);
const BRAND_RULES = [
    { brand: "google", legitDomains: ["google.com"] },
    { brand: "facebook", legitDomains: ["facebook.com"] },
    { brand: "instagram", legitDomains: ["instagram.com"] },
    { brand: "microsoft", legitDomains: ["microsoft.com", "live.com", "outlook.com"] },
    { brand: "apple", legitDomains: ["apple.com", "icloud.com"] },
    { brand: "paypal", legitDomains: ["paypal.com"] },
    { brand: "amazon", legitDomains: ["amazon.com"] },
    { brand: "netflix", legitDomains: ["netflix.com"] },
    { brand: "linkedin", legitDomains: ["linkedin.com"] },
];
const clip01 = (value) => Math.max(0, Math.min(1, value));
const getTld = (domain) => {
    const parts = domain.split(".");
    return parts[parts.length - 1] ?? "";
};
const domainContainsBrandSpoof = (domain, url) => {
    const reasons = [];
    for (const rule of BRAND_RULES) {
        if (!url.includes(rule.brand))
            continue;
        const legit = rule.legitDomains.some((d) => domain === d || domain.endsWith(`.${d}`));
        if (!legit) {
            reasons.push(`brand impersonation pattern (${rule.brand})`);
        }
    }
    return reasons;
};
export const applyRiskPolicy = (input) => {
    const { normalizedUrl, domain, modelProbability, features, trustedDomain } = input;
    let probability = modelProbability;
    const reasons = [];
    if (trustedDomain) {
        // For well-known trusted domains, keep risk low unless the URL is clearly malicious.
        if (features.hasObfuscation || features.isDomainIP) {
            probability = Math.max(probability, 0.35);
            reasons.push("trusted domain but obfuscation/IP pattern observed");
        }
        else {
            probability = Math.min(probability, 0.12);
            reasons.push("trusted domain safeguard");
        }
        return { adjustedProbability: clip01(probability), reasons };
    }
    if (features.isDomainIP) {
        probability += 0.12;
        reasons.push("IP address as host");
    }
    if (!features.isHTTPS) {
        probability += 0.06;
        reasons.push("missing HTTPS");
    }
    if (features.hasObfuscation) {
        probability += 0.08;
        reasons.push("URL obfuscation");
    }
    if (features.noOfQMarkInURL + features.noOfAmpersandInURL + features.noOfEqualsInURL >= 4) {
        probability += 0.05;
        reasons.push("complex query structure");
    }
    if (features.digitRatioInURL > 0.22) {
        probability += 0.05;
        reasons.push("high digit ratio");
    }
    if (features.noOfSubDomain >= 3) {
        probability += 0.06;
        reasons.push("excessive subdomains");
    }
    const tld = getTld(domain);
    if (SUSPICIOUS_TLDS.has(tld)) {
        probability += 0.07;
        reasons.push(`risky TLD (.${tld})`);
    }
    const spoofReasons = domainContainsBrandSpoof(domain, normalizedUrl.toLowerCase());
    if (spoofReasons.length > 0) {
        probability += 0.1;
        reasons.push(...spoofReasons);
    }
    if (features.isHTTPS && !features.hasObfuscation && features.noOfOtherSpecialCharsInURL <= 1) {
        probability -= 0.04;
    }
    return { adjustedProbability: clip01(probability), reasons };
};
