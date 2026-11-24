import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

/**
 * Export the entire page to PDF with colors preserved
 */
export async function exportPageToPDF(filename: string = 'lexportal-checklist.pdf'): Promise<void> {
  try {
    // Get the main content element
    const element = document.body;
    
    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: getComputedStyle(document.documentElement).backgroundColor,
    });

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content is longer than one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}

/**
 * Generate a professional 90-day SEO campaign plan PDF for LexPortal using a Web Worker
 */
export async function generateSEOCampaignPDF(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const worker = new Worker(new URL('./pdfWorker.ts', import.meta.url), { type: 'module' });

      const month1Data = [
        ['Tydzień 1-2', 'Audyt Techniczny', 'Analiza struktury strony, szybkości ładowania, mobile-friendliness'],
        ['', 'Research Słów Kluczowych', 'Identyfikacja 50-100 głównych fraz prawniczych'],
        ['Tydzień 3-4', 'Optymalizacja On-Page', 'Meta tagi, nagłówki, struktura URL, schema markup'],
        ['', 'Content Strategy', 'Plan treści na 3 miesiące - artykuły eksperckie'],
      ];

      worker.onmessage = (e) => {
        const { type, blob, filename, error } = e.data;
        if (type === 'PDF_READY') {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename || 'lexportal-seo-campaign.pdf';
          link.click();
          URL.revokeObjectURL(url);
          worker.terminate();
          resolve();
        } else if (type === 'ERROR') {
          worker.terminate();
          reject(new Error(error));
        }
      };

      worker.postMessage({
        type: 'GENERATE_SEO_PDF',
        data: { month1Data },
        filename: 'lexportal-seo-campaign-90-days.pdf'
      });
    } catch (error) {
      console.error('Error starting PDF worker:', error);
      reject(new Error('Failed to start PDF generation.'));
    }
  });
}
