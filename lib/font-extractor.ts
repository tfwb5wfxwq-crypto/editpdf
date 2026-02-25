/**
 * Font Extractor Module
 * Extracts embedded fonts from PDF documents using PDF.js internal APIs
 */

import * as pdfjsLib from 'pdfjs-dist';

export interface FontStyle {
  weight: number; // 100-900 (400=Regular, 700=Bold)
  italic: boolean;
  variant: 'Regular' | 'Bold' | 'Italic' | 'BoldItalic' | 'Light' | 'Medium' | 'SemiBold' | 'Black' | 'Thin' | 'ExtraLight' | 'ExtraBold' | 'Heavy';
}

export interface ExtractedFont {
  name: string; // Clean font name without subset prefix
  originalName: string; // Full name with subset prefix (e.g., "ABCDEF+Helvetica-Bold")
  baseName: string; // Base font family without style (e.g., "Helvetica")
  data: Uint8Array | null;
  type: 'TrueType' | 'OpenType' | 'Type1' | 'CFF' | 'Unknown';
  subtype?: string;
  style: FontStyle;
}

export interface FontMap {
  [fontName: string]: ExtractedFont;
}

/**
 * Extract all embedded fonts from a PDF document
 * @param pdf PDF.js document
 * @returns Promise<FontMap> Map of font names to font data
 */
export async function extractFontsFromPDF(
  pdf: pdfjsLib.PDFDocumentProxy
): Promise<FontMap> {
  const fonts: FontMap = {};
  const processedFonts = new Set<string>();

  console.log('🔍 Starting font extraction...');

  // Iterate through all pages to collect fonts
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    
    // Access internal objects (undocumented but stable API)
    const pageObjs = (page as any).objs;
    const commonObjs = (page as any).commonObjs;

    // Extract fonts from page-specific objects
    if (pageObjs) {
      await extractFontsFromObjStorage(pageObjs, fonts, processedFonts, 'page');
    }

    // Extract fonts from common objects (shared across pages)
    if (commonObjs && pageNum === 1) {
      // Only process common objects once
      await extractFontsFromObjStorage(commonObjs, fonts, processedFonts, 'common');
    }
  }

  console.log(`✅ Extracted ${Object.keys(fonts).length} fonts:`, Object.keys(fonts));
  return fonts;
}

/**
 * Extract fonts from PDF.js object storage
 * @param objStorage PDF.js object storage (objs or commonObjs)
 * @param fonts Font map to populate
 * @param processedFonts Set of already processed font names
 * @param source Source type for logging
 */
async function extractFontsFromObjStorage(
  objStorage: any,
  fonts: FontMap,
  processedFonts: Set<string>,
  source: 'page' | 'common'
): Promise<void> {
  // Get all object keys from the storage
  // PDF.js stores objects in a Map-like structure
  const objData = objStorage._objs || objStorage.objs || {};

  for (const [key, value] of Object.entries(objData)) {
    // Check if this is a font object
    if (isFontObject(value)) {
      const fontName = extractFontName(value, key);

      if (processedFonts.has(fontName)) {
        continue; // Skip already processed fonts
      }

      console.log(`📝 Found font: ${fontName} (${source})`);

      try {
        const fontData = await extractFontData(value);
        fonts[fontName] = fontData;
        processedFonts.add(fontName);
      } catch (error) {
        console.warn(`⚠️  Failed to extract ${fontName}:`, error);
        const { baseName, style } = parseFontName(fontName);
        const cleanName = fontName.includes('+') ? fontName.split('+')[1] : fontName;
        fonts[fontName] = {
          name: cleanName,
          originalName: fontName,
          baseName,
          data: null,
          type: 'Unknown',
          style,
        };
      }
    }
  }
}

/**
 * Parse font name to extract base name and style information
 * @param fontName Font name (may include subset prefix like "ABCDEF+")
 * @returns Object with baseName and style
 */
function parseFontName(fontName: string): { baseName: string; style: FontStyle } {
  // Remove subset prefix (e.g., "ABCDEF+Helvetica-Bold" -> "Helvetica-Bold")
  const nameWithoutSubset = fontName.includes('+') ? fontName.split('+')[1] : fontName;
  const nameLower = nameWithoutSubset.toLowerCase();

  let weight = 400;
  let italic = false;
  let variant: FontStyle['variant'] = 'Regular';

  // Detect font variant from name
  // Order matters: check compound styles first
  if (nameLower.includes('bolditalic') || nameLower.includes('bold-italic') || nameLower.includes('bold_italic')) {
    weight = 700;
    italic = true;
    variant = 'BoldItalic';
  } else if (nameLower.includes('extrabold') || nameLower.includes('extra-bold') || nameLower.includes('extra_bold')) {
    weight = 800;
    variant = 'ExtraBold';
  } else if (nameLower.includes('semibold') || nameLower.includes('semi-bold') || nameLower.includes('semi_bold') || nameLower.includes('demibold')) {
    weight = 600;
    variant = 'SemiBold';
  } else if (nameLower.includes('bold')) {
    weight = 700;
    variant = 'Bold';
  } else if (nameLower.includes('italic') || nameLower.includes('oblique')) {
    italic = true;
    variant = 'Italic';
  } else if (nameLower.includes('thin')) {
    weight = 100;
    variant = 'Thin';
  } else if (nameLower.includes('extralight') || nameLower.includes('extra-light') || nameLower.includes('extra_light') || nameLower.includes('ultralight')) {
    weight = 200;
    variant = 'ExtraLight';
  } else if (nameLower.includes('light')) {
    weight = 300;
    variant = 'Light';
  } else if (nameLower.includes('medium')) {
    weight = 500;
    variant = 'Medium';
  } else if (nameLower.includes('heavy') || nameLower.includes('black')) {
    weight = 900;
    variant = weight === 900 && nameLower.includes('black') ? 'Black' : 'Heavy';
  }

  // Extract base name (remove style suffix)
  let baseName = nameWithoutSubset;
  const styleSuffixes = ['BoldItalic', 'Bold-Italic', 'Bold_Italic', 'ExtraBold', 'Extra-Bold', 'Extra_Bold', 'SemiBold', 'Semi-Bold', 'Semi_Bold', 'DemiBold', 'Bold', 'Italic', 'Oblique', 'Thin', 'ExtraLight', 'Extra-Light', 'Extra_Light', 'UltraLight', 'Light', 'Medium', 'Heavy', 'Black'];

  for (const suffix of styleSuffixes) {
    const regex = new RegExp(`[-_]?${suffix}$`, 'i');
    if (regex.test(baseName)) {
      baseName = baseName.replace(regex, '');
      break;
    }
  }

  return {
    baseName,
    style: { weight, italic, variant }
  };
}

