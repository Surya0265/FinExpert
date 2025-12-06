const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake');
const prisma = require('../prismaClient');

const fonts = { Helvetica: { normal: 'Helvetica', bold: 'Helvetica-Bold' } };
const printer = new PdfPrinter(fonts);

const generatePDF = async (userId, days) => {
    return new Promise((resolve, reject) => {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            prisma.expenses.findMany({
                where: { user_id: userId, date: { gte: startDate, lte: endDate } },
                select: { category: true, amount: true, date: true },
            }).then(expenses => {
                if (expenses.length === 0) return reject("No expenses found for the selected period.");

                const reportsDir = path.join(__dirname, "reports");
                if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
                
                const filePath = path.join(reportsDir, `Financial_Report_${userId}_${days}days.pdf`);

                const months = Math.round(days / 30);
                const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

                const docDefinition = {
                    content: [
                        { text: `Financial Report - Last ${months} Month${months > 1 ? 's' : ''}`, style: 'header' },
                        { text: `Generated on: ${new Date().toLocaleDateString()}`, style: 'subheader' },
                        { text: '', margin: [0, 10, 0, 10] },
                        {
                            table: {
                                headerRows: 1,
                                widths: ['*', 'auto', 'auto'],
                                body: [
                                    [{ text: 'Category', style: 'tableHeader' }, 
                                     { text: 'Amount ($)', style: 'tableHeader' }, 
                                     { text: 'Date', style: 'tableHeader' }],
                                    ...expenses.map(exp => [
                                        exp.category,
                                        `$${parseFloat(exp.amount).toFixed(2)}`,
                                        new Date(exp.date).toLocaleDateString(),
                                    ])
                                ]
                            }
                        },
                        { text: '', margin: [0, 10, 0, 10] },
                        { text: `Total Expenses: $${totalAmount.toFixed(2)}`, style: 'total' },
                    ],
                    styles: {
                        header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 5] },
                        subheader: { fontSize: 12, alignment: 'center', color: '#666', margin: [0, 0, 0, 10] },
                        tableHeader: { bold: true, fillColor: '#4CAF50', fontSize: 12, color: '#fff' },
                        total: { fontSize: 14, bold: true, alignment: 'right', color: '#1b5e20' }
                    },
                    defaultStyle: { font: 'Helvetica' }
                };

                const pdfDoc = printer.createPdfKitDocument(docDefinition);
                const writeStream = fs.createWriteStream(filePath);
                pdfDoc.pipe(writeStream);
                pdfDoc.end();
                writeStream.on('finish', () => resolve(filePath));
                writeStream.on('error', reject);
            }).catch(reject);
        } catch (error) {
            reject(error);
        }
    });
};

exports.downloadReport = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { days } = req.query;
        
        if (!days || isNaN(days) || days <= 0) {
            return res.status(400).json({ message: "Invalid number of days." });
        }
        
        const filePath = await generatePDF(userId, parseInt(days));
        
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                return res.status(500).json({ message: "Report file not found." });
            }
            
            const months = Math.round(days / 30);
            const fileName = `Financial_Report_${months}months_${new Date().toISOString().split('T')[0]}.pdf`;
            
            res.download(filePath, fileName, (err) => {
                if (err) {
                    console.error('Download error:', err);
                    res.status(500).json({ message: "Error downloading report." });
                }
            });
        });
    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ message: error.message || "Error generating report." });
    }
};
