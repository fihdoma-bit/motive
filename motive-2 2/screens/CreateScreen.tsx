import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import type { Motive, User } from '../types';
import { MotivePrivacy } from '../types';
import { CATEGORIES } from '../constants';
import { generateMotiveSuggestion } from '../services/geminiService';

interface CreateScreenProps {
    addMotive: (motive: Omit<Motive, 'id' | 'created_by' | 'participants' | 'chat'>) => void;
    currentUser: User;
    userBudget: number;
}

export const CreateScreen: React.FC<CreateScreenProps> = ({ addMotive, currentUser, userBudget }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [location, setLocation] = useState('');
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
    const [time, setTime] = useState('19:00');
    const [cost, setCost] = useState(0);
    const [maxParticipants, setMaxParticipants] = useState(10);
    const [privacy, setPrivacy] = useState<MotivePrivacy>(MotivePrivacy.FRIENDS_ONLY);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const handleGenerateSuggestion = async () => {
        setIsGenerating(true);
        const suggestion = await generateMotiveSuggestion(currentUser.interests, userBudget);
        if (suggestion) {
            setTitle(suggestion.title || '');
            setDescription(suggestion.description || '');
            setCategory(suggestion.category || CATEGORIES[0]);
            setLocation(suggestion.location || '');
            setCost(suggestion.cost || 0);
        } else {
            alert("Could not generate a suggestion. Please try again.");
        }
        setIsGenerating(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newMotive = {
            title,
            description,
            category,
            location,
            date: new Date(`${date}T${time}`).toISOString(),
            cost: Number(cost),
            max_participants: Number(maxParticipants),
            privacy,
            image_url: `https://picsum.photos/seed/${title.replace(/\s/g, '')}/600/400`,
        };
        addMotive(newMotive);
        setTitle('');
        setDescription('');
        setLocation('');
        setCost(0);
    };

    const InputField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {children}
        </div>
    );
    
    const baseInputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500";

    return (
        <div className="flex flex-col h-full">
            <Header title="Create a Motive" />
            <div className="flex-1 overflow-y-auto p-4 pb-24">
                <div className="max-w-md mx-auto space-y-4">
                    <button
                        onClick={handleGenerateSuggestion}
                        disabled={isGenerating}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white font-semibold rounded-lg shadow-md bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-600 hover:to-violet-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                    >
                        <Icon name="sparkles" className="w-5 h-5" />
                        {isGenerating ? 'Generating...' : 'Get AI Suggestion'}
                    </button>
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-gray-100 px-2 text-sm text-gray-500">or create manually</span>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <InputField label="Title">
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className={baseInputClasses} placeholder="e.g., 5-a-side Football ⚽"/>
                        </InputField>
                        <InputField label="Description">
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} required className={baseInputClasses} placeholder="Tell everyone about your motive..."/>
                        </InputField>
                         <InputField label="Category">
                            <select value={category} onChange={e => setCategory(e.target.value)} required className={baseInputClasses}>
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </InputField>
                        <InputField label="Location">
                            <input type="text" value={location} onChange={e => setLocation(e.target.value)} required className={baseInputClasses} placeholder="e.g., Powerleague, Shoreditch"/>
                        </InputField>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Date">
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={baseInputClasses}/>
                            </InputField>
                             <InputField label="Time">
                                <input type="time" value={time} onChange={e => setTime(e.target.value)} required className={baseInputClasses}/>
                            </InputField>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <InputField label="Cost per person (£)">
                                <input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} required min="0" className={baseInputClasses}/>
                            </InputField>
                             <InputField label="Max Participants">
                                <input type="number" value={maxParticipants} onChange={e => setMaxParticipants(Number(e.target.value))} required min="2" className={baseInputClasses}/>
                            </InputField>
                        </div>
                        <InputField label="Privacy">
                            <div className="flex space-x-2">
                                {Object.values(MotivePrivacy).map(p => (
                                    <button
                                        type="button"
                                        key={p}
                                        onClick={() => setPrivacy(p)}
                                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${privacy === p ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </InputField>
                        
                        <button type="submit" className="w-full px-4 py-3 text-white font-bold rounded-lg shadow-md bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-600 hover:to-violet-600 transition-all">
                            Create Motive
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
