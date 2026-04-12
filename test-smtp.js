
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'info@stdreux.com.au',
        pass: '1800@St123!',
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function main() {
    try {
        console.log('Verifying connection for info@stdreux.com.au...');
        console.log('Using password: 1800@St123! (Hidden in logs usually)');
        await transporter.verify();
        console.log('✅ Connection verified successfully!');
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        if (error.response) console.error('Response:', error.response);
        console.log('\nTip: For Gmail, ensure you are using an App Password, not your login password.');
    }
}

main();
