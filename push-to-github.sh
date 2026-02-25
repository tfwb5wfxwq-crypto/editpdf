#!/bin/bash

echo "🚀 Pushing EditPDF to GitHub..."

# Add all files
git add .

# Commit
git commit -m "Complete PDF editor implementation

Features:
- Merge multiple PDFs
- Split PDF into pages
- Compress PDFs
- Beautiful UI with Tailwind CSS
- 100% client-side processing
- Drag & drop file upload
- Mobile responsive

Tech stack:
- Next.js 15
- TypeScript
- pdf-lib
- react-dropzone

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to GitHub
git push origin main

echo "✅ Done! Check https://github.com/iarmy-dev/editpdf"
