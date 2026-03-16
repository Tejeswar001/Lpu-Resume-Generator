export const buildFileNameBase = (name) =>
  (name || 'resume')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const getExactPreviewHtml = (previewRefOrElement) => {
  const previewElement = previewRefOrElement?.current || previewRefOrElement;
  if (!previewElement || typeof previewElement.cloneNode !== 'function') return '';

  const clonedPage = previewElement.cloneNode(true);
  const styles = Array.from(document.querySelectorAll('style,link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${styles}
        <style>
          @page { size: A4; margin: 0; }
          html, body { margin: 0; padding: 0; background: #ffffff; }
          body { display: flex; justify-content: center; }
          .print-wrap { width: 210mm; margin: 0; }
          .print-wrap > * { margin: 0 !important; box-shadow: none !important; }
        </style>
      </head>
      <body>
        <div class="print-wrap">${clonedPage.outerHTML}</div>
      </body>
    </html>
  `;
};

export const openPdfPrintWindow = (html) => {
  const printWindow = window.open('', '_blank', 'width=1024,height=900');
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 300);
  return true;
};

export const downloadWordFromHtml = (html, fileNameBase) => {
  const blob = new Blob(['\ufeff', html], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileNameBase || 'resume'}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
