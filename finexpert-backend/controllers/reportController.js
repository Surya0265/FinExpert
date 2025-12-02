const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer = require('nodemailer');
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

                const docDefinition = {
                    content: [
                        { text: `Financial Report (${days} days)`, style: 'header' },
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
                                        `$${exp.amount.toFixed(2)}`,
                                        new Date(exp.date).toLocaleDateString(),
                                    ])
                                ]
                            }
                        }
                    ],
                    styles: {
                        header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                        tableHeader: { bold: true, fillColor: '#EEEEEE', fontSize: 12 }
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
        if (!days || isNaN(days) || days <= 0) return res.status(400).json({ message: "Invalid number of days." });
        const filePath = await generatePDF(userId, parseInt(days));
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) return res.status(500).json({ message: "Report file not found." });
            res.download(filePath, `Financial_Report_${userId}_${days}days.pdf`, (err) => {
                if (err) res.status(500).json({ message: "Error downloading report." });
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Error generating report." });
    }
};

exports.sendReportByEmail = async (req, res) => {
    try {
        const { email, days } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required." });
        if (!days || isNaN(days) || days <= 0) return res.status(400).json({ message: "Invalid number of days." });
        
        const userId = req.user.user_id;
        const filePath = await generatePDF(userId, parseInt(days));

        fs.access(filePath, fs.constants.F_OK, async (err) => {
            if (err) return res.status(500).json({ message: "Report file not found." });
            
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });
            
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: `Your Financial Report 📊 (${days} days)`,
                text: `Hello! Please find your financial report for the last ${days} days attached.`,
                attachments: [{ filename: `Financial_Report_${userId}_${days}days.pdf`, path: filePath }],
            };
            
            await transporter.sendMail(mailOptions);
            res.json({ message: `Financial report for ${days} days sent successfully to ${email}` });
        });
    } catch (error) {
        res.status(500).json({ message: "Error sending report via email." });
    }
};
