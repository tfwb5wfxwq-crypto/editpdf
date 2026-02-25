/**
 * Font Parser Module
 * Parse and validate extracted fonts for re-embedding with pdf-lib
 */

import opentype from 'opentype.js';
import { ExtractedFont } from './font-extractor';

export interface ParsedFont {
  name: string;
  buffer: ArrayBuffer;
  opentypeFont: opentype.Font;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Parse an extracted font with opentype.js
 * @param font Extracted font data
 * @returns Promise<ParsedFont | null>
 */
export async function parseFont(
  font: ExtractedFont
): Promise<ParsedFont | null> {
  if (!font.data || font.data.length === 0) {
    console.warn(`⚠️  ${font.name}: No font data available`);
    return null;
  }

  // Only parse TrueType and OpenType fonts
  if (font.type !== 'TrueType' && font.type !== 'OpenType') {
    console.warn(`⚠️  ${font.name}: Unsupported type ${font.type}`);
    return null;
  }

  try {
    // Convert Uint8Array to ArrayBuffer
    const buffer = font.data.buffer.slice(
      font.data.byteOffset,
      font.data.byteOffset + font.data.byteLength
    ) as ArrayBuffer;

    // Parse with opentype.js
    const opentypeFont = opentype.parse(buffer);

    if (!opentypeFont || !opentypeFont.supported) {
      throw new Error('Font parsing failed or font not supported');
    }

    console.log(`✅ ${font.name}: Parsed successfully (${opentypeFont.numGlyphs} glyphs)`);

    return {
      name: font.name,
      buffer,
      opentypeFont,
      isValid: true,
    };
  } catch (error) {
    console.error(`❌ ${font.name}: Parse error:`, error);
    return {
      name: font.name,
      buffer: new ArrayBuffer(0),
      opentypeFont: null as any,
      isValid: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse multiple fonts in parallel
 * @param fonts Array of extracted fonts
 * @returns Promise<Map<string, ParsedFont>> Map of successfully parsed fonts
 */
export async function parseFonts(
  fonts: ExtractedFont[]
): Promise<Map<string, ParsedFont>> {
  const parsedFonts = new Map<string, ParsedFont>();

  // Parse all fonts in parallel
  const results = await Promise.allSettled(
    fonts.map((font) => parseFont(font))
  );

  // Collect successful results
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value && result.value.isValid) {
      parsedFonts.set(fonts[index].name, result.value);
    }
  });

  console.log(`✅ Successfully parsed ${parsedFonts.size}/${fonts.length} fonts`);
  return parsedFonts;
}

/**
 * Get font metrics for accurate text positioning
 * @param font Parsed font
 * @param text Text to measure
 * @param fontSize Font size
 * @returns Object with width, height, ascender, descender
 */
export function measureText(
  font: ParsedFont,
  text: string,
  fontSize: number
): {
  width: number;
  height: number;
  ascender: number;
  descender: number;
} {
  if (!font.isValid || !font.opentypeFont) {
    return { width: 0, height: 0, ascender: 0, descender: 0 };
  }

  const path = font.opentypeFont.getPath(text, 0, 0, fontSize);
  const bounds = path.getBoundingBox();

  return {
    width: bounds.x2 - bounds.x1,
    height: bounds.y2 - bounds.y1,
    ascender: font.opentypeFont.ascender * (fontSize / font.opentypeFont.unitsPerEm),
    descender: font.opentypeFont.descender * (fontSize / font.opentypeFont.unitsPerEm),
  };
}

/**
 * Check if font contains all glyphs for given text
 * @param font Parsed font
 * @param text Text to check
 * @returns boolean
 */
export function fontSupportsText(font: ParsedFont, text: string): boolean {
  if (!font.isValid || !font.opentypeFont) return false;

  for (let i = 0; i < text.length; i++) {
    const glyph = font.opentypeFont.charToGlyph(text[i]);
    if (!glyph || glyph.index === 0) {
      // Glyph 0 is .notdef (missing glyph)
      return false;
    }
  }

  return true;
}
