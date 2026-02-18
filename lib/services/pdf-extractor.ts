import { extractText } from "unpdf";

const ALLOWED_PDF_DOMAINS = [
  "r2.cloudflarestorage.com",
  ".r2.dev",
];

function isAllowedUrl(url: string): { allowed: boolean; parsed?: URL } {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const allowed = ALLOWED_PDF_DOMAINS.some((domain) =>
      domain.startsWith(".") ? hostname.endsWith(domain) : hostname === domain
    );
    return { allowed, parsed };
  } catch {
    return { allowed: false };
  }
}

export function validatePdfUrl(url: string): { valid: boolean; error?: string } {
  const { allowed } = isAllowedUrl(url);
  if (!allowed) {
    return {
      valid: false,
      error: "URL must be from an allowed storage domain (R2)",
    };
  }
  return { valid: true };
}

export async function extractTextFromPdfUrl(url: string): Promise<string> {
  const { allowed, parsed } = isAllowedUrl(url);
  
  if (!allowed || !parsed) {
    throw new Error("URL must be from an allowed storage domain (R2)");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed");
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "SkillsImprover/1.0 PDF-Extractor",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch PDF: ${response.status} ${response.statusText}`
    );
  }

  const contentType = response.headers.get("content-type");
  if (contentType && !contentType.includes("application/pdf") && !contentType.includes("application/octet-stream")) {
    throw new Error("URL does not point to a PDF file");
  }

  const buffer = await response.arrayBuffer();
  const { text } = await extractText(buffer);

  return Array.isArray(text) ? text.join("\n") : text;
}

export async function extractTextFromPdfBuffer(
  buffer: ArrayBuffer
): Promise<string> {
  const { text } = await extractText(buffer);
  return Array.isArray(text) ? text.join("\n") : text;
}
