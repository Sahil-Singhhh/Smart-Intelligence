const Topic = require('../models/Topic');
const TestResult = require('../models/TestResult');
const { analyzePerformance } = require('../ai-engine/performanceAnalyzer');
const { calculate_smart_schedule } = require('../ai-engine/scheduler');

const submitTest = async (req, res) => {
    const { topicId, totalQuestions, attempted, correct, wrong } = req.body;

    try {
        const { accuracy, classification } = analyzePerformance(correct, attempted);

        // Fetch Topic for complexity and priority
        const topic = await Topic.findById(topicId);
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        // Calculate Smart Spaced Repetition Schedule
        const schedule = calculate_smart_schedule(
            topic.difficulty,
            topic.priority,
            accuracy,
            topic.interval,
            topic.easeFactor
        );

        // Update Topic Interval, Ease Factor, & Next Review Date in DB
        topic.interval = schedule.days_until_next;
        topic.easeFactor = schedule.new_ease_factor;
        topic.nextReviewDate = schedule.next_revision_date;
        await topic.save();

        const testResult = await TestResult.create({
            userId: req.user.id,
            topicId,
            totalQuestions,
            attempted,
            correct,
            wrong,
            accuracy,
            timeTaken: req.body.timeTaken || 0,
        });

        res.status(201).json({
            testResult,
            classification,
            accuracy,
            schedule
        });
    } catch (error) {
        console.error('Error submitting test:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

module.exports = { submitTest };
