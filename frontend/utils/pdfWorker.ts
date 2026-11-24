import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

self.onmessage = async (e: MessageEvent) => {
  const { type, data, filename } = e.data;

  if (type === 'GENERATE_SEO_PDF') {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Title
      pdf.setFontSize(24);
      pdf.setTextColor(15, 23, 42); 
      pdf.text('Plan Kampanii SEO (90 dni)', pageWidth / 2, 20, { align: 'center' });
      
      // Month 1
      pdf.setFontSize(16);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Miesiąc 1: Fundamenty (Dni 1-30)', 14, 55);
      
      autoTable(pdf, {
        startY: 65,
        head: [['Okres', 'Działanie', 'Szczegóły']],
        body: data.month1Data,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      });

      // ... Add more sections as needed ...

      const blob = pdf.output('blob');
      self.postMessage({ type: 'PDF_READY', blob, filename });
    } catch (error) {
      self.postMessage({ type: 'ERROR', error: (error as Error).message });
    }
  }
};
