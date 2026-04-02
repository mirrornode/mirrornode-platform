'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Eye, BookOpen, Scale, Moon, Play, Loader2 } from 'lucide-react';

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

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const text = event.results[0][0].transcript.trim();
        setTranscript(text);
        setStatus(`Heard: "${text}"`);

        if (text.toLowerCase().includes('mirror mirror') || text.length > 8) {
          await sendToBackend(text);
        }
      };

      recognitionRef.current.onerror = () => {
        setStatus('Listening error. Try again.');
        setIsListening(false);
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }

    synthRef.current = window.speechSynthesis;
  }, [currentMode]);

  const sendToBackend = async (userInput: string) => {
    setIsThinking(true);
    setStatus('Reflecting...');

    try {
      const mode = modes.find(m => m.id === currentMode);
      const endpoint = mode?.endpoint || 'oracle';

      const res = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          mode: currentMode,
        }),
      });

      const data = await res.json();

      const reply = data.response || data.message || "The mirror is quiet today...";
      setResponse(reply);

      // Speak the response
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
      const fallback = "The lattice is holding, but the connection is faint. Try again.";
      setResponse(fallback);
      
      if (synthRef.current) {
        const utterance = new SpeechSynthesisUtterance(fallback);
        synthRef.current.speak(utterance);
      }
    } finally {
      setIsThinking(false);
      setStatus(`${modes.find(m => m.id === currentMode)?.label} mode active`);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setResponse('');
      recognitionRef.current.start();
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
    <div className="min-h-screen bg-[#050508] text-[#e8e6e0] overflow-hidden relative font-serif">
      <div className="absolute inset-0 bg-[radial-gradient(#1a1a2e_0.8px,transparent_1px)] bg-[length:5px_5px] opacity-30" />

      <div className="relative z-10 max-w-3xl mx-auto pt-20 px-6 pb-24">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-4 h-4 bg-[#c8944a] rounded-full animate-pulse" />
            <span className="uppercase tracking-[4px] text-sm text-[#c8944a]">MIRROR MIRROR</span>
          </div>
          <h1 className="text-7xl font-light tracking-[0.5em] mb-3">THE MIRROR</h1>
          <p className="text-[#a8aab8] text-xl">Speak. I reflect.</p>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
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
                <Icon className={`w-8 h-8 transition-colors ${active ? 'text-[#c8944a]' : 'text-[#6a6860] group-hover:text-[#a8aab8]'}`} />
                <div>
                  <div className={`font-medium ${active ? 'text-[#c8944a]' : ''}`}>{mode.label}</div>
                  <div className="text-xs text-[#6a6860]">{mode.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Voice Interface */}
        <div className="flex flex-col items-center">
          <div 
            onClick={toggleListening}
            className={`relative w-56 h-56 flex items-center justify-center cursor-pointer transition-all duration-500 rounded-full border-4 ${
              isListening 
                ? 'border-red-500 scale-110 shadow-2xl shadow-red-500/30' 
                : 'border-[#c8944a]/60 hover:border-[#c8944a] hover:scale-105'
            }`}
          >
            <div className={`w-44 h-44 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500/10' : 'bg-[#c8944a]/5'}`}>
              {isListening ? (
                <Mic className="w-24 h-24 text-red-500 animate-pulse" />
              ) : isThinking ? (
                <Loader2 className="w-24 h-24 text-[#c8944a] animate-spin" />
              ) : (
                <Play className="w-24 h-24 text-[#c8944a]" />
              )}
            </div>
            {isListening && <div className="absolute inset-0 border border-red-500/50 rounded-full animate-ping" />}
          </div>

          <div className="mt-10 text-center max-w-md">
            <div className="text-[#c8944a] font-medium tracking-widest text-sm mb-2">
              {modes.find(m => m.id === currentMode)?.label.toUpperCase()} MODE
            </div>
            <div className="text-[#a8aab8] text-lg min-h-[1.8em]">
              {status}
            </div>
          </div>
        </div>

        {/* Output Area */}
        {(transcript || response) && (
          <div className="mt-16 space-y-8 max-w-2xl mx-auto">
            {transcript && (
              <div className="bg-[#0a0a12] border border-[#3a3c4a] rounded-3xl p-8">
                <div className="uppercase text-xs tracking-widest text-[#6a6860] mb-3">YOU SAID</div>
                <div className="text-xl italic leading-relaxed">"{transcript}"</div>
              </div>
            )}

            {response && (
              <div className="bg-[#0a0a12] border border-[#c8944a]/40 rounded-3xl p-10">
                <div className="flex items-center gap-3 mb-6">
                  <Volume2 className="w-5 h-5 text-[#c8944a]" />
                  <span className="uppercase text-xs tracking-widest text-[#c8944a]">THE MIRROR REFLECTS</span>
                </div>
                <div className="text-2xl leading-relaxed text-[#e8e6e0]">
                  {response}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-[3px] text-[#3a3c4a] font-mono">
        MIRRORNODE · MIRROR MIRROR · 🪢 · NOTHING IS LOST
      </div>
    </div>
  );
}