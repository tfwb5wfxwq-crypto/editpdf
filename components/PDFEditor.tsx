'use client';

import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
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
  const [editMode, setEditMode] = useState(false);
  const [scale, setScale] = useState(1.5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  useEffect(() => {
    loadPDF();
  }, [file]);

  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale]);

  const loadPDF = async () => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    setPdfDoc(pdf);
    setTotalPages(pdf.numPages);
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

        // Try to determine font family from font name
        let fontFamily = 'Arial, sans-serif';
        const fontName = item.fontName || '';
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
          transform: transform,
        });
      }
    });

    setTextItems(items);
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
      const pages = pdfLibDoc.getPages();
      const page = pages[currentPage - 1];

      // Get appropriate fonts based on detected font families
      const fontCache: { [key: string]: any } = {};
      const getFont = async (fontFamily?: string) => {
        if (!fontFamily) return await pdfLibDoc.embedFont(StandardFonts.Helvetica);

        if (fontCache[fontFamily]) return fontCache[fontFamily];

        let standardFont = StandardFonts.Helvetica;
        if (fontFamily.includes('Times') || fontFamily.includes('Serif')) {
          standardFont = StandardFonts.TimesRoman;
        } else if (fontFamily.includes('Courier') || fontFamily.includes('Mono')) {
          standardFont = StandardFonts.Courier;
        }

        const font = await pdfLibDoc.embedFont(standardFont);
        fontCache[fontFamily] = font;
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

      // Draw new text with original fonts
      for (const item of textItems) {
        const font = await getFont(item.fontFamily);
        page.drawText(item.text, {
          x: item.x / scale,
          y: height - (item.y / scale),
          size: item.fontSize / scale,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      // Save modified PDF
      const pdfBytes = await pdfLibDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited-${file.name}`;
      a.click();

      alert('✅ PDF modifié sauvegardé avec les fonts originales !');
    } catch (error) {
      console.error('Error saving PDF:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ← Retour
              </button>
              <div className="text-sm text-gray-600">
                {file.name} • Page {currentPage} / {totalPages}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Zoom controls */}
              <button
                onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                −
              </button>
              <span className="px-3 py-2 text-sm">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => setScale(s => Math.min(3, s + 0.25))}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                +
              </button>

              {/* Edit mode toggle */}
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  editMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {editMode ? '✏️ Mode édition' : '👁️ Mode lecture'}
              </button>

              {/* Save button */}
              <button
                onClick={savePDF}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
              >
                💾 Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Canvas + text overlay */}
          <div className="relative inline-block">
            <canvas ref={canvasRef} className="border border-gray-300" />

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
                    : 'border-transparent hover:border-blue-300 bg-transparent'
                }`}
                style={{
                  left: `${item.x}px`,
                  top: `${item.y - item.height}px`,
                  width: `${item.width + 100}px`,
                  height: `${item.height}px`,
                  fontSize: `${item.fontSize}px`,
                  fontFamily: item.fontFamily || 'Arial, sans-serif',
                  padding: '0',
                  lineHeight: `${item.height}px`,
                }}
              />
            ))}
          </div>

          {/* Page navigation */}
          <div className="mt-6 flex items-center justify-center space-x-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Précédent
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
