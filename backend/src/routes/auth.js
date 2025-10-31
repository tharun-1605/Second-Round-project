import express from 'express';
import jwt from 'jsonwebtoken';
import Voter from '../models/Voter.js';
import { sendOTP, generateOTP } from '../utils/emailService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register voter
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (await Voter.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const otp = generateOTP();
    const voter = new Voter({
      name,
      email,
      password,
      otp: {
        code: otp,
        expiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      }
    });

    await voter.save();
    const sendResult = await sendOTP(email, otp);

    if (!sendResult.success) {
      // Keep the voter in DB but inform the client about email failure
      console.warn('OTP send failed for', email, sendResult.error);
      return res.status(201).json({ message: 'Registration successful, but OTP email failed to send.', emailError: sendResult.error });
    }

    res.status(201).json({ message: 'Registration successful. Please verify your email.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Test email endpoint (useful for debugging delivery)
router.get('/test-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email query param required' });
    const otp = generateOTP();
    const result = await sendOTP(email, otp);
    if (result.success) return res.json({ message: 'Test email sent', info: result.info });
    return res.status(500).json({ message: 'Failed to send test email', error: result.error });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const voter = await Voter.findOne({ email });

    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    if (voter.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    if (!voter.otp || voter.otp.code !== otp || voter.otp.expiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    voter.isVerified = true;
    voter.otp = undefined;
    await voter.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const voter = await Voter.findOne({ email });

    if (!voter || !(await voter.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!voter.isVerified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }

    const token = jwt.sign(
      { id: voter._id, isAdmin: voter.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: voter._id,
        name: voter.name,
        email: voter.email,
        isAdmin: voter.isAdmin
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({
    id: req.voter._id,
    name: req.voter.name,
    email: req.voter.email,
    isAdmin: req.voter.isAdmin,
    votedElections: req.voter.votedElections
  });
});

export default router;