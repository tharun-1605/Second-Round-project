import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import voterRoutes from './routes/voters.js';
import candidateRoutes from './routes/candidates.js';
import voteRoutes from './routes/votes.js';
import electionRoutes from './routes/elections.js';
import authRoutes from './routes/auth.js';
import Voter from './models/Voter.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'https://second-round-project-ir7s.vercel.app'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://second-round-project-ir7s.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors()); // Handle preflight OPTIONS requests
app.use(express.json());

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('join_election', (electionId) => {
    socket.join(`election_${electionId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io available in the request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/voters', voterRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/elections', electionRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Ensure default admin exists
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
      const adminPass = process.env.ADMIN_PASSWORD || 'admin@123';
      let admin = await Voter.findOne({ email: adminEmail });
      if (!admin) {
        admin = new Voter({
          name: 'Admin',
          email: adminEmail,
          password: adminPass,
          isAdmin: true,
          isVerified: true
        });
        await admin.save();
        console.log('Default admin user created:', adminEmail);
      } else {
        console.log('Admin user already exists:', adminEmail);
      }
    } catch (err) {
      console.error('Failed to ensure admin user:', err.message);
    }
  })
  .catch((error) => console.error('MongoDB connection error:', error));

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});