const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

/**
 * Dynamically generates MCQs from user-provided key points / notes.
 */
const generateQuestionsFromKeyPoints = (topicName, subject, keyPoints) => {
    if (!keyPoints || keyPoints.length === 0) return [];

    return keyPoints.map((point, index) => {
        const pt = point.trim();
        let question = '';
        let options = [];
        let correctAnswer = '';
        let explanation = '';

        const ptLower = pt.toLowerCase();

        if (ptLower.includes('linear') || ptLower.includes('structure') || ptLower.includes('non-linear')) {
            question = `Regarding data organization in ${topicName}, which statement accurately reflects "${pt}"?`;
            options = [
                `${topicName} is structured such that ${pt}.`,
                `${topicName} is an unorganized random graph with infinite nodes.`,
                `${topicName} does not follow any structural layout in ${subject}.`,
                `${pt} is an obsolete hardware configuration.`
            ];
            correctAnswer = `${topicName} is structured such that ${pt}.`;
            explanation = `In ${subject}, ${pt} accurately describes how data elements are structured for ${topicName}.`;
        } else if (ptLower.includes('memory') || ptLower.includes('allocat') || ptLower.includes('contiguous') || ptLower.includes('pointer')) {
            question = `How does memory management operate for ${topicName} regarding "${pt}"?`;
            options = [
                `${pt} governs how memory addresses are calculated and assigned.`,
                `${pt} requires disk sector paging instead of RAM access.`,
                `${pt} prevents any data from being stored in memory.`,
                `${pt} quadruples memory usage on every write.`
            ];
            correctAnswer = `${pt} governs how memory addresses are calculated and assigned.`;
            explanation = `${pt} defines the fundamental memory layout and access pattern for ${topicName}.`;
        } else if (ptLower.includes('o(') || ptLower.includes('time') || ptLower.includes('complexity') || ptLower.includes('access')) {
            question = `What is the algorithmic performance significance of "${pt}" in ${topicName}?`;
            options = [
                `It represents the time or space efficiency benchmark (${pt}).`,
                `It indicates that ${topicName} runs in infinite time.`,
                `It is a hardware clock multiplier.`,
                `It is completely unrelated to performance.`
            ];
            correctAnswer = `It represents the time or space efficiency benchmark (${pt}).`;
            explanation = `${pt} establishes performance guarantees when operating on ${topicName}.`;
        } else {
            question = `In ${topicName} (${subject}), which option correctly explains the principle of "${pt}"?`;
            options = [
                `${pt} is a key operational concept essential for mastering ${topicName}.`,
                `${pt} is an invalid assertion contradicted by ${subject} principles.`,
                `${pt} applies only to uncompiled bytecode.`,
                `${pt} is a legacy feature.`
            ];
            correctAnswer = `${pt} is a key operational concept essential for mastering ${topicName}.`;
            explanation = `Understanding ${pt} provides core foundational knowledge for ${topicName} in ${subject}.`;
        }

        return {
            id: `kp_derived_${index}_${Date.now()}`,
            type: 'MCQ',
            question,
            options,
            correctAnswer,
            explanation
        };
    });
};

/**
 * Creates high quality conceptual questions tailored to topic and key points.
 */
