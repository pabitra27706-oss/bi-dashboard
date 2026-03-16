"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import type { Suggestion } from "@/types";

interface Props {
  onSubmit: (q: string) => void;
  loading: boolean;
  suggestions: Suggestion[];
  followUps: string[];
  activeTable?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export default function ChatInput({
  onSubmit,
  loading,
  suggestions,
  followUps,
  activeTable,
  inputRef: externalRef,
}: Props) {
  const [value, setValue] = useState("");
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;
  const lastSubmitTime = useRef(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    const supported =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window ||
        "webkitSpeechRecognition" in window);
    setVoiceSupported(supported);
  }, [textareaRef]);

  const startListening = useCallback(() => {
    if (!voiceSupported) return;
    const Ctor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setValue(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  }, [voiceSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const submit = useCallback(() => {
    const q = value.trim();
    if (!q || loading) return;
    const now = Date.now();
    if (now - lastSubmitTime.current < 500) return;
    lastSubmitTime.current = now;
    onSubmit(q);
    setValue("");
  }, [value, loading, onSubmit]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const chips =
    followUps.length > 0
      ? followUps
      : suggestions.slice(0, 3).map((s) => s.query);

  const placeholder = activeTable
    ? `Ask anything about ${activeTable}...`
    : "Ask anything about your data...";

  return (
    <div className="w-full max-w-4xl mx-auto">
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {chips.map((c, i) => (
            <button
              key={i}
              onClick={() => {
                setValue(c);
                onSubmit(c);
              }}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[300px]"
            >
              {c.length > 60 ? c.slice(0, 57) + "..." : c}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/30 transition-shadow">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder={placeholder}
          className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
        />

        {voiceSupported && (
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={loading}
            className={`flex-shrink-0 p-2.5 rounded-lg transition-all text-sm ${
              isListening
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400"
            } disabled:opacity-50`}
            title={isListening ? "Stop listening" : "Voice input"}
          >
            {isListening ? (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3ZM19 10v2a7 7 0 0 1-14 0v-2M12 19v4m-4 0h8" />
                </svg>
              </span>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3ZM19 10v2a7 7 0 0 1-14 0v-2M12 19v4m-4 0h8" />
              </svg>
            )}
          </button>
        )}

        <button
          onClick={submit}
          disabled={loading || !value.trim()}
          className="flex-shrink-0 p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white disabled:text-slate-400 transition-colors text-sm font-medium"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" />
            </svg>
          )}
        </button>
      </div>

      {isListening && (
        <p className="text-[11px] text-rose-500 mt-1.5 text-center animate-pulse">
          Listening — speak now
        </p>
      )}
    </div>
  );
}