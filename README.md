# LPU Resume Builder

Web app to create resumes from manual input or imported structured text/JSON, preview in A4 format, and export to PDF/Word.

## Quick Start

1. Install dependencies:

	npm install

2. Start development server:

	npm run dev

3. Build for production:

	npm run build

## Project Structure

- Core page: [src/pages/ResumeForm.jsx](src/pages/ResumeForm.jsx)
- Modular resume builder units:
  - [src/pages/resume-form/constants.js](src/pages/resume-form/constants.js)
  - [src/pages/resume-form/parsers.js](src/pages/resume-form/parsers.js)
  - [src/pages/resume-form/EditorSection.jsx](src/pages/resume-form/EditorSection.jsx)
  - [src/pages/resume-form/ResumePreview.jsx](src/pages/resume-form/ResumePreview.jsx)
  - [src/pages/resume-form/exportUtils.js](src/pages/resume-form/exportUtils.js)

## Detailed Documentation

Full technical documentation is available in:

- [docs/RESUME_BUILDER_DOCUMENTATION.md](docs/RESUME_BUILDER_DOCUMENTATION.md)

It includes:

- data flow and state model
- supported import formats
- export architecture (PDF and Word)
- known limitations and troubleshooting
- extension guide for future feature work
