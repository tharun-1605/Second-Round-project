import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let transporter;
let usingTestAccount = false;
let testAccountInfo = null;

const initTransporter = async () => {
  // If real credentials are provided, use Gmail SMTP. Otherwise, fall back to Ethereal test account.
  console.log('Checking email credentials...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD exists:', !!process.env.EMAIL_PASSWORD);

  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // This should be your App Password, not your regular Gmail password
      }
    });

    try {
      await transporter.verify();
      console.log('Email transporter is ready (Gmail)');
      console.log('Using email account:', process.env.EMAIL_USER);
      usingTestAccount = false;
      return;
    } catch (err) {
      console.error('Gmail transporter verification failed:', err);
      console.error('Email configuration:', {
        user: process.env.EMAIL_USER,
        hasPassword: !!process.env.EMAIL_PASSWORD
      });
      console.log('Falling back to Ethereal test account due to Gmail failure');
      // Fall back to Ethereal instead of throwing
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

// Store OTPs with their creation time and email
const otpStore = new Map();

export const sendOTP = async (email, otp) => {
  if (!transporter) {
    await initTransporter();
  }

  try {
    const mailOptions = {
      from: `Voting System <${process.env.EMAIL_USER}>`,
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

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent to:', email, 'messageId:', info.messageId);

    // Store OTP with timestamp
    otpStore.set(email, {
      otp,
      createdAt: Date.now(),
      attempts: 0
    });

    // Set OTP to expire after 10 minutes
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