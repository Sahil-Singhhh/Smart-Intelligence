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

        if (index % 4 === 0) {
            question = `In the context of ${topicName}, which of the following statements is TRUE regarding "${pt}"?`;
            correctAnswer = `${pt} represents a fundamental concept or mechanism in ${topicName}.`;
            options = [
                correctAnswer,
                `${pt} is an unsupported theory with no practical application in ${subject}.`,
                `${pt} is strictly prohibited under standard protocols for ${topicName}.`,
                `${pt} has been completely superseded and deprecated.`
            ];
            explanation = `In ${subject}, "${pt}" forms a core working principle and operational standard for ${topicName}.`;
        } else if (index % 4 === 1) {
            question = `How does "${pt}" contribute to the core objectives of ${topicName} in ${subject}?`;
            correctAnswer = `It facilitates the primary process or criteria defined by: ${pt}.`;
            options = [
                `It completely reverses the desired outcome of ${topicName}.`,
                correctAnswer,
                `It serves only as an unverified experimental footnote.`,
                `It causes excessive systemic failure and degradation.`
            ];
            explanation = `Mastery of ${topicName} relies on understanding how ${pt} enables foundational operations and workflows.`;
        } else if (index % 4 === 2) {
            question = `Which option represents the most accurate evaluation of "${pt}" for ${topicName}?`;
            correctAnswer = `It is a verified principle: ${pt}.`;
            options = [
                `It is universally invalid across all ${subject} domains.`,
                `It only applies in hypothetical, non-physical simulations.`,
                correctAnswer,
                `It doubles error rates and increases operational risk.`
            ];
            explanation = `Understanding that "${pt}" is an essential technical benchmark in ${subject} is vital for assessments.`;
        } else {
            question = `When analyzing ${topicName} (${subject}), what is the primary significance of: "${pt}"?`;
            correctAnswer = `It establishes critical criteria and methodologies (${pt}).`;
            options = [
                correctAnswer,
                `It is an extraneous detail with zero diagnostic value.`,
                `It contradicts standard laws and observations in ${subject}.`,
                `It is purely a naming convention with no functional effect.`
            ];
            explanation = `"${pt}" is directly cited as an essential component of ${topicName} theory and practice.`;
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
        const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
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

/**
 * Generates a test directly from extracted PDF document text.
 */
const generateTestFromPdfText = async (pdfText, topicName = 'PDF Document Notes', subject = 'General Studies', difficulty = 'Medium', fileName = 'Document.pdf') => {
    const apiKey = process.env.GEMINI_API_KEY;
    const truncatedText = (pdfText || '').substring(0, 10000); // Pass first 10,000 chars for deep context

    // 1. Try Gemini AI with the uploaded PDF content
    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
        const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
        const { GoogleGenerativeAI } = require('@google/generative-ai');

        try {
            console.log(`📄 [PDF AI Engine] Generating test from PDF file "${fileName}"...`);
            const genAI = new GoogleGenerativeAI(apiKey.trim());

            const prompt = `
You are an expert professor and assessment generator. Below is the text content extracted directly from the student's uploaded PDF document "${fileName}":

---
${truncatedText}
---

CRITICAL INSTRUCTIONS:
1. Create 5 to 7 high-quality, conceptual, multiple-choice questions (MCQs) strictly based on the provided PDF text content above.
2. Subject: ${subject}, Topic: ${topicName}, Difficulty: ${difficulty}.
3. Each question MUST have 4 clear options, 1 correct answer (exact string match with one of options), and a detailed explanation referencing the PDF content.

Return ONLY valid JSON wrapped inside markdown code fences:
\`\`\`json
{
  "questions": [
    {
      "question": "Question text directly derived from PDF content...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact matching option text",
      "explanation": "Clear explanation referencing facts from the PDF"
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
                        console.log(`✅ [PDF Gemini AI (${modelName})] Successfully generated ${generatedJson.questions.length} questions from PDF!`);
                        return {
                            meta: {
                                topic: topicName,
                                subject,
                                difficulty,
                                sourcePdf: fileName,
                                totalQuestions: generatedJson.questions.length,
                                generatedAt: new Date(),
                                engine: `PDF Gemini AI (${modelName})`
                            },
                            questions: generatedJson.questions.map((q, i) => ({
                                id: `pdf_gemini_${i}_${Date.now()}`,
                                type: 'MCQ',
                                question: q.question,
                                options: q.options,
                                correctAnswer: q.correctAnswer,
                                explanation: q.explanation || ''
                            }))
                        };
                    }
                } catch (modelErr) {
                    console.warn(`PDF Gemini model ${modelName} failed:`, modelErr.message);
                }
            }
        } catch (geminiErr) {
            console.error("PDF Gemini AI generation error:", geminiErr.message);
        }
    }

    // 2. Fallback: Parse PDF text into key sentences & generate questions
    console.log(`🎯 [PDF Smart Engine] Using Smart Parser fallback for PDF "${fileName}"...`);
    const keyLines = (pdfText || '')
        .split(/[\r\n.!?]+/)
        .map(l => l.trim())
        .filter(l => l.length > 20 && l.length < 150)
        .slice(0, 10);

    const smartQuestions = createSmartConceptualQuestions(
        topicName,
        subject,
        keyLines.length > 0 ? keyLines : [`Core principles of ${topicName} from ${fileName}`],
        difficulty
    );

    return {
        meta: {
            topic: topicName,
            subject,
            difficulty,
            sourcePdf: fileName,
            totalQuestions: smartQuestions.length,
            generatedAt: new Date(),
            engine: 'PDF Smart Conceptual AI Engine'
        },
        questions: smartQuestions
    };
};

module.exports = { generateTest, generateTestFromPdfText };

