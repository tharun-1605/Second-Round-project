import express from 'express';
import Voter from '../models/Voter.js';

const router = express.Router();

// Get all voters
router.get('/', async (req, res) => {
  try {
    const voters = await Voter.find();
    res.json(voters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new voter
router.post('/', async (req, res) => {
  const voter = new Voter({
    name: req.body.name,
    email: req.body.email
  });

  try {
    const newVoter = await voter.save();
    res.status(201).json(newVoter);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update voter's voting status
router.patch('/:id', async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id);
    if (voter) {
      voter.hasVoted = req.body.hasVoted;
      const updatedVoter = await voter.save();
      res.json(updatedVoter);
    } else {
      res.status(404).json({ message: 'Voter not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;