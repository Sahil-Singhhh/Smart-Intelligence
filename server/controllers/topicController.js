const Topic = require('../models/Topic');
const TestResult = require('../models/TestResult');

const addTopic = async (req, res) => {
    const { subject, topicName, difficulty, priority, keyPoints } = req.body;

    try {
        console.log('Adding topic:', { subject, topicName, userId: req.user.id, keyPoints });
        const topic = await Topic.create({
            userId: req.user.id,
            subject,
            topicName,
            difficulty,
            priority,
            keyPoints: keyPoints || [],
        });
        res.status(201).json(topic);
    } catch (error) {
        console.error('Error adding topic:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const getTopics = async (req, res) => {
    try {
        const topics = await Topic.find({ userId: req.user.id });
        res.json(topics);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteTopic = async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);

        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        // Ensure user owns topic
        if (topic.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Delete topic document
        await Topic.deleteOne({ _id: topic._id });

        // Clean up associated test results
        await TestResult.deleteMany({ topicId: topic._id });

        // Send HTTP success response
        return res.json({ message: 'Topic deleted successfully', id: topic._id });
    } catch (error) {
        console.error('Error deleting topic:', error);
        return res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

module.exports = { addTopic, getTopics, deleteTopic };
