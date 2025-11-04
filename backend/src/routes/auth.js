import express from 'express';
import jwt from 'jsonwebtoken';
import Voter from '../models/Voter.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register voter
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (await Voter.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const voter = new Voter({
      name,
      email,
      password,
      isVerified: true
    });

    console.log('Attempting to save new voter...');
    await voter.save();
    console.log('Voter saved successfully.');

    // Generate JWT token for automatic login
    const token = jwt.sign(
      { id: voter._id, email: voter.email, isAdmin: voter.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration completed successfully.',
      token,
      user: {
        id: voter._id,
        name: voter.name,
        email: voter.email,
        isAdmin: voter.isAdmin
      }
    });
  } catch (error) {
    console.error('An unexpected error occurred during registration:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
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