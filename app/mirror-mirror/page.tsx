'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Volume2, Eye, BookOpen, Scale, Moon, Play, Loader2 } from 'lucide-react';

type SpeechRecognitionEvent = {
  results: { [index: number]: { [index: number]: { transcript: string } } };
};

const modes = [
  { id: 'oracle', label: 'Oracle', icon: Eye, color: '#c8944a', desc: 'Wisdom & Pattern', endpoint: 'oracle' },
  { id: 'story', label: 'Story', icon: BookOpen, color: '#a8aab8', desc: 'Narrative & Myth', endpoint: 'agent/story' },
  { id: 'decision', label: 'Decision', icon: Scale, color: '#4a6a8a', desc: 'Clarity & Choice', endpoint: 'agent/decision' },
  { id: 'shadow', label: 'Shadow', icon: Moon, color: '#7a5228', desc: 'Depth & Integration', endpoint: 'agent/shadow' },
];

export default function MirrorMirror() {
  const [currentMode, setCurrentMode] = useState('oracle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('Say "Mirror Mirror..." to begin');

  const recognitionRef = useRef<{ continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: SpeechRecognitionEvent) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void } | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const sendToBackend = useCallback(async (userInput: string) => {
    setIsThinking(true);
    setStatus('Reflecting...');
    try {
      const mode = modes.find(m => m.id === currentMode);
      const endpoint = mode?.endpoint || 'oracle';
      const res = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput, mode: currentMode }),
      });
      const data = await res.json();
      const reply = data.response || data.message || 'The mirror is quiet today...';
      setResponse(reply);
      if (synthRef.current) {
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.rate = 0.92;
        utterance.pitch = 1.05;
        synthRef.current.speak(utterance);
        setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
      }
    } catch (error) {
      console.error('Mirror Mirror API error:', error);
      const fallback = 'The lattice is holding, but the connection is faint. Try again.';
      setResponse(fallback);
      if (synthRef.current) {
        synthRef.current.speak(new SpeechSynthesisUtterance(fallback));
      }
    } finally {
      setIsThinking(false);
      setStatus(`${modes.find(m => m.id === currentMode)?.label} mode active`);
    }
  }, [currentMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: any }).webkitSpeechRecognition;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current!.continuous = false;
      recognitionRef.current!.interimResults = false;
      recognitionRef.current!.lang = 'en-US';
      recognitionRef.current!.onresult = async (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript.trim();
        setTranscript(text);
        setStatus(`Heard: "${text}"`);
        if (text.toLowerCase().includes('mirror mirror') || text.length > 8) {
          await sendToBackend(text);
        }
      };
      recognitionRef.current!.onerror = () => {
        setStatus('Listening error. Try again.');
        setIsListening(false);
      };
      recognitionRef.current!.onend = () => setIsListening(false);
    }
    synthRef.current = window.speechSynthesis;
  }, [currentMode, sendToBackend]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current!.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setResponse('');
      recognitionRef.current!.start();
      setIsListening(true);
      setStatus('Listening... Speak freely after "Mirror Mirror..."');
    }
  };

  const changeMode = (modeId: string) => {
    setCurrentMode(modeId);
    setResponse('');
    setTranscript('');
    setStatus(`${modes.find(m => m.id === modeId)?.label} mode activated`);
  };

  return (
    <main className="min-h-screen bg-[#0d0e14] text-[#e8e4d4] flex flex-col items-center justify-start pt-12 pb-24 px-4 font-mono">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-widest text-[#c8944a] mb-2">MIRROR MIRROR</h1>
          <p className="text-[#6a6860] text-sm tracking-wider">THE MIRROR</p>
          <p className="text-[#8a8478] text-xs mt-1">Speak. I reflect.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 w-full">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const active = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => changeMode(mode.id)}
                className={`group flex flex-col items-center gap-3 px-8 py-5 rounded-3xl border transition-all duration-300 hover:scale-105 ${
                  active
                    ? 'border-[#c8944a] bg-[#c8944a]/10 shadow-lg shadow-[#c8944a]/20'
                    : 'border-[#3a3c4a] hover:border-[#6a6860]'
                }`}
              >
                <Icon size={22} style={{ color: mode.color }} />
                <span className="text-sm font-semibold tracking-wider">{mode.label}</span>
                <span className="text-xs text-[#6a6860]">{mode.desc}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={toggleListening}
            className={`w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              isListening
                ? 'border-red-400 bg-red-400/10 animate-pulse'
                : isThinking
                ? 'border-[#c8944a] bg-[#c8944a]/10'
                : 'border-[#3a3c4a] hover:border-[#c8944a] hover:bg-[#c8944a]/5'
            }`}
          >
            {isListening ? (
              <Mic size={32} className="text-red-400" />
            ) : isThinking ? (
              <Loader2 size={32} className="text-[#c8944a] animate-spin" />
            ) : (
              <Play size={32} className="text-[#6a6860]" />
            )}
          </button>
          {isListening && (
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-400 rounded-full animate-pulse"
                  style={{ height: `${12 + Math.random() * 20}px`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
          <div className="text-center">
            <p className="text-[#c8944a] text-xs tracking-widest font-semibold">
              {modes.find(m => m.id === currentMode)?.label.toUpperCase()} MODE
            </p>
            <p className="text-[#6a6860] text-xs mt-1">{status}</p>
          </div>
        </div>
        {isSpeaking && (
          <div className="flex items-center gap-2 text-[#c8944a] text-xs">
            <Volume2 size={14} />
            <span>Speaking...</span>
          </div>
        )}
        {(transcript || response) && (
          <div className="w-full flex flex-col gap-4">
            {transcript && (
              <div className="bg-[#1a1c26] rounded-2xl p-6 border border-[#3a3c4a]">
                <p className="text-[#6a6860] text-xs tracking-widest mb-3">YOU SAID</p>
                <p className="text-[#e8e4d4] italic">&ldquo;{transcript}&rdquo;</p>
              </div>
            )}
            {response && (
              <div className="bg-[#1a1c26] rounded-2xl p-6 border border-[#c8944a]/30">
                <p className="text-[#c8944a] text-xs tracking-widest mb-3">THE MIRROR REFLECTS</p>
                <p className="text-[#e8e4d4] leading-relaxed">{response}</p>
              </div>
            )}
          </div>
        )}
        <p className="text-[#3a3c4a] text-xs tracking-widest mt-8">
          MIRRORNODE &middot; MIRROR MIRROR &middot; &#x1F9B2; &middot; NOTHING IS LOST
        </p>
      </div>
    </main>
  );
}
