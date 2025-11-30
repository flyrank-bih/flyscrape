import { extractText } from "../utils/dom";

/**
 * Common patterns found in blocking pages (WAFs, Captchas).
 * Note: These are heuristic and might produce false positives.
 */
const BLOCK_PATTERNS = [
    /verify you are human/i,
    /please complete the security check/i,
    /access denied/i,
    /error 1020/i, // Cloudflare
    /attention required/i, // Cloudflare
    /security challenge/i,
    /click to verify/i,
    /pardon our interruption/i
];

/**
 * Analyzes HTML content to determine if the request was blocked by a bot protection system.
 * 
 * @param html The raw HTML content.
 * @returns True if the content matches known blocking patterns.
 */
export function isBlocked(html: string): boolean {
    if (!html) return false;
    
    // Extract text to avoid matching hidden form fields or scripts
    const text = extractText(html);
    
    // Focus on the beginning of the document where block messages usually appear
    // But take enough context (e.g. 2000 chars)
    const sample = text.slice(0, 2000);
    
    return BLOCK_PATTERNS.some(pattern => pattern.test(sample));
}
