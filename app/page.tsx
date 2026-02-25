'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      // Store file in sessionStorage and redirect
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          sessionStorage.setItem('pdfFile', e.target.result as string);
          sessionStorage.setItem('pdfFileName', file.name);
          router.push('/editor');
        }
      };
      reader.readAsDataURL(file);
    }
  }, [router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Éditeur PDF
          </h1>
          <p className="text-xl text-gray-600">
            Glissez votre PDF • Modifiez en 1 seconde • Sauvegardez
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            100% privé • Aucune donnée envoyée
          </div>
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`
            border-3 border-dashed rounded-3xl p-16 text-center cursor-pointer
            transition-all duration-300 transform
            ${isDragActive
              ? 'border-blue-600 bg-blue-50 scale-105 shadow-2xl'
              : 'border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50/30 hover:scale-102 shadow-xl'
            }
          `}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center space-y-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isDragActive ? 'bg-blue-600 scale-110' : 'bg-gradient-to-br from-blue-600 to-purple-600'
            }`}>
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            {isDragActive ? (
              <div>
                <p className="text-2xl font-bold text-blue-600">Déposez votre PDF maintenant !</p>
                <p className="text-gray-600 mt-2">Édition instantanée ⚡</p>
              </div>
            ) : (
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  Glissez-déposez votre PDF ici
                </p>
                <p className="text-gray-600 mb-4">
                  ou cliquez pour sélectionner
                </p>
                <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <span>Modifiez du texte • Supprimez des passages • Corrigez des fautes</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center border border-gray-200">
            <div className="text-3xl mb-2">⚡</div>
            <div className="font-semibold text-gray-900 mb-1">Ultra rapide</div>
            <div className="text-sm text-gray-600">Édition en temps réel</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center border border-gray-200">
            <div className="text-3xl mb-2">🔒</div>
            <div className="font-semibold text-gray-900 mb-1">100% privé</div>
            <div className="text-sm text-gray-600">Traitement local uniquement</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center border border-gray-200">
            <div className="text-3xl mb-2">🆓</div>
            <div className="font-semibold text-gray-900 mb-1">Gratuit</div>
            <div className="text-sm text-gray-600">Sans limite, sans compte</div>
          </div>
        </div>
      </div>
    </main>
  );
}
