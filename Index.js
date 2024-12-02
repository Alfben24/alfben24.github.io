// Extraer texto del PDF con OCR y mejorar precisión
async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    const totalPages = pdfDoc.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        const { data: { text } } = await Tesseract.recognize(canvas, "spa", {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const progress = Math.round((pageNum - 1 + m.progress) / totalPages * 100);
                    progressBar.style.width = `${progress}%`;
                }
            }
        });

        fullText += text + "\n";
    }

    return fullText;
}

// Convertir texto a Excel con formato mejorado
function textToExcel(text) {
    const rows = text.split("\n").filter(row => row.trim() !== "").map(row => row.split(/\s+/));
    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Ajustar ancho de columnas para mayor legibilidad
    const columnWidths = rows[0].map(() => ({ wch: 20 }));
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");
    return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
}
