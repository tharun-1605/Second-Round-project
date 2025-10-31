import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const voterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiry: Date
  },
  votedElections: [{
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Hash password before saving
voterSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
voterSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Voter', voterSchema);