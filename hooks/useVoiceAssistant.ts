
import { useState, useCallback, useRef, useEffect } from 'react';
import { generateSpeech, decode, decodeAudioData } from '../services/geminiService';

export const useVoiceAssistant = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Cleanup audio resources on component unmount
    useEffect(() => {
        return () => {
            sourceRef.current?.stop();
            audioContextRef.current?.close();
        }
    }, []);

    const speak = useCallback(async (textToSpeak?: string) => {
        // If speaking or generating, the button press should function as a "stop" button
        if (isSpeaking || isGenerating) {
            if (sourceRef.current) {
                try {
                    sourceRef.current.stop();
                } catch (e) {
                    // Ignore errors if the source has already stopped
                }
                sourceRef.current = null;
            }
            setIsSpeaking(false);
            setIsGenerating(false);
            return;
        }

        if (!textToSpeak) return;
        
        // Lazily create AudioContext on first use
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            // FIX: Cast window to `any` to allow access to the vendor-prefixed `webkitAudioContext` for older browser compatibility.
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        try {
            setIsGenerating(true);
            const base64Audio = await generateSpeech(textToSpeak);
            
            // If the user cancelled during generation, don't proceed.
            if (!isGenerating) return;

            const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                audioContextRef.current,
                24000,
                1
            );
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);

            source.onended = () => {
                setIsSpeaking(false);
                sourceRef.current = null;
            };

            setIsGenerating(false);
            source.start();
            sourceRef.current = source;
            setIsSpeaking(true);

        } catch (error) {
            console.error("Failed to play audio:", error);
            setIsGenerating(false);
            setIsSpeaking(false);
        }
    }, [isGenerating, isSpeaking]);

    // Ensure state is reset if a component unmounts mid-speech
    useEffect(() => {
        return () => {
            setIsGenerating(false);
            setIsSpeaking(false);
        }
    }, []);

    return { isSpeaking, isGenerating, speak };
};
