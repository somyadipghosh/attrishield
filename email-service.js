const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'your-email-service', // e.g., 'gmail'
    auth: {
        user: 'your-email@example.com',
        pass: 'your-email-password'
    }
});

async function sendEmail(req, res) {
    try {
        const { to, subject, message } = req.body;

        const mailOptions = {
            from: 'your-email@example.com',
            to: to,
            subject: subject,
            text: message,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Customer Communication</h2>
                    <p>${message}</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message from our customer service system.
                    </p>
                   </div>`
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({ success: false, message: 'Failed to send email' });
    }
}

module.exports = { sendEmail };
