/**
 * Module d'optimisation de prompts et de tokens
 * Basé sur les techniques présentées dans le document du projet :
 * - Replace UUIDs with short handles (order-4827)
 * - Shorten / remove long signed/random URLs
 * - Reduce unnecessary timestamp precision (ISO -> YYYY-MM-DD HH:MM)
 * - Remove redundant prompt prefixes / filler words
 * - Normalize multiple spaces and extra whitespaces
 * - Normalize Unicode characters (smart quotes, dashes, ligatures, fullwidth)
 * - Remove invisible Unicode characters (zero-width spaces, zero-width joiners)
 * - Remove Base64 blobs from text prompts
 */

export interface OptimizeOptions {
  replaceUuids?: boolean;
  shortenUrls?: boolean;
  reduceTimestamps?: boolean;
  normalizeWhitespace?: boolean;
  cleanUnicode?: boolean;
  stripBase64?: boolean;
  removeRedundancy?: boolean;
}

export interface OptimizationResult {
  raw_prompt: string;
  opt_prompt: string;
  rawTokensEstimate: number;
  optTokensEstimate: number;
  tokensSaved: number;
  savingsPercentage: number;
}

// Estimation standard des tokens (approximativement 4 caractères = 1 token pour l'anglais/code)
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Découpage par mots et ponctuation
  const words = text.trim().split(/\s+/).filter(Boolean);
  const charBased = Math.ceil(text.length / 3.8);
  return Math.max(words.length, charBased);
}

export function optimizePrompt(
  input: string,
  options: OptimizeOptions = {
    replaceUuids: true,
    shortenUrls: true,
    reduceTimestamps: true,
    normalizeWhitespace: true,
    cleanUnicode: true,
    stripBase64: true,
    removeRedundancy: true,
  }
): OptimizationResult {
  let text = input;

  // 1. Supprimer les caractères Unicode invisibles (zero-width space \u200B, \u200C, \u200D, \uFEFF)
  if (options.cleanUnicode) {
    text = text.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ");
    // Normaliser les guillemets et tirets bizarres (smart quotes, em-dash, en-dash)
    text = text
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/…/g, "...");
  }

  // 2. Supprimer les données Base64 volumineuses incrustées dans le prompt
  if (options.stripBase64) {
    text = text.replace(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]{40,}/g, "[image_thumbnail]");
    text = text.replace(/base64,[A-Za-z0-9+/=]{60,}/g, "[base64_data]");
  }

  // 3. Remplacer les UUID longs (ex: 550e8400-e29b-41d4-a716-446655440000 -> id-4827)
  if (options.replaceUuids) {
    let counter = 1;
    const uuidMap = new Map<string, string>();
    text = text.replace(
      /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g,
      (match) => {
        if (!uuidMap.has(match)) {
          uuidMap.set(match, `id-${1000 + counter++}`);
        }
        return uuidMap.get(match)!;
      }
    );
  }

  // 4. Raccourcir les URL signées ou URL S3 interminables
  if (options.shortenUrls) {
    // S3 long signed URLs
    text = text.replace(
      /https?:\/\/[a-zA-Z0-9.\-_]+\.amazonaws\.com\/[^\s"')]+/g,
      (match) => {
        const parts = match.split("/");
        const lastPart = parts[parts.length - 1].split("?")[0];
        return `s3://${lastPart || "file"}`;
      }
    );
    // Supprimer query params excessifs sur les URLs
    text = text.replace(/(https?:\/\/[^\s?]+)\?[^\s"')]{30,}/g, "$1");
  }

  // 5. Réduire la précision excessive des timestamps (2024-03-15T14:32:45.123Z -> 2024-03-15 14:32)
  if (options.reduceTimestamps) {
    text = text.replace(
      /(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):\d{2}(?:\.\d+)?Z?/g,
      "$1 $2"
    );
  }

  // 6. Supprimer les formules de politesse et préfixes redondants inutiles
  if (options.removeRedundancy) {
    const redundancies = [
      /can you please help me to\s+/gi,
      /could you please\s+/gi,
      /please write a very detailed and comprehensive\s+/gi,
      /please\s+/gi,
      /i would like you to\s+/gi,
      /as an ai language model,?\s+/gi,
    ];
    for (const r of redundancies) {
      text = text.replace(r, "");
    }
  }

  // 7. Normalisation des espaces superflus et retours à la ligne triples
  if (options.normalizeWhitespace) {
    text = text.replace(/[ \t]+/g, " ");
    text = text.replace(/\n{3,}/g, "\n\n");
    text = text.trim();
  }

  const rawTokens = estimateTokens(input);
  const optTokens = estimateTokens(text);
  const saved = Math.max(0, rawTokens - optTokens);
  const savingsPct = rawTokens > 0 ? Math.round((saved / rawTokens) * 100) : 0;

  return {
    raw_prompt: input,
    opt_prompt: text,
    rawTokensEstimate: rawTokens,
    optTokensEstimate: optTokens,
    tokensSaved: saved,
    savingsPercentage: savingsPct,
  };
}
