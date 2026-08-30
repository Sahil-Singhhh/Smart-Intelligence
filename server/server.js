const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-revision-planner';
        console.log(`Connecting to MongoDB...`);
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Warning: ${error.message}`);
        console.error(`Note: Set MONGO_URI in environment variables to a cloud MongoDB Atlas cluster for Render production.`);
        // Do NOT call process.exit(1) so Express server remains alive on cloud deployments
    }
};

connectDB();

// Root & Health Check Endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'Smart Intelligence Backend API is active & running 🚀',
        timestamp: new Date()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/topics', require('./routes/topicRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
