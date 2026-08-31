import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { UploadCloud, FileText, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Brain, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TakeTest = () => {
    const [mode, setMode] = useState('pdf'); // 'pdf' | 'topic' | 'manual'
    const [topics, setTopics] = useState([]);
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');

    // PDF Upload States
    const [pdfFile, setPdfFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [customSubject, setCustomSubject] = useState('');
    const [customTopicName, setCustomTopicName] = useState('');
    const [generating, setGenerating] = useState(false);
    const [aiProgressStatus, setAiProgressStatus] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Manual Log States
    const [totalQuestions, setTotalQuestions] = useState(10);
    const [correct, setCorrect] = useState(0);
    const [wrong, setWrong] = useState(0);

    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const { data } = await api.get('/topics');
                setTopics(data);
                if (data.length > 0) setSelectedTopicId(data[0]._id);
            } catch (error) {
                console.error('Failed to fetch topics', error);
            }
        };
        fetchTopics();
    }, []);

    // Handle PDF Selection
    const handleFileSelect = (file) => {
        setErrorMsg('');
        if (!file) return;
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            setErrorMsg('Please upload a valid PDF document (.pdf)');
            return;
        }
        if (file.size > 15 * 1024 * 1024) {
            setErrorMsg('PDF file size should be less than 15MB');
            return;
        }
        setPdfFile(file);
        
        // Auto-fill topic name from PDF filename if empty
        if (!customTopicName) {
            const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
            setCustomTopicName(cleanName);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    // Generate Test from PDF
    const handlePdfGenerate = async (e) => {
        e.preventDefault();
        if (!pdfFile) {
            setErrorMsg('Please select or drag a PDF file first.');
            return;
        }

        try {
            setGenerating(true);
            setErrorMsg('');
            setAiProgressStatus('Reading & Parsing PDF file...');

            const formData = new FormData();
            formData.append('pdfFile', pdfFile);
            if (selectedTopicId) formData.append('topicId', selectedTopicId);
            if (customTopicName) formData.append('topicName', customTopicName);
            if (customSubject) formData.append('subject', customSubject);
            formData.append('difficulty', difficulty);

            setTimeout(() => {
                setAiProgressStatus('Synthesizing core concepts with AI...');
            }, 1200);

            setTimeout(() => {
                setAiProgressStatus('Creating targeted MCQs & explanations...');
            }, 2500);

            const { data } = await api.post('/ai/generate-test-from-pdf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Navigate to Test viewer with generated test data
            navigate('/generate-test', { state: { pdfTestData: data, topicId: selectedTopicId } });
        } catch (error) {
            console.error('Failed to generate test from PDF', error);
            const msg = error.response?.data?.message || 'Failed to generate test from PDF file.';
            setErrorMsg(msg);
        } finally {
            setGenerating(false);
        }
    };

    // Generate Test from Registered Topic
    const handleTopicGenerate = (e) => {
        e.preventDefault();
        if (!selectedTopicId) {
            setErrorMsg('Please select a topic first.');
            return;
        }
        navigate(`/generate-test?topicId=${selectedTopicId}`);
    };

    // Submit Manual Score
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        const attempted = parseInt(correct) + parseInt(wrong);
        try {
            await api.post('/tests/submit', {
                topicId: selectedTopicId,
                totalQuestions: parseInt(totalQuestions),
                attempted,
                correct: parseInt(correct),
                wrong: parseInt(wrong),
            });
            navigate('/');
        } catch (error) {
            console.error('Failed to submit test', error);
            alert('Failed to submit test');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-white to-purple-400 text-glow">
                    Smart AI Test Hub
                </h1>
                <p className="text-gray-400 max-w-md mx-auto text-sm">
                    Upload your PDF study material to generate instant, tailored examination questions.
                </p>
            </div>

            {/* Mode Tabs */}
            <div className="flex justify-center p-1.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 max-w-xl mx-auto">
                <button
                    onClick={() => setMode('pdf')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        mode === 'pdf'
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/30'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>Upload PDF Test</span>
                </button>
                <button
                    onClick={() => setMode('topic')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        mode === 'topic'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <Brain className="w-4 h-4" />
                    <span>Registered Topic</span>
                </button>
                <button
                    onClick={() => setMode('manual')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        mode === 'manual'
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <ClipboardList className="w-4 h-4" />
                    <span>Log Manual Score</span>
                </button>
            </div>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                {mode === 'pdf' && (
                    <motion.div
                        key="pdf-mode"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card>
                            <div className="mb-6 border-b border-white/10 pb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                                    Generate Assessment from PDF Notes
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    Upload your textbook chapter, handwritten notes PDF, or syllabus. AI will synthesize customized test questions from your PDF.
                                </p>
                            </div>

                            {errorMsg && (
                                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-sm">
                                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                    <p>{errorMsg}</p>
                                </div>
                            )}

                            <form onSubmit={handlePdfGenerate} className="space-y-6">
                                {/* PDF Drag & Drop Zone */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`relative p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
                                        isDragging
                                            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                                            : pdfFile
                                            ? 'border-green-500/50 bg-green-900/10'
                                            : 'border-white/20 bg-black/20 hover:border-cyan-500/50 hover:bg-white/5'
                                    }`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept=".pdf,application/pdf"
                                        className="hidden"
                                        onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                                    />

                                    {pdfFile ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400">
                                                <FileText className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold text-base">{pdfFile.name}</p>
                                                <p className="text-xs text-green-400 font-mono mt-0.5">
                                                    {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Ready
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPdfFile(null);
                                                }}
                                                className="text-xs text-gray-400 hover:text-red-400 underline mt-2"
                                            >
                                                Change / Remove File
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                                <UploadCloud className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">
                                                    Drag & drop your PDF file here, or <span className="text-cyan-400 underline">Browse</span>
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">Supports PDF notes, syllabus, or lecture slides (Up to 15MB)</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Subject & Topic Metadata */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                                            Link to Existing Topic (Optional)
                                        </label>
                                        <select
                                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 [&>option]:bg-slate-900"
                                            value={selectedTopicId}
                                            onChange={(e) => {
                                                setSelectedTopicId(e.target.value);
                                                const found = topics.find(t => t._id === e.target.value);
                                                if (found) {
                                                    setCustomTopicName(found.topicName);
                                                    setCustomSubject(found.subject);
                                                }
                                            }}
                                        >
                                            <option value="">-- No Topic Link (Standalone PDF) --</option>
                                            {topics.map((t) => (
                                                <option key={t._id} value={t._id}>{t.topicName} ({t.subject})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                                            Complexity Level
                                        </label>
                                        <select
                                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 [&>option]:bg-slate-900"
                                            value={difficulty}
                                            onChange={(e) => setDifficulty(e.target.value)}
                                        >
                                            <option>Easy</option>
                                            <option>Medium</option>
                                            <option>Hard</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                                            Subject Domain
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                                            placeholder="e.g. Physics / Data Structures"
                                            value={customSubject}
                                            onChange={(e) => setCustomSubject(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                                            Topic / Module Name
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                                            placeholder="e.g. Quantum Mechanics / Array Algorithms"
                                            value={customTopicName}
                                            onChange={(e) => setCustomTopicName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Loading state notification */}
                                {generating && (
                                    <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between animate-pulse">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                            <p className="text-sm font-medium text-cyan-300">{aiProgressStatus || 'Processing PDF with AI...'}</p>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={generating || !pdfFile}
                                    className="w-full py-4 text-base bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-none shadow-xl shadow-cyan-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    {generating ? 'Processing PDF & Generating Test...' : 'Generate AI Test from PDF'}
                                </Button>
                            </form>
                        </Card>
                    </motion.div>
                )}

                {mode === 'topic' && (
                    <motion.div
                        key="topic-mode"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card>
                            <div className="mb-6 border-b border-white/10 pb-4">
                                <h3 className="text-xl font-bold text-white">Generate Test from Registered Topic</h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    Use key points stored in your revision database to launch an AI evaluation test.
                                </p>
                            </div>

                            <form onSubmit={handleTopicGenerate} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wider">
                                        Select Registered Topic
                                    </label>
                                    <select
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 [&>option]:bg-slate-900"
                                        value={selectedTopicId}
                                        onChange={(e) => setSelectedTopicId(e.target.value)}
                                    >
                                        {topics.map((t) => (
                                            <option key={t._id} value={t._id}>{t.topicName} ({t.subject})</option>
                                        ))}
                                    </select>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={!selectedTopicId}
                                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-none flex items-center justify-center gap-2"
                                >
                                    <span>Launch AI Test</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </form>
                        </Card>
                    </motion.div>
                )}

                {mode === 'manual' && (
                    <motion.div
                        key="manual-mode"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card>
                            <div className="mb-6 border-b border-white/10 pb-4">
                                <h3 className="text-xl font-bold text-white">Log External Test Results</h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    Manually log scores from an external test to update your spaced repetition algorithm.
                                </p>
                            </div>

                            <form onSubmit={handleManualSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wider">Select Topic</label>
                                    <select
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 [&>option]:bg-slate-900"
                                        value={selectedTopicId}
                                        onChange={(e) => setSelectedTopicId(e.target.value)}
                                    >
                                        {topics.map((t) => (
                                            <option key={t._id} value={t._id}>{t.topicName} ({t.subject})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wider">Total Questions</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                                        value={totalQuestions}
                                        onChange={(e) => setTotalQuestions(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium text-green-400 mb-2 uppercase tracking-wider">Correct Answers</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500"
                                            value={correct}
                                            onChange={(e) => setCorrect(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-red-400 mb-2 uppercase tracking-wider">Wrong Answers</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500"
                                            value={wrong}
                                            onChange={(e) => setWrong(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 border-none">
                                    Submit Score & Calibrate Algorithm
                                </Button>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TakeTest;
