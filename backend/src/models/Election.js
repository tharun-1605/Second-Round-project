import mongoose from 'mongoose';

const electionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  },
  candidates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate'
  }],
  voterCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Election', electionSchema);