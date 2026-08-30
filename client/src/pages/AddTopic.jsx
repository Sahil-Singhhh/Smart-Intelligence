import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Sparkles, CheckCircle2 } from 'lucide-react';

const AddTopic = () => {
    const [subject, setSubject] = useState('');
    const [topicName, setTopicName] = useState('');
    const [keyPoints, setKeyPoints] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [priority, setPriority] = useState('Medium');
    const [loading, setLoading] = useState(false);
    const [aiStatus, setAiStatus] = useState('');
    const [userModifiedNotes, setUserModifiedNotes] = useState(false);

    const navigate = useNavigate();
    const isAutoGenerating = useRef(false);

    const fetchSuggestions = async (subj, topic, isManual = false) => {
        if (!subj || !topic) {
            if (isManual) setAiStatus('Please enter Subject and Topic Name first.');
            return;
        }

        try {
            setLoading(true);
            setAiStatus('Synthesizing AI concepts...');
            const { data } = await api.get(`/ai/suggest-concepts?subject=${encodeURIComponent(subj)}&topic=${encodeURIComponent(topic)}`);

            if (data.suggestions && data.suggestions.length > 0) {
                const suggestedText = data.suggestions.join(', ');
                if (isManual || !keyPoints || !userModifiedNotes) {
                    setKeyPoints(suggestedText);
                }
                const engineName = data.engine || 'AI Engine';
                setAiStatus(`Auto-generated concepts via ${engineName}`);
            } else {
                setAiStatus('No specific suggestions found.');
            }
        } catch (error) {
            console.error('Suggestion error:', error);
            setAiStatus('Could not auto-generate concepts. Please type manually.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate concepts when subject and topicName are typed
    useEffect(() => {
        if (!subject.trim() || !topicName.trim() || userModifiedNotes) return;

        const timer = setTimeout(() => {
            fetchSuggestions(subject.trim(), topicName.trim(), false);
        }, 700);

        return () => clearTimeout(timer);
    }, [subject, topicName]);

    const handleManualSuggest = () => {
        fetchSuggestions(subject.trim(), topicName.trim(), true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const pointsArray = keyPoints.split(/[,\n]+/).map(p => p.trim()).filter(p => p);

            await api.post('/topics/add', {
                subject,
                topicName,
                difficulty,
                priority,
                keyPoints: pointsArray
            });
            navigate('/');
        } catch (error) {
            console.error('Failed to add topic', error);
            const msg = error.response?.data?.message || 'Failed to add topic';
            setAiStatus(`Error: ${msg}`);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <div className="mb-6 border-b border-white/10 pb-4">
                    <h3 className="text-2xl font-bold text-white text-glow">Add New Module</h3>
                    <p className="text-gray-400">Register a new topic for AI analysis & automated revision tests.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Subject Domain</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                                placeholder="e.g. Physics / Data Structures"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Topic Identifier</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                                placeholder="e.g. Quantum Mechanics / Binary Trees"
                                value={topicName}
                                onChange={(e) => setTopicName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-300">Key Concepts / Notes</label>
                            <button
                                type="button"
                                onClick={handleManualSuggest}
                                disabled={loading}
                                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center transition-colors disabled:opacity-50 font-medium"
                            >
                                <Sparkles className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'Synthesizing...' : 'Regenerate AI Concepts'}
                            </button>
                        </div>
                        <textarea
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 h-32 resize-none text-sm leading-relaxed"
                            placeholder="Type topic & subject above to auto-generate key concepts, or enter them here..."
                            value={keyPoints}
                            onChange={(e) => {
                                setKeyPoints(e.target.value);
                                setUserModifiedNotes(true);
                            }}
                        />
                        {aiStatus && (
                            <p className="text-xs text-cyan-400 mt-1.5 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                {aiStatus}
                            </p>
                        )}
                        {!aiStatus && (
                            <p className="text-xs text-gray-500 mt-1">AI will use these key points to generate custom test questions.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Complexity Level</label>
                            <select
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 [&>option]:bg-slate-900"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                            >
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Priority Status</label>
                            <select
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 [&>option]:bg-slate-900"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full">
                            Register Module
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default AddTopic;
