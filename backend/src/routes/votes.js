import express from 'express';
import Vote from '../models/Vote.js';
import Voter from '../models/Voter.js';
import Candidate from '../models/Candidate.js';

const router = express.Router();

// Get all votes
router.get('/', async (req, res) => {
  try {
    const votes = await Vote.find()
      .populate('voter')
      .populate('candidate');
    res.json(votes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cast a vote
router.post('/', async (req, res) => {
  try {
    // Check if voter has already voted
    const voter = await Voter.findById(req.body.voterId);
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }
    if (voter.hasVoted) {
      return res.status(400).json({ message: 'Voter has already cast a vote' });
    }

    // Create vote and update voter status
    const vote = new Vote({
      voter: req.body.voterId,
      candidate: req.body.candidateId
    });

    const candidate = await Candidate.findById(req.body.candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Update candidate vote count
    candidate.voteCount += 1;
    await candidate.save();

    // Mark voter as having voted
    voter.hasVoted = true;
    await voter.save();

    const newVote = await vote.save();
    res.status(201).json(newVote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;