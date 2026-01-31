import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { reportsAPI } from '@/lib/api';
import { Plus, Mic, Send, Paperclip, X, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Chatbot() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string; fileName?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLanding, setIsLanding] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        alert('Please select a PDF or image file.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const send = async (textToSend?: string) => {
    const text = textToSend ?? prompt;
    if (!text.trim() && !selectedFile) return;

    const currentFile = selectedFile;
    const userMsg = {
      role: 'user' as const,
      text,
      fileName: currentFile?.name
    };

    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setIsLanding(false);
    setIsLoading(true);

    try {
      const res = await reportsAPI.chat(text, {
        file: currentFile || undefined
      });

      const assistantText = res?.text || String(res);
      setMessages(prev => [...prev, { role: 'assistant', text: assistantText }]);
    } catch (err: any) {
      console.error('Chat error', err);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error: ' + (err?.message || 'LLM request failed') }]);
    } finally {
      setIsLoading(false);
      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto px-4">
      {isLanding ? (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-700">
          <div className="w-full max-w-3xl text-center space-y-8">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Hello, how can I help?
            </h1>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-2">
                <div className="flex flex-col">
                  {selectedFile && (
                    <div className="flex items-center gap-2 px-4 py-2 mb-2 bg-slate-50 dark:bg-slate-800 rounded-xl w-fit animate-in slide-in-from-top-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                      <button onClick={removeFile} className="hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 text-slate-500 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition"
                      title="Upload PDF or image"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,image/*"
                    />
                    <input
                      className="flex-1 bg-transparent border-none focus:ring-0 text-lg py-4 px-2 outline-none"
                      placeholder="Ask anything about your health or upload a report..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    />
                    <Button
                      onClick={() => send()}
                      disabled={(!prompt.trim() && !selectedFile) || isLoading}
                      size="icon"
                      className="rounded-xl h-12 w-12 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all"
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {[
                { title: "Analyze a report", desc: "Upload your blood test or MRI and ask questions.", icon: FileText },
                { title: "Symptom checker", desc: "Describe how you're feeling and get insights.", icon: Mic },
                { title: "Health advice", desc: "Ask about diet, exercise, or medications.", icon: Plus }
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(item.title + ": ")}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all group text-left"
                >
                  <item.icon className="h-5 w-5 mb-3 text-blue-500" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto py-8 space-y-6 px-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col max-w-[85%] animate-in slide-in-from-bottom-2 duration-300",
                  m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className={cn(
                  "rounded-2xl px-5 py-3 shadow-sm",
                  m.role === 'user'
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-none"
                )}>
                  {m.fileName && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-black/10 dark:bg-white/10 rounded-lg text-xs font-medium">
                      <FileText className="h-3 w-3" />
                      {m.fileName}
                    </div>
                  )}
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{m.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1 capitalize">{m.role}</span>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 animate-pulse">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-5 py-3 rounded-tl-none border border-slate-50 dark:border-slate-700">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className="py-6">
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-2">
              <div className="flex flex-col">
                {selectedFile && (
                  <div className="flex items-center gap-2 px-3 py-1.5 mb-2 bg-slate-50 dark:bg-slate-800 rounded-xl w-fit">
                    <FileText className="h-3 w-3 text-blue-500" />
                    <span className="text-[10px] font-medium truncate max-w-[150px]">{selectedFile.name}</span>
                    <button onClick={removeFile} className="hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-blue-500 transition"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,image/*" />
                  <Textarea
                    className="flex-1 min-h-[44px] max-h-32 bg-transparent border-none focus-visible:ring-0 resize-none py-3 px-2 text-sm"
                    placeholder="Ask a follow up..."
                    rows={1}
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  />
                  <Button
                    onClick={() => send()}
                    disabled={(!prompt.trim() && !selectedFile) || isLoading}
                    size="icon"
                    className="rounded-xl h-10 w-10 bg-blue-600 hover:bg-blue-700 transition-all shadow-md"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
