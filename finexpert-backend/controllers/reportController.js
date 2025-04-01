const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Function to generate PDF for a given time period
const generatePDF = async (userId, days) => {
    return new Promise(async (resolve, reject) => {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days); // Adjust based on user input

            const expenses = await prisma.expense.findMany({
                where: {
                    user_id: userId,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                select: { category: true, amount: true, date: true },
            });

            if (expenses.length === 0) {
                return reject("No expenses found for the selected period.");
            }

            const doc = new PDFDocument();
            const filePath = `./reports/Financial_Report_${userId}_${days}days.pdf`;
            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            // Title
            doc.fontSize(20).text(`Financial Report (${days} days)`, { align: 'center' });
            doc.moveDown();

            // Table Header
            doc.fontSize(12).text('Category', 100, 100, { continued: true });
            doc.text('Amount', 300, 100, { continued: true });
            doc.text('Date', 450, 100);
            doc.moveDown();

            // Add Expenses Data
            expenses.forEach(exp => {
                doc.text(exp.category, 100, doc.y, { continued: true });
                doc.text(`$${exp.amount.toFixed(2)}`, 300, doc.y, { continued: true });
                doc.text(new Date(exp.date).toDateString(), 450, doc.y);
                doc.moveDown();
            });

            doc.end();
            writeStream.on('finish', () => resolve(filePath));
        } catch (error) {
            reject(error);
        }
    });
};

// Controller to Download the Report
exports.downloadReport = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { days } = req.query;

        if (!days || isNaN(days) || days <= 0) {
            return res.status(400).json({ message: "Invalid number of days. Provide a valid number." });
        }

        const filePath = await generatePDF(userId, parseInt(days));

        res.download(filePath, `Financial_Report_${userId}_${days}days.pdf`, (err) => {
            if (err) {
                console.error("Download Error:", err);
                res.status(500).json({ message: "Error downloading report." });
            }
        });
    } catch (error) {
        console.error("Report Generation Error:", error);
        res.status(500).json({ message: "Error generating report." });
    }
};

// Controller to Send Report via Email
exports.sendReportByEmail = async (req, res) => {
    try {
        const { email, days } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required." });
        if (!days || isNaN(days) || days <= 0) {
            return res.status(400).json({ message: "Invalid number of days. Provide a valid number." });
        }

        const userId = req.user.user_id;
        const filePath = await generatePDF(userId, parseInt(days));

        // Configure Nodemailer Transport
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Email Options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Your Financial Report 📊 (${days} days)`,
            text: `Hello! Please find your financial report for the last ${days} days attached.`,
            attachments: [{ filename: `Financial_Report_${userId}_${days}days.pdf`, path: filePath }],
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: `Financial report for ${days} days sent successfully to ${email}` });
    } catch (error) {
        console.error("Email Sending Error:", error);
        res.status(500).json({ message: "Error sending report via email." });
    }
};
