importScripts('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

self.onmessage = function(e) {
    const { imgData, width, height } = e.data;
    
    // Get jsPDF from the loaded UMD module inside the worker
    const { jsPDF } = self.jspdf;

    let orientation = width >= height ? 'landscape' : 'portrait';
    let pdf = new jsPDF({ orientation: orientation, unit: 'px', format: [width, height] });

    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    
    const pdfBlob = pdf.output('blob');
    self.postMessage({ pdfBlob });
};