import jwt from 'jsonwebtoken';
import Voter from '../models/Voter.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const voter = await Voter.findById(decoded.id);
    
    if (!voter) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.voter = voter;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.voter.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};