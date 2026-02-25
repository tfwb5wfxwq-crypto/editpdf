'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import { mergePDFs, splitPDF, compressPDF } from '@/lib/pdf-operations';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setMessage('');
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setMessage('Please select at least 2 PDF files to merge');
      return;
    }

    setProcessing(true);
    setMessage('Merging PDFs...');

    try {
      const mergedPdf = await mergePDFs(files);
      const blob = new Blob([mergedPdf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      a.click();
      setMessage('✅ PDFs merged successfully!');
    } catch (error) {
      setMessage('❌ Error merging PDFs: ' + (error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (files.length !== 1) {
      setMessage('Please select exactly 1 PDF file to split');
      return;
    }

    setProcessing(true);
    setMessage('Splitting PDF...');

    try {
      const splitPdfs = await splitPDF(files[0]);
      splitPdfs.forEach((pdf, index) => {
        const blob = new Blob([pdf], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `page-${index + 1}.pdf`;
        a.click();
      });
      setMessage(`✅ PDF split into ${splitPdfs.length} pages!`);
    } catch (error) {
      setMessage('❌ Error splitting PDF: ' + (error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCompress = async () => {
    if (files.length !== 1) {
      setMessage('Please select exactly 1 PDF file to compress');
      return;
    }

    setProcessing(true);
    setMessage('Compressing PDF...');

    try {
      const compressedPdf = await compressPDF(files[0]);
      const blob = new Blob([compressedPdf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'compressed.pdf';
      a.click();

      const originalSize = files[0].size;
      const newSize = compressedPdf.length;
      const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);
      setMessage(`✅ PDF compressed! Size reduced by ${reduction}%`);
    } catch (error) {
      setMessage('❌ Error compressing PDF: ' + (error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EditPDF
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">100% Private</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Free
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Professional PDF Editor
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mt-2">
              Fast, Free & Secure
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Merge, split, and compress PDFs directly in your browser.
            <br />
            <span className="text-sm font-medium text-green-600">🔒 No upload • 100% local processing • Privacy guaranteed</span>
          </p>
        </div>

        {/* File Upload */}
        <div className="mb-8">
          <FileUpload onFilesSelected={handleFilesSelected} />
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mb-8 p-4 rounded-xl text-center font-medium ${
            message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' :
            message.includes('❌') ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {message}
          </div>
        )}

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mb-12 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              Selected Files ({files.length})
            </h3>
            <div className="space-y-2 mb-6">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm">
                    PDF
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid sm:grid-cols-3 gap-3">
              <button
                onClick={handleMerge}
                disabled={files.length < 2 || processing}
                className="group px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                <span className="text-2xl block mb-1">🔀</span>
                <span className="block text-sm">Merge PDFs</span>
                <span className="block text-xs opacity-75 mt-1">Combine files</span>
              </button>

              <button
                onClick={handleSplit}
                disabled={files.length !== 1 || processing}
                className="group px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                <span className="text-2xl block mb-1">✂️</span>
                <span className="block text-sm">Split PDF</span>
                <span className="block text-xs opacity-75 mt-1">Extract pages</span>
              </button>

              <button
                onClick={handleCompress}
                disabled={files.length !== 1 || processing}
                className="group px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                <span className="text-2xl block mb-1">🗜️</span>
                <span className="block text-sm">Compress</span>
                <span className="block text-xs opacity-75 mt-1">Reduce size</span>
              </button>
            </div>

            {processing && (
              <div className="mt-6 flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Processing...</span>
              </div>
            )}
          </div>
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: '🔀',
              title: 'Merge PDFs',
              description: 'Combine multiple PDF files into one document instantly'
            },
            {
              icon: '✂️',
              title: 'Split PDF',
              description: 'Extract individual pages or split into multiple files'
            },
            {
              icon: '🗜️',
              title: 'Compress',
              description: 'Reduce PDF file size while maintaining quality'
            },
            {
              icon: '🔒',
              title: '100% Secure',
              description: 'All processing happens locally - files never leave your device'
            },
            {
              icon: '⚡',
              title: 'Lightning Fast',
              description: 'Process PDFs in seconds with our optimized engine'
            },
            {
              icon: '🆓',
              title: 'Always Free',
              description: 'No limits, no watermarks, no subscriptions'
            }
          ].map((feature, idx) => (
            <div key={idx} className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-200">
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Made with ❤️ • <span className="font-semibold text-green-600">100% Private</span> • No data stored • Open source
            </p>
            <p className="text-xs text-gray-500 mt-2">
              All PDF processing happens locally in your browser. Your files are never uploaded to any server.
            </p>
            <div className="mt-4 flex justify-center space-x-4 text-xs text-gray-500">
              <a href="#" className="hover:text-blue-600">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-blue-600">Terms of Service</a>
              <span>•</span>
              <a href="https://github.com/iarmy-dev/editpdf" className="hover:text-blue-600">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
