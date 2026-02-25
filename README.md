# EditPDF - Professional PDF Editor

A modern, **100% client-side** PDF editor built with Next.js and pdf-lib. All processing happens locally in your browser - no uploads, maximum privacy.

![EditPDF](https://img.shields.io/badge/privacy-100%25-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- 🔀 **Merge PDFs** - Combine multiple PDF files into one
- ✂️ **Split PDF** - Extract individual pages or split into multiple files
- 🗜️ **Compress** - Reduce PDF file size without quality loss
- 🔒 **100% Private** - All processing happens locally, files never leave your device
- ⚡ **Lightning Fast** - Optimized PDF engine for instant results
- 🆓 **Always Free** - No limits, watermarks, or subscriptions
- 📱 **Mobile Friendly** - Works seamlessly on all devices

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **PDF Processing**: pdf-lib (client-side)
- **Styling**: Tailwind CSS 4.0
- **File Upload**: react-dropzone
- **Type Safety**: TypeScript
- **Deployment**: Vercel

## 📦 Core Dependencies

```json
{
  "pdf-lib": "^1.17.1",
  "pdfjs-dist": "^4.0.379",
  "react-dropzone": "^14.2.3"
}
```

## 🎨 Project Structure

```
editpdf/
├── app/
│   ├── page.tsx              # Main page
│   └── layout.tsx            # Root layout
├── components/
│   └── FileUpload.tsx        # Drag & drop upload
├── lib/
│   └── pdf-operations.ts     # PDF utilities
└── package.json
```

## 🔒 Privacy & Security

**EditPDF is 100% private:**
- ✅ All processing happens in your browser
- ✅ Files never uploaded to any server
- ✅ No tracking or analytics
- ✅ No data storage
- ✅ Open source & transparent

## 📝 License

MIT License - feel free to use for any project

---

Made with ❤️ for privacy-conscious users
