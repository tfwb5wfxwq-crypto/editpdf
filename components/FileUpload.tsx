'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
}

export default function FileUpload({ onFilesSelected, multiple = true }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
        transition-all duration-200
        ${isDragActive
          ? 'border-blue-600 bg-blue-50 scale-105'
          : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
        }
      `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        {isDragActive ? (
          <div>
            <p className="text-xl font-semibold text-blue-600">Drop your PDF files here</p>
            <p className="text-sm text-gray-600 mt-2">Release to upload</p>
          </div>
        ) : (
          <div>
            <p className="text-xl font-semibold text-gray-900">
              Click or drag PDF files here
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {multiple ? 'Upload one or multiple PDF files' : 'Upload one PDF file'}
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Your files are processed locally - never uploaded to any server
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
