import axios from 'axios';

const API_URL = 'https://second-round-project-4.onrender.com/api';

export const api = axios.create({
  baseURL: API_URL
});

// Voter APIs
export const getVoters = () => api.get('/voters');
export const createVoter = (voter) => api.post('/voters', voter);
export const updateVoterStatus = (id, hasVoted) => api.patch(`/voters/${id}`, { hasVoted });

// Candidate APIs
export const getCandidates = () => api.get('/candidates');
export const createCandidate = (candidate) => api.post('/candidates', candidate);
export const updateCandidateVotes = (id, voteCount) => api.patch(`/candidates/${id}`, { voteCount });

// Election APIs
export const getElections = () => api.get('/elections');

// Vote APIs
export const getVotes = () => api.get('/votes');
export const castVote = (payload) => api.post('/votes', payload);