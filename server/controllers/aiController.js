const Topic = require('../models/Topic');
const TestResult = require('../models/TestResult');
const { analyzePerformance } = require('../ai-engine/performanceAnalyzer');
const { generateRevisionPlan } = require('../ai-engine/revisionPlanner');
const { suggestNextTest } = require('../ai-engine/testScheduler');
const { generateTest } = require('../ai-engine/testGenerator');

const getGeneratedTest = async (req, res) => {
    try {
        const { topicId } = req.query;
        if (!topicId) {
            return res.status(400).json({ message: 'Topic ID required' });
        }

        const topic = await Topic.findById(topicId);
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        // Ensure user owns topic
        if (topic.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const testData = await generateTest(
            topic.topicName,
            topic.subject,
            topic.keyPoints,
            topic.difficulty,
            topic.priority
        );

        res.json(testData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const suggestConcepts = async (req, res) => {
    const { subject, topic } = req.query;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
        const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
        const { GoogleGenerativeAI } = require('@google/generative-ai');

        try {
            const genAI = new GoogleGenerativeAI(apiKey.trim());
            const prompt = `
Generate 6 to 8 core key concepts, important formulas, or fundamental principles for the topic "${topic}" in the subject "${subject || 'General Studies'}".

Return ONLY valid JSON wrapped in markdown code fences:
\`\`\`json
{
  "suggestions": [
    "Concept 1",
    "Concept 2"
  ]
}
\`\`\`
`;

            for (const modelName of modelsToTry) {
                try {
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(prompt);
                    const text = result.response.text();
                    let cleanText = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
                    const parsed = JSON.parse(cleanText);
                    if (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
                        return res.json({ suggestions: parsed.suggestions, engine: `Gemini AI (${modelName})` });
                    }
                } catch (modelErr) {
                    // Try next model
                }
            }
        } catch (err) {
            console.error('Gemini suggestConcepts error:', err.message);
        }
    }

    // Smart Domain-Specific Concept Engine Fallback
    const topicLower = (topic || '').toLowerCase();
    const subjLower = (subject || '').toLowerCase();

    let suggestions = [];

    // Array / Vectors
    if (topicLower.includes('array') || topicLower.includes('vector') || (subjLower.includes('dsa') && topicLower.includes('arr'))) {
        suggestions = [
            'Contiguous Memory Allocation & Indexing Arithmetic',
            'Time Complexity: O(1) Access vs O(n) Insertion',
            'Static Arrays vs Dynamic Arrays (ArrayList / Vector)',
            'Multi-Dimensional Arrays & Matrix Traversal',
            'Two Pointer Technique (Left/Right & Slow/Fast)',
            'Sliding Window Algorithm for Subarrays',
            'Prefix Sum & Difference Arrays',
            'Array Bounds, Overflow & Out-Of-Bounds Exceptions'
        ];
    }
    // Linked Lists
    else if (topicLower.includes('link') || topicLower.includes('list')) {
        suggestions = [
            'Singly, Doubly & Circular Linked List Architectures',
            'Node Structure: Data Payload & Pointer References',
            'Insertion & Deletion at Head, Tail & Arbitrary Index',
            "Floyd's Cycle Finding Algorithm (Tortoise and Hare)",
            'Reversing a Linked List (Iterative & Recursive)',
            'Time & Space Complexity vs Contiguous Arrays',
            'LRU Cache Implementation using Doubly Linked List'
        ];
    }
    // Stacks & Queues
    else if (topicLower.includes('stack') || topicLower.includes('queue')) {
        suggestions = [
            'LIFO (Last In First Out) vs FIFO (First In First Out) Principles',
            'Push, Pop, Peek, Enqueue, and Dequeue Operations',
            'Array & Linked List Implementations',
            'Monotonic Stack & Monotonic Queue Techniques',
            'Infix, Prefix, and Postfix Expression Conversion',
            'Call Stack, Recursion Frames & Buffer Underflow/Overflow'
        ];
    }
    // Trees & Binary Search Trees
    else if (topicLower.includes('tree') || topicLower.includes('bst') || topicLower.includes('graph')) {
        suggestions = [
            'Tree Hierarchy: Root, Parent, Child, Leaf & Height',
            'Binary Search Tree (BST) Properties & Search Invariants',
            'Tree Traversals: Inorder, Preorder, Postorder & Level-Order (BFS)',
            'Depth-First Search (DFS) & Backtracking',
            'Balanced Trees: AVL Trees & Red-Black Trees',
            'Heap / Priority Queue & Heapify Operations'
        ];
    }
    // React / Web Dev
    else if (topicLower.includes('react') || topicLower.includes('js') || topicLower.includes('web')) {
        suggestions = [
            'JSX Syntax & Component Hierarchy',
            'State Management with useState & Redux / Context',
            'Side Effects & Lifecycle Management with useEffect',
            'Virtual DOM & Reconciliation Diffing Algorithm',
            'Props Drilling vs Context API Provider Pattern',
            'Performance Optimization: useMemo, useCallback, React.memo'
        ];
    }
    // General Fallback tailored to topic
    else {
        suggestions = [
            `${topic} Core Definition & Fundamental Concepts`,
            `Key Mathematical & Theoretical Properties of ${topic}`,
            `Practical Real-World Applications of ${topic} in ${subject || 'its domain'}`,
            `${topic} Essential Formulas, Syntax, or Rules`,
            `Performance, Complexity & Optimization in ${topic}`,
            `Advanced Variations & Sub-topics of ${topic}`,
            `Common Pitfalls, Edge Cases & Debugging ${topic}`
        ];
    }

    res.json({ suggestions, engine: 'Smart Concept Engine' });
};



const getRevisionPlan = async (req, res) => {
    try {
        const tests = await TestResult.find({ userId: req.user.id });
        const topics = await Topic.find({ userId: req.user.id });

        const detailedPlan = topics.map(topic => {
            // Get tests for this specific topic
            const topicTests = tests.filter(t => t.topicId.toString() === topic._id.toString());

            let correct = 0;
            let attempted = 0;

            topicTests.forEach(t => {
                correct += t.correct;
                attempted += t.attempted;
            });

            // Analyze performance for this specific topic
            const analysis = analyzePerformance(correct, attempted);

            // Generate plan based on this topic's performance
            const plan = generateRevisionPlan(analysis.classification, topic.topicName);
            const nextTestDays = suggestNextTest(analysis.classification);

            // Calculate next test date
            // FIX: Use the stored nextReviewDate if available, otherwise calculate default
            const nextTestDate = topic.nextReviewDate ? new Date(topic.nextReviewDate) : new Date();
            if (!topic.nextReviewDate) {
                nextTestDate.setDate(nextTestDate.getDate() + nextTestDays);
            }

            return {
                _id: topic._id,
                topic: topic.topicName,
                subject: topic.subject,
                classification: analysis.classification, // Weak, Medium, Strong
                strategy: plan.strategy,
                nextTestDate: nextTestDate
            };
        });

        res.json(detailedPlan);
    } catch (error) {
        console.error('Error in getRevisionPlan:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const getDailyDirection = async (req, res) => {
    try {
        const tests = await TestResult.find({ userId: req.user.id });
        const topics = await Topic.find({ userId: req.user.id });

        let weakCount = 0;
        let mediumCount = 0;
        let strongCount = 0;
        let recommendedTopic = null;

        // Calculate stats for all topics
        for (const topic of topics) {
            const topicTests = tests.filter(t => t.topicId.toString() === topic._id.toString());
            let correct = 0;
            let attempted = 0;

            topicTests.forEach(t => {
                correct += t.correct;
                attempted += t.attempted;
            });

            const { classification } = analyzePerformance(correct, attempted);

            if (classification === 'Weak') {
                weakCount++;
                if (!recommendedTopic) recommendedTopic = topic.topicName;
            } else if (classification === 'Medium') {
                mediumCount++;
            } else {
                strongCount++;
            }
        }

        let message = "Focus on adding more topics to build your revision plan.";

        if (topics.length === 0) {
            message = "Welcome! specific Start by adding a new topic to generate your personal AI revision plan.";
        } else if (weakCount > 0) {
            message = `Priority Focus: Review ${recommendedTopic} today to strengthen your weak areas.`;
        } else if (mediumCount > 0) {
            const medTopic = topics.find(t => {
                // re-calc to find a medium one
                const topicTests = tests.filter(test => test.topicId.toString() === t._id.toString());
                const stats = topicTests.reduce((acc, curr) => ({ c: acc.c + curr.correct, a: acc.a + curr.attempted }), { c: 0, a: 0 });
                return analyzePerformance(stats.c, stats.a).classification === 'Medium';
            });
            message = `Steady Progress: Continue practicing ${medTopic ? medTopic.topicName : 'your topics'} to reach mastery.`;
        } else if (strongCount > 0) {
            message = `You're doing great! Maintain your streak with a quick review of ${topics[0].topicName}.`;
        } else {
            // Default for new topics with no tests yet (defaults to Weak in analyzer usually, but if 0 attempted...)
            message = `Start taking tests to calibrate your AI study plan.`;
        }

        res.json({ message });
    } catch (error) {
        console.error("Error getting daily direction:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getRevisionPlan, getDailyDirection, getGeneratedTest, suggestConcepts };