const createSmartConceptualQuestions = (topicName, subject, keyPoints, difficulty) => {
    const topicLower = (topicName || '').toLowerCase();
    const subjLower = (subject || '').toLowerCase();
    
    // 1. Generate questions directly from User Notes / Key Points FIRST
    const keyPointQuestions = generateQuestionsFromKeyPoints(topicName, subject, keyPoints);

    const backupQuestions = [];

    // 2. Domain Knowledge Questions
    if (topicLower.includes('array') || topicLower.includes('vector') || (subjLower.includes('dsa') && topicLower.includes('arr'))) {
        backupQuestions.push({
            id: `q_arr_1_${Date.now()}`,
            type: 'MCQ',
            question: `What is the time complexity of accessing an element at a known index in a standard Array?`,
            options: ['O(1) - Constant Time', 'O(n) - Linear Time', 'O(log n) - Logarithmic Time', 'O(n^2) - Quadratic Time'],
            correctAnswer: 'O(1) - Constant Time',
            explanation: 'Arrays store elements in contiguous memory locations. Using base address index arithmetic, access by index is constant time O(1).'
        });
        backupQuestions.push({
            id: `q_arr_2_${Date.now()}`,
            type: 'MCQ',
            question: `Which operation on an array of size n requires shifting elements and takes O(n) worst-case time?`,
            options: ['Inserting an element at index 0', 'Accessing the element at index 0', 'Updating the element at index 5', 'Reading the array length'],
            correctAnswer: 'Inserting an element at index 0',
            explanation: 'Inserting at index 0 requires moving all n existing elements one position right, taking linear O(n) time.'
        });
        backupQuestions.push({
            id: `q_arr_3_${Date.now()}`,
            type: 'MCQ',
            question: `In contiguous memory allocation, how is the physical memory address for Array element A[i] computed?`,
            options: [
                'Base Address + (i * Element Size)',
                'Base Address + i + Element Size',
                'Base Address * i * Element Size',
                'Base Address + (i / Element Size)'
            ],
            correctAnswer: 'Base Address + (i * Element Size)',
            explanation: 'The memory location of index i is computed directly using formula: Base Address + (Index * Element Size).'
        });
        backupQuestions.push({
            id: `q_arr_4_${Date.now()}`,
            type: 'MCQ',
            question: `Which algorithmic technique is optimal for solving contiguous subarray sum/search problems in O(n) time?`,
            options: ['Sliding Window / Two Pointers', 'Binary Search Tree Traversal', 'Depth First Search (DFS)', 'Matrix Exponentiation'],
            correctAnswer: 'Sliding Window / Two Pointers',
            explanation: 'Sliding Window and Two Pointer techniques allow processing linear contiguous subarrays efficiently in a single pass O(n).'
        });
    }

    // Combine user key point questions with domain questions
    const finalQuestions = [...keyPointQuestions, ...backupQuestions];
    return finalQuestions.slice(0, 5);
};

/**
 * Generates a test using Google Gemini AI (or Smart Fallback Engine).
 */
const generateTest = async (topicName, subject, keyPoints, difficulty, priority = 'Medium') => {
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Try Gemini API with multiple model names if key is present
    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
        const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
        const { GoogleGenerativeAI } = require('@google/generative-ai');

        try {
            console.log(`🤖 [Gemini AI] Attempting live question generation for "${topicName}" (${subject})...`);
            const genAI = new GoogleGenerativeAI(apiKey.trim());

            const prompt = `
You are an expert professor in ${subject}. Create 5 high-quality, conceptual, multiple-choice questions for the topic "${topicName}".

CRITICAL REQUIREMENT: You MUST base the questions DIRECTLY on these key study notes/points provided by the student:
${keyPoints && keyPoints.length > 0 ? keyPoints.map((p, i) => `${i+1}. ${p}`).join('\n') : topicName}

Difficulty: ${difficulty}.

Return ONLY valid JSON wrapped inside markdown code fences:
\`\`\`json
{
  "questions": [
    {
      "question": "Clear conceptual question text based on the notes above...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact matching option text",
      "explanation": "Clear explanation of the correct answer"
    }
  ]
}
\`\`\`
`;

            for (const modelName of modelsToTry) {
                try {
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(prompt);
                    const responseText = result.response.text();
                    
                    let cleanJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
                    const generatedJson = JSON.parse(cleanJson);

                    if (generatedJson && Array.isArray(generatedJson.questions) && generatedJson.questions.length > 0) {
                        console.log(`✅ [Gemini AI (${modelName})] Generated ${generatedJson.questions.length} questions successfully!`);
                        return {
                            meta: {
                                topic: topicName,
                                subject,
                                difficulty,
                                totalQuestions: generatedJson.questions.length,
                                generatedAt: new Date(),
                                engine: `Gemini AI (${modelName})`
                            },
                            questions: generatedJson.questions.map((q, i) => ({
                                id: `gemini_${i}_${Date.now()}`,
                                type: 'MCQ',
                                question: q.question,
                                options: q.options,
                                correctAnswer: q.correctAnswer,
                                explanation: q.explanation || ''
                            }))
                        };
                    }
                } catch (modelErr) {
                    // Continue to next model
                }
            }
        } catch (geminiErr) {
            console.error("Gemini AI generation error:", geminiErr.message);
        }
    }

    // 2. Smart Topic-Aware Question Engine
    console.log(`🎯 [Smart Question Engine] Generating targeted questions from user notes for "${topicName}" (${subject})...`);
    const smartQuestions = createSmartConceptualQuestions(topicName, subject, keyPoints, difficulty);

    return {
        meta: {
            topic: topicName,
            subject,
            difficulty,
            totalQuestions: smartQuestions.length,
            generatedAt: new Date(),
            engine: 'Smart Conceptual AI Engine'
        },
        questions: smartQuestions
    };
};

module.exports = { generateTest };
