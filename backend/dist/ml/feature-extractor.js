export const RF_FEATURE_ORDER = [
    "urlLength",
    "domainLength",
    "isDomainIP",
    "tldLength",
    "noOfSubDomain",
    "hasObfuscation",
    "noOfObfuscatedChar",
    "obfuscationRatio",
    "noOfLettersInURL",
    "letterRatioInURL",
    "noOfDigitsInURL",
    "digitRatioInURL",
    "noOfEqualsInURL",
    "noOfQMarkInURL",
    "noOfAmpersandInURL",
    "noOfOtherSpecialCharsInURL",
    "specialCharRatioInURL",
    "isHTTPS",
];
const count = (value, pattern) => (value.match(pattern) ?? []).length;
export const extractDomain = (url) => {
    try {
        const parsed = new URL(url);
        return parsed.hostname.toLowerCase().replace(/^www\./, "");
    }
    catch {
        return url.toLowerCase().replace(/^www\./, "");
    }
};
export const detectCategory = (url) => {
    const lowerUrl = url.toLowerCase();
    if (/(amazon|flipkart|shop|store|buy|cart)/.test(lowerUrl))
        return "E-commerce";
    if (/(coursera|udemy|edu|learn|school|course)/.test(lowerUrl))
        return "Education";
    if (/(health|medical|doctor|hospital|clinic)/.test(lowerUrl))
        return "Health";
    if (/(bank|paypal|chase|finance|credit|wallet)/.test(lowerUrl))
        return "Banking";
    if (/(gov|government|irs|passport)/.test(lowerUrl))
        return "Government";
    if (/(netflix|youtube|movie|music|stream)/.test(lowerUrl))
        return "Entertainment";
    if (/(facebook|twitter|instagram|social|linkedin)/.test(lowerUrl))
        return "Social Media";
    if (/(google|microsoft|tech|software|cloud|github)/.test(lowerUrl))
        return "Technology";
    return "Other";
};
export const extractFeatures = (rawUrl) => {
    const url = rawUrl.trim().toLowerCase();
    const normalized = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    const parsed = new URL(normalized);
    const domain = parsed.hostname.toLowerCase();
    const urlLength = normalized.length;
    const tld = domain.split(".").pop() ?? "";
    const subdomainParts = domain.split(".");
    const noOfSubDomain = Math.max(0, subdomainParts.length - 2);
    const isDomainIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(domain) ? 1 : 0;
    const hasPercentEncoding = /%[0-9a-f]{2}/i.test(normalized);
    const hasPunycode = /xn--/i.test(domain);
    const hasObfuscation = hasPercentEncoding || hasPunycode ? 1 : 0;
    const noOfEncodedTriplets = count(normalized, /%[0-9a-f]{2}/gi);
    const noOfObfuscatedChar = noOfEncodedTriplets * 3 + (hasPunycode ? 4 : 0);
    const noOfLettersInURL = count(normalized, /[a-z]/g);
    const noOfDigitsInURL = count(normalized, /\d/g);
    const noOfEqualsInURL = count(normalized, /=/g);
    const noOfQMarkInURL = count(normalized, /\?/g);
    const noOfAmpersandInURL = count(normalized, /&/g);
    const noOfOtherSpecialCharsInURL = count(normalized, /[^a-z0-9:/?&=._-]/g);
    return {
        urlLength,
        domainLength: domain.length,
        isDomainIP,
        tldLength: tld.length,
        noOfSubDomain,
        hasObfuscation,
        noOfObfuscatedChar,
        obfuscationRatio: urlLength ? noOfObfuscatedChar / urlLength : 0,
        noOfLettersInURL,
        letterRatioInURL: urlLength ? noOfLettersInURL / urlLength : 0,
        noOfDigitsInURL,
        digitRatioInURL: urlLength ? noOfDigitsInURL / urlLength : 0,
        noOfEqualsInURL,
        noOfQMarkInURL,
        noOfAmpersandInURL,
        noOfOtherSpecialCharsInURL,
        specialCharRatioInURL: urlLength ? noOfOtherSpecialCharsInURL / urlLength : 0,
        isHTTPS: normalized.startsWith("https://") ? 1 : 0,
    };
};
export const vectorizeFeatures = (features) => RF_FEATURE_ORDER.map((key) => features[key]);