/**
 * Check if an object is a font object
 * @param obj Object to check
 * @returns boolean
 */
function isFontObject(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;

  // PDF.js font objects have specific properties
  return (
    obj.name !== undefined ||
    obj.fontName !== undefined ||
    obj.loadedName !== undefined ||
    (obj.data && (obj.type === 'Font' || obj.subtype?.includes('Font')))
  );
}

/**
 * Extract font name from font object
 * @param fontObj Font object
 * @param fallbackKey Fallback key if no name found
 * @returns string Font name
 */
function extractFontName(fontObj: any, fallbackKey: string): string {
  return (
    fontObj.loadedName ||
    fontObj.fontName ||
    fontObj.name ||
    fallbackKey
  );
}

/**
 * Extract font data from font object
 * @param fontObj Font object
 * @returns Promise<ExtractedFont>
 */
async function extractFontData(fontObj: any): Promise<ExtractedFont> {
  const originalName = fontObj.loadedName || fontObj.fontName || fontObj.name;

  // Parse font name to extract base name and style
  const { baseName, style } = parseFontName(originalName);

  // Clean name without subset prefix
  const cleanName = originalName.includes('+') ? originalName.split('+')[1] : originalName;

  // Try to get font data from various possible locations
  let fontData: Uint8Array | null = null;
  let fontType: ExtractedFont['type'] = 'Unknown';

  // Method 1: Direct data property
  if (fontObj.data && fontObj.data instanceof Uint8Array) {
    fontData = fontObj.data;
  }

  // Method 2: Font file property
  else if (fontObj.file && fontObj.file.bytes) {
    fontData = fontObj.file.bytes;
  }

  // Method 3: Embedded file
  else if (fontObj.file && fontObj.file.data) {
    fontData = fontObj.file.data;
  }

  // Method 4: Try to access internal font object
  else if (fontObj.font && fontObj.font.data) {
    fontData = fontObj.font.data;
  }

  // Determine font type from subtype or data
  if (fontObj.subtype) {
    const subtype = fontObj.subtype.toString();
    if (subtype.includes('TrueType')) fontType = 'TrueType';
    else if (subtype.includes('OpenType')) fontType = 'OpenType';
    else if (subtype.includes('Type1')) fontType = 'Type1';
    else if (subtype.includes('CFF')) fontType = 'CFF';
  }

  // Try to detect font type from data signature
  if (fontData && fontType === 'Unknown') {
    fontType = detectFontType(fontData);
  }

  console.log(`🎨 Font parsed: ${originalName} → base: ${baseName}, variant: ${style.variant}, weight: ${style.weight}, italic: ${style.italic}`);

  return {
    name: cleanName,
    originalName,
    baseName,
    data: fontData,
    type: fontType,
    subtype: fontObj.subtype?.toString(),
    style,
  };
}

/**
 * Detect font type from data signature
 * @param data Font data
 * @returns Font type
 */
function detectFontType(data: Uint8Array): ExtractedFont['type'] {
  if (data.length < 4) return 'Unknown';

  // Check magic numbers
  const signature = String.fromCharCode(...data.slice(0, 4));

  // TrueType: 0x00010000 or 'true' or 'typ1'
  if (
    signature === '\x00\x01\x00\x00' ||
    signature === 'true' ||
    signature === 'typ1'
  ) {
    return 'TrueType';
  }

  // OpenType with CFF: 'OTTO'
  if (signature === 'OTTO') {
    return 'OpenType';
  }

  // PostScript Type1: starts with '%!' or 0x80 0x01
  if (signature.startsWith('%!') || (data[0] === 0x80 && data[1] === 0x01)) {
    return 'Type1';
  }

  // CFF: starts with 0x01 0x00
  if (data[0] === 0x01 && data[1] === 0x00) {
    return 'CFF';
  }

  return 'Unknown';
}

/**
 * Check if a font is embeddable (supported format)
 * @param font Extracted font
 * @returns boolean
 */
export function isFontEmbeddable(font: ExtractedFont): boolean {
  if (!font.data || font.data.length === 0) return false;
  return font.type === 'TrueType' || font.type === 'OpenType';
}

/**
 * Get a human-readable description of extraction results
 * @param fonts Font map
 * @returns string
 */
export function getFontExtractionSummary(fonts: FontMap): string {
  const total = Object.keys(fonts).length;
  const embeddable = Object.values(fonts).filter(isFontEmbeddable).length;
  const types = Object.values(fonts).reduce((acc, font) => {
    acc[font.type] = (acc[font.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return `
📊 Font Extraction Summary:
- Total fonts: ${total}
- Embeddable (TTF/OTF): ${embeddable}
- Type breakdown: ${JSON.stringify(types, null, 2)}
  `.trim();
}
