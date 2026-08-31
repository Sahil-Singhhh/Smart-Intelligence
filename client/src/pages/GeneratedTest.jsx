import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Brain, CheckCircle2, XCircle, Timer, ArrowRight, FileText, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const GeneratedTest = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryTopicId = searchParams.get('topicId');

    const [testData, setTestData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Test Taking State
    const [userAnswers, setUserAnswers] = useState({});
    const [startTime, setStartTime] = useState(null);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [results, setResults] = useState(null);

    useEffect(() => {
        // 1. Check if test data was passed directly from PDF upload state
        if (location.state?.pdfTestData) {
            setTestData(location.state.pdfTestData);
            setStartTime(Date.now());
            setLoading(false);
            return;
        }

        // 2. Otherwise fetch test data for topicId
        const fetchTest = async () => {
            try {
                const { data } = await api.get(`/ai/generate-test?topicId=${queryTopicId}`);
                setTestData(data);
                setStartTime(Date.now());
            } catch (error) {
                console.error('Failed to generate test', error);
            } finally {
                setLoading(false);
            }
        };

        if (queryTopicId) {
            fetchTest();
        } else {
            setLoading(false);
        }
    }, [queryTopicId, location.state]);

    // Timer Interval
    useEffect(() => {
        let interval;
        if (!submitted && startTime) {
            interval = setInterval(() => {
                setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [startTime, submitted]);

    const handleOptionSelect = (questionId, option) => {
        if (submitted) return;
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: option
        }));
    };

    const handleSubmit = async () => {
        if (!testData) return;

        const timeTaken = Math.floor((Date.now() - startTime) / 1000);

        let correctCount = 0;
        let wrongCount = 0;

        testData.questions.forEach(q => {
            if (userAnswers[q.id] === q.correctAnswer) {
                correctCount++;
            } else {
                wrongCount++;
            }
        });

        // UI Result calculation
        const resultData = {
            total: testData.questions.length,
            correct: correctCount,
            wrong: wrongCount,
            accuracy: Math.round((correctCount / testData.questions.length) * 100),
            timeTaken
        };

        setResults(resultData);
        setSubmitted(true);

        const targetTopicId = location.state?.topicId || queryTopicId || testData.meta?.topicId;

        if (targetTopicId) {
            try {
                await api.post('/tests/submit', {
                    topicId: targetTopicId,
                    totalQuestions: testData.questions.length,
                    attempted: testData.questions.length,
                    correct: correctCount,
                    wrong: wrongCount,
                    timeTaken: timeTaken
                });
            } catch (error) {
                console.error("Failed to submit test results to server", error);
            }
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-cyan-300 text-glow font-medium">Synthesizing AI Examination Matrix...</p>
                <p className="text-xs text-gray-500">Parsing questions, options & explanations...</p>
            </div>
        );
    }

    if (!testData) {
        return (
            <Card className="text-center py-12 space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                    <XCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">No Assessment Data Found</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">Please upload a PDF document or select a registered topic to start taking an AI test.</p>
                <Button onClick={() => navigate('/test')} className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600">
                    Upload PDF & Take Test
                </Button>
            </Card>
        );
    }

    const { meta, questions } = testData;

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            {/* Context Header */}
            <div className="flex flex-wrap items-center justify-between bg-black/50 backdrop-blur-md sticky top-4 z-10 p-4 rounded-2xl border border-white/10 shadow-xl gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-cyan-400 uppercase tracking-widest font-semibold">{meta.subject}</span>
                        {meta.sourcePdf && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-1 font-mono">
                                <FileText className="w-3 h-3" /> {meta.sourcePdf}
                            </span>
                        )}
                    </div>
                    <h1 className="text-xl font-bold text-white max-w-[320px] truncate">{meta.topic}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-cyan-300 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20">
                        <Timer className="w-4 h-4" />
                        <span className="font-mono font-medium">{formatTime(timeElapsed)}</span>
                    </div>
                </div>
            </div>

            {/* Questions Feed */}
            <div className="space-y-6">
                {questions.map((q, index) => {
                    const isSelected = userAnswers[q.id];
                    const isCorrect = isSelected === q.correctAnswer;
                    const showFeedback = submitted;

                    return (
                        <motion.div
                            key={q.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                        >
                            <Card className={`relative overflow-visible transition-all duration-300 ${showFeedback ? (isCorrect ? 'border-green-500/30 bg-green-900/10' : 'border-red-500/30 bg-red-900/10') : ''}`}>
                                <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-lg z-10">
                                    {index + 1}
                                </div>

                                <div className="mb-6 ml-2 mt-2">
                                    <h3 className="text-lg font-medium text-white leading-relaxed">
                                        {q.question}
                                    </h3>
                                </div>

                                {q.type === 'MCQ' && q.options && (
                                    <div className="grid grid-cols-1 gap-3 ml-2">
                                        {q.options.map((opt, i) => {
                                            const selected = userAnswers[q.id] === opt;
                                            let optionClass = "border-white/10 bg-white/5 hover:bg-white/10";

                                            if (showFeedback) {
                                                if (opt === q.correctAnswer) optionClass = "border-green-500 bg-green-500/20 text-green-200";
                                                else if (selected) optionClass = "border-red-500 bg-red-500/20 text-red-200";
                                                else optionClass = "opacity-50";
                                            } else {
                                                if (selected) optionClass = "border-cyan-500 bg-cyan-500/20 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]";
                                            }

                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => handleOptionSelect(q.id, opt)}
                                                    className={`p-4 rounded-xl border transition-all cursor-pointer text-gray-300 ${optionClass}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>{opt}</span>
                                                        {showFeedback && opt === q.correctAnswer && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                                                        {showFeedback && selected && opt !== q.correctAnswer && <XCircle className="w-5 h-5 text-red-400" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {showFeedback && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-4 ml-2 p-4 rounded-xl bg-black/40 border border-white/10 text-sm"
                                    >
                                        <p className="text-gray-400 italic">
                                            <span className="font-semibold text-cyan-400">Explanation: </span>
                                            {q.explanation || 'Based on core principles of the subject material.'}
                                        </p>
                                    </motion.div>
                                )}
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="sticky bottom-6 flex justify-center pt-4 z-20">
                {!submitted ? (
                    <Button
                        onClick={handleSubmit}
                        className="w-full max-w-md bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-lg py-4 shadow-xl shadow-cyan-900/30 border-none"
                        disabled={Object.keys(userAnswers).length < questions.length}
                    >
                        {Object.keys(userAnswers).length < questions.length
                            ? `Answer all questions (${Object.keys(userAnswers).length}/${questions.length})`
                            : 'Submit Assessment'}
                    </Button>
                ) : (
                    <div className="bg-black/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-2xl w-full max-w-lg text-center space-y-4">
                        <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                            <Sparkles className="w-6 h-6 text-cyan-400" />
                            Assessment Complete
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                                <p className="text-xs text-green-400 uppercase font-semibold">Score</p>
                                <p className="text-2xl font-bold text-white">{results.accuracy}%</p>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <p className="text-xs text-blue-400 uppercase font-semibold">Correct</p>
                                <p className="text-2xl font-bold text-white">{results.correct}/{results.total}</p>
                            </div>
                            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                <p className="text-xs text-purple-400 uppercase font-semibold">Time</p>
                                <p className="text-2xl font-bold text-white">{formatTime(results.timeTaken)}</p>
                            </div>
                        </div>
                        <Button onClick={() => navigate('/')} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600">
                            Return to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneratedTest;
