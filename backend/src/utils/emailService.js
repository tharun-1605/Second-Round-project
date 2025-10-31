import nodemailer from 'nodemailer';

let transporter;
let usingTestAccount = false;
let testAccountInfo = null;

const initTransporter = async () => {
  // If real credentials are provided, use Gmail SMTP. Otherwise, fall back to Ethereal test account.
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    try {
      await transporter.verify();
      console.log('Email transporter is ready (Gmail)');
      usingTestAccount = false;
      return;
    } catch (err) {
      console.warn('Gmail transporter verification failed:', err.message);
      // fallthrough to create test account
    }
  }

  // Create a test account (Ethereal) for local development/testing
  try {
    const account = await nodemailer.createTestAccount();
    testAccountInfo = account;
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });
    await transporter.verify();
    usingTestAccount = true;
    console.log('Email transporter is ready (Ethereal test account)');
  } catch (err) {
    console.warn('Failed to create Ethereal test account:', err.message);
  }
};

// initialize transporter immediately
initTransporter();

export const sendOTP = async (email, otp) => {
  if (!transporter) {
    await initTransporter();
  }

  try {
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'Voting System'} <${process.env.EMAIL_USER || (testAccountInfo && testAccountInfo.user) || 'no-reply@example.com'}>`,
      to: email,
      subject: 'Voting System - Email Verification OTP',
      html: `
        <h1>Email Verification</h1>
        <p>Your OTP for email verification is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    let previewUrl = null;
    if (usingTestAccount) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Preview URL:', previewUrl);
    }

    return { success: true, info, previewUrl };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};