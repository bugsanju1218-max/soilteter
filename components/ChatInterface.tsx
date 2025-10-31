import React, { useState, useRef, useEffect } from 'react';
import type { SoilData, AnalysisResult } from '../types';
import { getChatResponse } from '../services/geminiService';
import { useSettings } from '../contexts/SettingsContext';
import { LoadingIcon, SendIcon } from './Icons';

interface ChatInterfaceProps {
    soilData: SoilData;
    analysisResult: AnalysisResult;
    language: 'en' | 'te';
}

interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ soilData, analysisResult, language }) => {
    const { t } = useSettings();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);
    
    // Reset chat when result changes
    useEffect(() => {
        setMessages([]);
    }, [analysisResult]);


    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        const currentMessages = [...messages, newUserMessage];
        setMessages(currentMessages);
        setInput('');
        setIsLoading(true);

        try {
            const history = currentMessages.map(m => ({ role: m.role, parts: m.parts }));
            const responseText = await getChatResponse(soilData, analysisResult, history.slice(0, -1), input, language);
            const newModelMessage: ChatMessage = { role: 'model', parts: [{ text: responseText }] };
            setMessages(prev => [...prev, newModelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "Sorry, I couldn't get a response. Please try again." }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200/80 dark:border-slate-700 flex flex-col h-[500px]">
            <header className="p-4 border-b dark:border-slate-700">
                <h2 className="text-lg font-bold text-green-800 dark:text-green-400">{t('askSoilSage')}</h2>
            </header>
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">{t('askFollowUp')}</div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200'}`}>
                           {/* Naive markdown-like rendering for bold text */}
                           {msg.parts[0].text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex justify-start">
                         <div className="max-w-[80%] p-3 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <LoadingIcon className="h-4 w-4" />
                            <span>{t('thinking')}</span>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-4 border-t dark:border-slate-700">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('chatPlaceholder')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-slate-900 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-500"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !input.trim()} className="p-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-slate-600">
                        <SendIcon className="h-5 w-5" />
                    </button>
                </form>
            </footer>
        </div>
    );
}

export default ChatInterface;