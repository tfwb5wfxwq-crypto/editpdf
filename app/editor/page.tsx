'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import PDFEditor from '@/components/PDFEditor';

export default function EditorPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setPdfFile(acceptedFiles[0]);
      }
    },
  });

  if (pdfFile) {
    return <PDFEditor file={pdfFile} onClose={() => setPdfFile(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Éditeur PDF
          </h1>
          <p className="text-lg text-gray-600">
            Importez un PDF pour l'éditer complètement
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-blue-600 bg-blue-50 scale-105'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            {isDragActive ? (
              <p className="text-xl font-medium text-blue-600">Déposez votre PDF ici</p>
            ) : (
              <>
                <p className="text-xl font-medium text-gray-900">
                  Glissez-déposez votre PDF ici
                </p>
                <p className="text-sm text-gray-500">
                  ou cliquez pour sélectionner un fichier
                </p>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <a
            href="/"
            className="px-6 py-3 bg-white border border-gray-300 rounded-xl text-center hover:bg-gray-50 transition-colors"
          >
            ← Retour aux outils
          </a>
          <div className="px-6 py-3 bg-gradient-to-r from-green-100 to-green-50 border border-green-200 rounded-xl text-center text-sm text-green-700">
            🔒 100% privé et local
          </div>
        </div>
      </div>
    </div>
  );
}
