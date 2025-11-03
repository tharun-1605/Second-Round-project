import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let transporter;
let usingTestAccount = false;
let testAccountInfo = null;

const initTransporter = async () => {
  console.log('Initializing email transporter...');

  // For production, prioritize reliable email services
  // Try Mailgun if API key is available (free tier available)
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    console.log('Attempting to use Mailgun...');
    try {
      const formData = (await import('form-data')).default;
      const Mailgun = (await import('mailgun.js')).default;
      const mailgun = new Mailgun(formData).client({
        username: 'api',
        key: process.env.MAILGUN_API_KEY
      });

      transporter = {
        sendMail: async (mailOptions) => {
          const result = await mailgun.messages.create(process.env.MAILGUN_DOMAIN, {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.html
          });
          return {
            messageId: result.id,
            response: '250 OK'
          };
        },
        verify: () => Promise.resolve(true)
      };
      console.log('Mailgun transporter ready.');
      usingTestAccount = false;
      return;
    } catch (err) {
      console.error('Mailgun setup failed:', err.message);
    }
  }

  // Try Gmail SMTP with better configuration
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log('Attempting to use Gmail SMTP with improved settings...');
    try {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      await transporter.verify();
      console.log('Gmail transporter verified successfully.');
      usingTestAccount = false;
      return;
    } catch (err) {
      console.error('Gmail transporter verification failed:', err.message);
      console.log('Falling back to other options...');
    }
  }

  // Fallback to Ethereal test account
  try {
    console.log('Attempting to use Ethereal test account...');
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
    console.log('Ethereal transporter verified successfully.');
    usingTestAccount = true;
    return;
  } catch (err) {
    console.error('Failed to create or verify Ethereal test account:', err);
  }

  // Ultimate fallback: a mock transporter
  console.log('All email services failed. Using mock transporter.');
  transporter = {
    sendMail: (mailOptions) => {
      console.log('--- MOCK EMAIL START ---');
      console.log(`To: ${mailOptions.to}`);
      console.log(`From: ${mailOptions.from}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log('Body (HTML):');
      console.log(mailOptions.html);
      console.log('--- MOCK EMAIL END ---');
      return Promise.resolve({
        messageId: `mock-${Date.now()}`,
        response: '250 OK: message queued for delivery'
      });
    },
    verify: () => Promise.resolve(true)
  };
  usingTestAccount = false;
};

// initialize transporter immediately
initTransporter();

// Store OTPs with their creation time and email
const otpStore = new Map();

export const sendOTP = async (email, otp) => {
  console.log(`Attempting to send OTP to ${email} with OTP ${otp}`);
  try {
    if (!transporter) {
      console.log('Transporter not initialized. Initializing now...');
      await initTransporter();
    }

    if (!transporter) {
      console.error('No email transporter available after initialization.');
      return { success: false, error: 'Email service not available' };
    }

    const mailOptions = {
      from: usingTestAccount ? 'Voting System <noreply@test.com>' : `Voting System <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Voting System - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Email Verification</h1>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #444; text-align: center;">Your Verification Code</h2>
            <div style="font-size: 32px; font-weight: bold; text-align: center; color: #007bff; margin: 20px 0;">
              ${otp}
            </div>
          </div>
          <p style="color: #666; text-align: center;">This verification code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `
    };

    // Add timeout to prevent hanging
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Email sending timeout')), 30000) // 30 second timeout
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log('Email sent to:', email, 'messageId:', info.messageId);

    otpStore.set(email, {
      otp,
      createdAt: Date.now(),
      attempts: 0
    });

    setTimeout(() => {
      if (otpStore.has(email) && otpStore.get(email).otp === otp) {
        otpStore.delete(email);
      }
    }, 10 * 60 * 1000);

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

export const verifyOTP = (email, userOTP) => {
  const otpData = otpStore.get(email);
  
  if (!otpData) {
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  // Increment attempts
  otpData.attempts += 1;
  
  // Check if too many attempts
  if (otpData.attempts >= 3) {
    otpStore.delete(email);
    return { valid: false, message: 'Too many attempts. Please request a new OTP.' };
  }

  // Check if OTP is expired (10 minutes)
  if (Date.now() - otpData.createdAt > 10 * 60 * 1000) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  // Verify OTP
  if (otpData.otp === userOTP) {
    otpStore.delete(email);
    return { valid: true, message: 'OTP verified successfully.' };
  }

  return { valid: false, message: 'Invalid OTP. Please try again.' };
};

export const resendOTP = async (email) => {
  // Remove existing OTP if any
  otpStore.delete(email);
  
  // Generate and send new OTP
  const newOTP = generateOTP();
  return await sendOTP(email, newOTP);
};