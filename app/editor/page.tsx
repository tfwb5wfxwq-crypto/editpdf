'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PDFEditor from '@/components/PDFEditor';

export default function EditorPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load file from sessionStorage
    const fileData = sessionStorage.getItem('pdfFile');
    const fileName = sessionStorage.getItem('pdfFileName');

    if (fileData && fileName) {
      // Convert base64 back to File
      fetch(fileData)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], fileName, { type: 'application/pdf' });
          setPdfFile(file);
          // Clear sessionStorage
          sessionStorage.removeItem('pdfFile');
          sessionStorage.removeItem('pdfFileName');
        });
    }
  }, []);

  if (!pdfFile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre PDF...</p>
        </div>
      </div>
    );
  }

  return <PDFEditor file={pdfFile} onClose={() => router.push('/')} />;
}
