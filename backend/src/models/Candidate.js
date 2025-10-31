import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  party: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  voteCount: {
    type: Number,
    default: 0
  }
});

export default mongoose.model('Candidate', candidateSchema);