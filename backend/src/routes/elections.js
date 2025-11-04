import express from 'express';
import Election from '../models/Election.js';
import Candidate from '../models/Candidate.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all elections
router.get('/', async (req, res) => {
  try {
    const elections = await Election.find().populate('candidates');
    res.json(elections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create election (admin)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { title, description, startDate, endDate } = req.body;
    const election = new Election({ title, description, startDate, endDate });
    const newElection = await election.save();
    res.status(201).json(newElection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add candidate to election (admin)
router.post('/:id/candidates', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { candidateId } = req.body;
    const election = await Election.findById(id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    election.candidates = election.candidates || [];
    if (!election.candidates.includes(candidateId)) {
      election.candidates.push(candidateId);
      await election.save();
    }
    res.json({ message: 'Candidate added to election' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get election details
router.get('/:id', async (req, res) => {
  try {
    const election = await Election.findById(req.params.id).populate('candidates');
    if (!election) return res.status(404).json({ message: 'Election not found' });
    res.json(election);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get election results
router.get('/:id/results', async (req, res) => {
  try {
    const election = await Election.findById(req.params.id).populate('candidates').populate('winner.candidate');
    if (!election) return res.status(404).json({ message: 'Election not found' });

    const totalVoters = election.voterCount || 0;
    const candidates = election.candidates.map((c) => ({
      _id: c._id,
      name: c.name,
      party: c.party,
      voteCount: c.voteCount || 0
    }));

    const totalVotes = candidates.reduce((s, c) => s + c.voteCount, 0);

    // Check if election has ended and should be finalized
    const now = new Date();
    const endDate = new Date(election.endDate);
    const shouldFinalize = now > endDate && election.status === 'completed';

    let winner = null;
    if (election.status === 'finalized' && election.winner) {
      winner = {
        candidate: election.winner.candidate,
        votes: election.winner.votes,
        finalizedAt: election.winner.finalizedAt
      };
    } else if (shouldFinalize) {
      // Auto-finalize election and determine winner
      const maxVotes = Math.max(...candidates.map(c => c.voteCount));
      const winningCandidates = candidates.filter(c => c.voteCount === maxVotes);

      if (winningCandidates.length === 1) {
        winner = {
          candidate: winningCandidates[0],
          votes: maxVotes,
          finalizedAt: new Date()
        };

        // Update election status to finalized
        election.status = 'finalized';
        election.winner = {
          candidate: winningCandidates[0]._id,
          votes: maxVotes,
          finalizedAt: new Date()
        };
        await election.save();
      }
    }

    res.json({
      _id: election._id,
      title: election.title,
      status: election.status,
      endDate: election.endDate,
      candidates,
      totalVotes,
      totalVoters,
      winner
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
