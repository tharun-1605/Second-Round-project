import express from 'express';
import Candidate from '../models/Candidate.js';

const router = express.Router();

// Get all candidates
router.get('/', async (req, res) => {
  try {
    const candidates = await Candidate.find();
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new candidate
router.post('/', async (req, res) => {
  const candidate = new Candidate({
    name: req.body.name,
    party: req.body.party,
    position: req.body.position
  });

  try {
    const newCandidate = await candidate.save();
    res.status(201).json(newCandidate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update candidate's vote count
router.patch('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (candidate) {
      candidate.voteCount = req.body.voteCount;
      const updatedCandidate = await candidate.save();
      res.json(updatedCandidate);
    } else {
      res.status(404).json({ message: 'Candidate not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;