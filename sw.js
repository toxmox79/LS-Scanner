document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-upload');
    const extractButton = document.getElementById('extract-data');
    const dataTableBody = document.querySelector('#extracted-data-table tbody');

    // Datenstruktur für extrahierte Daten
    let extractedData = [];

    // Event-Listener für Datei-Upload
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // Dateiverarbeitung basierend auf Dateityp
            processFile(file).then(data => {
                extractedData = data;
                console.log('Datei verarbeitet:', extractedData);
            }).catch(error => {
                console.error('Fehler beim Verarbeiten der Datei:', error);
            });
        }
    });

    // Event-Listener für Datenextraktion
    extractButton.addEventListener('click', () => {
        // Daten zusammenfassen nach EAN
        const summarizedData = summarizeDataByEAN(extractedData);
        // Tabelle füllen
        populateTable(summarizedData);
    });

    // Funktion zum Verarbeiten der Datei (PDF, Excel, CSV)
    async function processFile(file) {
        const fileType = file.type;
        let data = [];

        if (fileType === 'application/pdf') {
            // PDF-Verarbeitung mit pdf.js
            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
            const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
            const numPages = pdf.numPages;
            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                // Beispielhafte Extraktion (an tatsächliche PDF-Struktur anpassen)
                data.push(...parsePDFText(textContent));
            }
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || fileType === 'text/csv') {
            // Excel- oder CSV-Verarbeitung mit SheetJS
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            data = XLSX.utils.sheet_to_json(sheet);
        } else {
            throw new Error('Nicht unterstütztes Dateiformat');
        }

        // Normalisierung der Daten
        return data.map(item => ({
            ean: item.ean || item.EAN || '',
            produkt: item.produkt || item.Produkt || 'Unbekannt',
            menge: parseInt(item.menge || item.Menge || 0, 10),
            details: item.details || item.Details || ''
        }));
    }

    // Platzhalter für PDF-Text-Parsing (an tatsächliche Struktur anpassen)
    function parsePDFText(textContent) {
        // Beispielhafte Logik; an tatsächliche PDF-Datenstruktur anpassen
        return [
            { ean: '1234567890123', produkt: 'Produkt A', menge: 5, details: 'Detail A' },
            { ean: '1234567890123', produkt: 'Produkt A', menge: 3, details: 'Detail A' },
            { ean: '9876543210987', produkt: 'Produkt B', menge: 2, details: 'Detail B' }
        ];
    }

    // Funktion zum Zusammenfassen der Daten nach EAN
    function summarizeDataByEAN(data) {
        const summarized = {};

        data.forEach(item => {
            if (!item.ean) return; // Ungültige EANs überspringen
            if (summarized[item.ean]) {
                // EAN existiert bereits, Menge addieren
                summarized[item.ean].menge += item.menge;
            } else {
                // Neue EAN, Daten übernehmen
                summarized[item.ean] = { ...item };
            }
        });

        // Objekt in Array umwandeln
        return Object.values(summarized);
    }

    // Funktion zum Füllen der Tabelle
    function populateTable(data) {
        // Tabelle leeren
        dataTableBody.innerHTML = '';

        // Daten in Tabelle einfügen
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.ean}</td>
                <td>${item.produkt}</td>
                <td>${item.menge}</td>
                <td>${item.ean}</td> <!-- Gescannte EANs, hier als Platzhalter -->
                <td>${item.details}</td>
            `;
            dataTableBody.appendChild(row);
        });
    }
});
