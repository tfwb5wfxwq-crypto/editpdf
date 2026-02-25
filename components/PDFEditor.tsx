'use client';

import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { extractFontsFromPDF, isFontEmbeddable, getFontExtractionSummary, type FontMap } from '@/lib/font-extractor';
import { parseFonts, type ParsedFont } from '@/lib/font-parser';

// Configure PDF.js worker (local copy with basePath)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/editpdf/pdf.worker.min.mjs';
}

interface TextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  fontFamily?: string;
  fontWeight?: number; // 100-900 (400=Regular, 700=Bold)
  fontStyle?: 'normal' | 'italic'; // italic or normal
  color?: string;
  transform?: number[];
}

interface PDFEditorProps {
  file: File;
  onClose: () => void;
}

export default function PDFEditor({ file, onClose }: PDFEditorProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(true); // Mode édition activé par défaut
  const [scale, setScale] = useState(1.5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // 🆕 SEJDA-QUALITY: Font extraction state
  const [extractedFonts, setExtractedFonts] = useState<FontMap>({});
  const [parsedFonts, setParsedFonts] = useState<Map<string, ParsedFont>>(new Map());
  const [fontExtractionStatus, setFontExtractionStatus] = useState<'idle' | 'extracting' | 'done' | 'error'>('idle');

  useEffect(() => {
    loadPDF();
  }, [file]);

  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale]);

  const loadPDF = async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);

      // 🆕 SEJDA-QUALITY: Extract embedded fonts
      setFontExtractionStatus('extracting');
      console.log('🔍 Extracting fonts from PDF...');

      const fonts = await extractFontsFromPDF(pdf);
      setExtractedFonts(fonts);

      // Parse embeddable fonts (TrueType, OpenType)
      const embeddableFonts = Object.values(fonts).filter(isFontEmbeddable);
      console.log(getFontExtractionSummary(fonts));

      if (embeddableFonts.length > 0) {
        console.log('📝 Parsing embeddable fonts...');
        const parsed = await parseFonts(embeddableFonts);
        setParsedFonts(parsed);
        console.log(`✅ Ready to use ${parsed.size} extracted fonts`);
      }

      setFontExtractionStatus('done');
    } catch (error) {
      console.error('❌ Font extraction error:', error);
      setFontExtractionStatus('error');
    }
  };

  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Extract text with positions
    const textContent = await page.getTextContent();
    const items: TextItem[] = [];

    textContent.items.forEach((item: any, index: number) => {
      if (item.str && item.str.trim()) {
        const transform = item.transform;
        const fontName = item.fontName || '';

        // 🆕 SEJDA-QUALITY: Detect font style from font name
        const nameLower = fontName.toLowerCase();
        let fontWeight = 400; // Regular by default
        let fontStyle: 'normal' | 'italic' = 'normal';

        // Check for bold
        if (nameLower.includes('bold')) {
          fontWeight = 700;
        } else if (nameLower.includes('semibold') || nameLower.includes('demibold')) {
          fontWeight = 600;
        } else if (nameLower.includes('medium')) {
          fontWeight = 500;
        } else if (nameLower.includes('light')) {
          fontWeight = 300;
        } else if (nameLower.includes('thin')) {
          fontWeight = 100;
        } else if (nameLower.includes('black') || nameLower.includes('heavy')) {
          fontWeight = 900;
        }

        // Check for italic
        if (nameLower.includes('italic') || nameLower.includes('oblique')) {
          fontStyle = 'italic';
        }

        // Try to determine font family from font name
        let fontFamily = 'Arial, sans-serif';
        if (fontName.includes('Times') || fontName.includes('Serif')) {
          fontFamily = 'Times New Roman, serif';
        } else if (fontName.includes('Courier') || fontName.includes('Mono')) {
          fontFamily = 'Courier New, monospace';
        } else if (fontName.includes('Helvetica') || fontName.includes('Arial')) {
          fontFamily = 'Arial, Helvetica, sans-serif';
        }

        items.push({
          id: `text-${pageNum}-${index}`,
          text: item.str,
          x: transform[4] * scale,
          y: viewport.height - transform[5] * scale,
          width: item.width * scale,
          height: item.height * scale,
          fontSize: transform[0] * scale,
          fontName: item.fontName || 'default',
          fontFamily,
          fontWeight,
          fontStyle,
          transform: transform,
        });
      }
    });

    setTextItems(items);

    // En mode édition, cacher le texte original avec des rectangles blancs
    if (editMode && items.length > 0) {
      items.forEach(item => {
        // Mesurer la vraie largeur du texte
        context.font = `${item.fontSize}px ${item.fontFamily}`;
        const textWidth = context.measureText(item.text).width;

        // Dessiner rectangle blanc avec marge généreuse
        context.fillStyle = 'white';
        context.fillRect(
          item.x - 2,
          item.y - item.height - 2,
          Math.max(textWidth, item.width) + 200,  // Grande marge pour texte édité
          item.height + 4
        );
      });
    }
  };

  const updateText = (id: string, newText: string) => {
    setTextItems(items =>
      items.map(item =>
        item.id === id ? { ...item, text: newText } : item
      )
    );
  };

  const savePDF = async () => {
    try {
      // Load original PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfLibDoc = await PDFDocument.load(arrayBuffer);

      // 🆕 SEJDA-QUALITY: Register fontkit for custom font embedding
      pdfLibDoc.registerFontkit(fontkit);

      const pages = pdfLibDoc.getPages();
      const page = pages[currentPage - 1];

      // ÉCRASER LES MÉTADONNÉES
      pdfLibDoc.setTitle('');
      pdfLibDoc.setAuthor('');
      pdfLibDoc.setSubject('');
      pdfLibDoc.setKeywords([]);
      pdfLibDoc.setProducer('');
      pdfLibDoc.setCreator('');
      pdfLibDoc.setCreationDate(new Date());
      pdfLibDoc.setModificationDate(new Date());

      // 🆕 SEJDA-QUALITY: Font embedding with extracted fonts
      const fontCache: { [key: string]: any } = {};
      let fontsUsed = { extracted: 0, standard: 0 };

      const getFont = async (fontName: string, fontFamily?: string) => {
        // Return cached font if available
        if (fontCache[fontName]) return fontCache[fontName];

        // PRIORITY 1: Try to use extracted font (SEJDA QUALITY)
        const parsedFont = parsedFonts.get(fontName);
        if (parsedFont && parsedFont.isValid) {
          try {
            console.log(`✅ Using extracted font: ${fontName}`);
            const embeddedFont = await pdfLibDoc.embedFont(parsedFont.buffer);
            fontCache[fontName] = embeddedFont;
            fontsUsed.extracted++;
            return embeddedFont;
          } catch (error) {
            console.warn(`⚠️  Failed to embed extracted font ${fontName}, falling back to standard`, error);
          }
        }

        // PRIORITY 2: Fallback to standard fonts
        console.log(`ℹ️  Using standard font for: ${fontName}`);
        let standardFont = StandardFonts.Helvetica;
        if (fontFamily?.includes('Times') || fontFamily?.includes('Serif')) {
          standardFont = StandardFonts.TimesRoman;
        } else if (fontFamily?.includes('Courier') || fontFamily?.includes('Mono')) {
          standardFont = StandardFonts.Courier;
        }

        const font = await pdfLibDoc.embedFont(standardFont);
        fontCache[fontName] = font;
        fontsUsed.standard++;
        return font;
      };

      // Draw white rectangles over old text
      const { height } = page.getSize();
      textItems.forEach(item => {
        page.drawRectangle({
          x: item.x / scale,
          y: height - (item.y / scale) - (item.height / scale),
          width: item.width / scale + 100, // Extra width for edited text
          height: item.height / scale,
          color: rgb(1, 1, 1),
        });
      });

      // 🆕 SEJDA-QUALITY: Draw new text with extracted fonts
      for (const item of textItems) {
        const font = await getFont(item.fontName, item.fontFamily);
        page.drawText(item.text, {
          x: item.x / scale,
          y: height - (item.y / scale),
          size: item.fontSize / scale,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      // Save modified PDF with metadata stripped
      const pdfBytes = await pdfLibDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name; // Même nom de fichier
      a.click();

      // 🆕 SEJDA-QUALITY: Show font usage summary
      const fontsMessage = `✅ PDF sauvegardé avec succès !

🔒 Métadonnées effacées
🎨 Fonts utilisées:
  • ${fontsUsed.extracted} polices originales (qualité Sejda)
  • ${fontsUsed.standard} polices standard (fallback)`;

      alert(fontsMessage);
    } catch (error) {
      console.error('Error saving PDF:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all hover:scale-105"
              >
                ← Nouveau PDF
              </button>
              <div className="text-sm font-medium text-gray-700">
                📄 {file.name}
              </div>
              <div className="text-xs text-gray-500 bg-blue-100 px-3 py-1 rounded-full">
                Page {currentPage}/{totalPages}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Zoom controls */}
              <button
                onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-all hover:scale-105"
                title="Zoom arrière"
              >
                −
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => setScale(s => Math.min(3, s + 0.25))}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-all hover:scale-105"
                title="Zoom avant"
              >
                +
              </button>

              {/* Edit mode toggle */}
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 rounded-xl transition-all hover:scale-105 ${
                  editMode
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={editMode ? 'Désactiver l\'édition' : 'Activer l\'édition'}
              >
                {editMode ? '✏️ Édition active' : '👁️ Lecture'}
              </button>

              {/* Save button */}
              <button
                onClick={savePDF}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
                title="Sauvegarder avec métadonnées effacées"
              >
                💾 Télécharger
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Instructions rapides */}
        {editMode && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">✏️ Mode édition actif :</span> Cliquez sur n'importe quel texte pour le modifier • Les métadonnées seront effacées lors de la sauvegarde
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Canvas + text overlay */}
          <div className="relative inline-block">
            <canvas ref={canvasRef} className="border-2 border-gray-300 rounded-lg shadow-md" />

            {/* Editable text overlays */}
            {editMode && textItems.map(item => (
              <input
                key={item.id}
                type="text"
                value={item.text}
                onChange={(e) => updateText(item.id, e.target.value)}
                onClick={() => setSelectedText(item.id)}
                className={`absolute border-2 transition-all ${
                  selectedText === item.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-transparent hover:border-blue-300 bg-white'
                }`}
                style={{
                  left: `${item.x}px`,
                  top: `${item.y - item.height}px`,
                  width: `${item.width + 100}px`,
                  height: `${item.height}px`,
                  fontSize: `${item.fontSize}px`,
                  fontFamily: item.fontFamily || 'Arial, sans-serif',
                  fontWeight: item.fontWeight || 400,
                  fontStyle: item.fontStyle || 'normal',
                  padding: '0 2px',
                  lineHeight: `${item.height}px`,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                }}
              />
            ))}
          </div>

          {/* Page navigation */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 disabled:hover:scale-100 font-semibold shadow-lg"
              >
                ← Page précédente
              </button>
              <div className="px-6 py-3 bg-blue-100 text-blue-800 rounded-xl font-bold">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 disabled:hover:scale-100 font-semibold shadow-lg"
              >
                Page suivante →
              </button>
            </div>
          )}
        </div>

        {/* Info métadonnées */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            🔒 <span className="font-semibold">Confidentialité garantie :</span> Toutes les métadonnées (auteur, titre, dates, etc.) seront effacées lors du téléchargement
          </p>
        </div>
      </div>
    </div>
  );
}
