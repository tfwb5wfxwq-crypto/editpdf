import { PDFDocument, degrees as pdfDegrees } from 'pdf-lib';

/**
 * Merge multiple PDF files into one
 */
export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Split a PDF into individual pages
 */
export async function splitPDF(file: File): Promise<Uint8Array[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pageCount = pdf.getPageCount();
  const splitPdfs: Uint8Array[] = [];

  for (let i = 0; i < pageCount; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(copiedPage);
    const pdfBytes = await newPdf.save();
    splitPdfs.push(pdfBytes);
  }

  return splitPdfs;
}

/**
 * Compress a PDF by removing unused objects and optimizing
 */
export async function compressPDF(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);

  // Remove metadata to reduce size
  pdf.setTitle('');
  pdf.setAuthor('');
  pdf.setSubject('');
  pdf.setKeywords([]);
  pdf.setProducer('');
  pdf.setCreator('');

  // Save with compression options
  const compressedPdf = await pdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  return compressedPdf;
}

/**
 * Extract pages from a PDF (e.g., pages 1-3, 5, 7-10)
 */
export async function extractPages(
  file: File,
  pageNumbers: number[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();

  // Validate page numbers
  const totalPages = pdf.getPageCount();
  const validPages = pageNumbers.filter(
    (num) => num >= 1 && num <= totalPages
  );

  // Copy selected pages (convert from 1-indexed to 0-indexed)
  const copiedPages = await newPdf.copyPages(
    pdf,
    validPages.map((n) => n - 1)
  );
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

/**
 * Rotate PDF pages
 */
export async function rotatePDF(
  file: File,
  degrees: 90 | 180 | 270
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();

  pages.forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(pdfDegrees(currentRotation + degrees));
  });

  return await pdf.save();
}

/**
 * Get PDF metadata
 */
export async function getPDFMetadata(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);

  return {
    pageCount: pdf.getPageCount(),
    title: pdf.getTitle(),
    author: pdf.getAuthor(),
    subject: pdf.getSubject(),
    keywords: pdf.getKeywords(),
    creator: pdf.getCreator(),
    producer: pdf.getProducer(),
    creationDate: pdf.getCreationDate(),
    modificationDate: pdf.getModificationDate(),
  };
}
