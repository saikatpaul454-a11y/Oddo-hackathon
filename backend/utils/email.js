const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
      port: process.env.EMAIL_PORT || 2525,
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'EMS Portal'}" <${process.env.EMAIL_FROM || 'noreply@ems.com'}>`,
      to: options.email,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email send failed, logging details below:');
    console.log(`TO: ${options.email}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log(`CONTENT: ${options.text || options.html}`);
    // Do not throw error so the app flow is not broken if email settings aren't configured
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
