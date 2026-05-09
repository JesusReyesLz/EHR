import React, { useRef, useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { Printer, Download, X, Loader2 } from 'lucide-react';

interface PDFViewerProps {
  children: React.ReactNode;
  filename?: string;
  onClose: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ children, filename = 'documento.pdf', onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    generatePDF();
  }, []);

  const generatePDF = async () => {
    if (!contentRef.current) return;
    setIsGenerating(true);

    const element = contentRef.current;
    
    // Configuración para html2pdf
    const opt = {
      margin:       0, // Sin márgenes para que el diseño ocupe toda la hoja
      filename:     filename,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    try {
      // Generar el PDF como Blob
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = filename;
    a.click();
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
    iframe.contentWindow?.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex flex-col animate-in fade-in">
      {/* Header / Toolbar */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4 text-white">
          <h2 className="font-bold text-sm uppercase tracking-widest">Previsualización PDF</h2>
          {isGenerating && <Loader2 className="animate-spin text-blue-400" size={16} />}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            disabled={!pdfUrl || isGenerating}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Printer size={16} /> Imprimir
          </button>
          <button 
            onClick={handleDownload}
            disabled={!pdfUrl || isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} /> Descargar
          </button>
          <div className="w-px h-6 bg-slate-700 mx-2"></div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-rose-500 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Viewer Area */}
      <div className="flex-1 overflow-hidden flex justify-center bg-slate-800 p-4">
        {pdfUrl ? (
          <iframe 
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
            className="w-full max-w-4xl h-full rounded-xl shadow-2xl bg-white"
            title="PDF Preview"
          />
        ) : (
          <div className="w-full max-w-4xl h-full bg-white rounded-xl shadow-2xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-slate-400">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-sm font-bold uppercase tracking-widest">Generando Documento...</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Content for PDF Generation */}
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden">
        <div ref={contentRef} className="w-[210mm] min-h-[297mm] bg-white">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
