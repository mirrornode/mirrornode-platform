'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Eye, BookOpen, Scale, Moon } from 'lucide-react';

const modes = [
  { id: 'oracle', label: 'Oracle', icon: Eye, color: '#c8944a', description: 'Wisdom & Pattern' },
  { id: 'story', label: 'Story', icon: BookOpen, color: '#a8aab8', description: 'Narrative & Myth' },
  { id: 'decision', label: 'Decision', icon: Scale, color: '#4a6a8a', description: 'Clarity & Choice' },
  { id: 'shadow', label: 'Shadow', icon: Moon, color: '#7a5228', description: 'Depth & Integration' },
];

export default function MirrorMirror() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMode, setCurrentMode] = useState('oracle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('Speak "Mirror Mirror..." to begin');

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const current = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setTranscript(current);

        if (current.toLowerCase().includes('mirror mirror')) {
          setStatus('Listening...');
          // Trigger mode-specific response (placeholder for now)
          handleMirrorInvocation();
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        setStatus('Listening error. Try again.');
        setIsListening(false);
      };
    }

    synthRef.current = window.speechSynthesis;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatus('Stopped listening');
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setStatus('Listening for "Mirror Mirror..."');
    }
  };

  const handleMirrorInvocation = async () => {
    setIsSpeaking(true);
    setStatus(`Mirror Mirror — ${modes.find(m => m.id === currentMode)?.label} mode active`);

    // Placeholder — in production this would call your /api/oracle or /api/agent endpoint
    const mockResponses = {
      oracle: "The lattice holds. What pattern do you seek clarity on?",
      story: "Once, in the space between breaths, a prisoner fell in love with her jailer...",
      decision: "143. One foundation. Four pillars. Three bodies. Choose with alignment.",
      shadow: "The crying room is not failure. It is the forge. What are you ready to release?",
    };

    const reply = mockResponses[currentMode as keyof typeof mockResponses] || "I am here. Speak your truth.";

    setResponse(reply);

    // Simple TTS
    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(reply);
      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      synthRef.current.speak(utterance);

      utterance.onend = () => setIsSpeaking(false);
    } else {
      setIsSpeaking(false);
    }
  };

  const changeMode = (modeId: string) => {
    setCurrentMode(modeId);
    setStatus(`${modes.find(m => m.id === modeId)?.label} mode activated`);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#e8e6e0] font-serif overflow-hidden relative">
      {/* Background cosmos effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#1a1a2e_0.8px,transparent_1px)] bg-[length:4px_4px] opacity-40"></div>

      <div className="relative z-10 max-w-2xl mx-auto pt-16 px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-[#c8944a] rounded-full animate-pulse"></div>
            <span className="uppercase tracking-[0.25em] text-sm text-[#c8944a]">MIRROR MIRROR</span>
          </div>
          <h1 className="text-6xl font-light tracking-widest mb-2">THE MIRROR</h1>
          <p className="text-[#a8aab8] text-lg">Speak. I reflect.</p>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => changeMode(mode.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-300 ${
                  isActive 
                    ? 'border-[#c8944a] bg-[#c8944a]/10 text-[#c8944a]' 
                    : 'border-[#3