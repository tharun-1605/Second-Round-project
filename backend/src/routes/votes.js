import express from 'express';
import Vote from '../models/Vote.js';
import Voter from '../models/Voter.js';
import Candidate from '../models/Candidate.js';
import Election from '../models/Election.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all votes (admin)
router.get('/', authenticate, async (req, res) => {
  try {
    if (!req.voter.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    const votes = await Vote.find()
      .populate('voter')
      .populate('candidate');
    res.json(votes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if current user has voted in an election
router.get('/check/:electionId', authenticate, async (req, res) => {
  try {
    const { electionId } = req.params;
    const voter = await Voter.findById(req.voter._id);
    const hasVoted = voter.votedElections?.some((v) => v.election.toString() === electionId);
    res.json({ hasVoted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cast a vote
router.post('/', authenticate, async (req, res) => {
  try {
    const { electionId, candidateId } = req.body;

    const election = await Election.findById(electionId).populate('candidates');
    if (!election) return res.status(404).json({ message: 'Election not found' });

    // Check election active window
    const now = new Date();
    if (now < new Date(election.startDate) || now > new Date(election.endDate)) {
      return res.status(400).json({ message: 'Election is not active' });
    }

    const voter = await Voter.findById(req.voter._id);
    if (!voter) return res.status(404).json({ message: 'Voter not found' });

    // Check if voter already voted in this election
    if (voter.votedElections?.some((v) => v.election.toString() === electionId)) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    // Create vote (encrypted in model pre-save)
    const vote = new Vote({
      election: electionId,
      voter: voter._id,
      candidate: candidate._id
    });

    // Save vote and update candidate count and voter record
    await vote.save();

    candidate.voteCount = (candidate.voteCount || 0) + 1;
    await candidate.save();

    voter.votedElections = voter.votedElections || [];
    voter.votedElections.push({ election: electionId });
    await voter.save();

    // Emit socket update to election room
    try {
      req.io.to(`election_${electionId}`).emit('vote_update', { electionId });
    } catch (e) {
      // ignore if socket not available
    }

    res.status(201).json({ message: 'Vote cast successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;