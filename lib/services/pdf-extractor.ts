/**
 * PDF Text Extraction Service
 *
 * Uses unpdf library to extract text from PDF files.
 * Works with both local Buffer data and remote URLs.
 */

import { extractText } from "unpdf";

/**
 * Extract text content from a PDF file at a given URL.
 *
 * @param url - Public URL to the PDF file (typically an R2 URL)
 * @returns The extracted text content from the PDF
 */
export async function extractTextFromPdfUrl(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch PDF: ${response.status} ${response.statusText}`
    );
  }

  const buffer = await response.arrayBuffer();
  const { text } = await extractText(buffer);

  // extractText returns an array of strings (one per page), join them
  return Array.isArray(text) ? text.join("\n") : text;
}

/**
 * Extract text content from a PDF buffer.
 *
 * @param buffer - ArrayBuffer containing PDF data
 * @returns The extracted text content from the PDF
 */
export async function extractTextFromPdfBuffer(
  buffer: ArrayBuffer
): Promise<string> {
  const { text } = await extractText(buffer);
  // extractText returns an array of strings (one per page), join them
  return Array.isArray(text) ? text.join("\n") : text;
}
