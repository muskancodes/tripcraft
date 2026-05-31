import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Sparkles, User, Bot, AlertCircle } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { AIMessage } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const QUICK_PROMPTS = [
  'Suggest attractions',
  'Hotel recommendations',
  'Optimise my itinerary',
  'Budget tips in INR',
  'Packing list',
  'Visa requirements',
];

const GREETING: AIMessage = {
  id: 'greeting',
  role: 'assistant',
  content: "Hello! I'm your AI travel assistant. I can help you plan activities, suggest hotels, create itineraries, advise on budgets in ₹, and answer any travel question. What would you like to explore?",
  timestamp: new Date().toISOString(),
};

type Provider = 'claude' | 'gemini' | 'none' | 'loading';

const PROVIDER_LABEL: Record<Provider, string> = {
  claude:  'Powered by Claude',
  gemini:  'Powered by Gemini (free)',
  none:    'No AI key configured',
  loading: 'Loading…',
};

export default function AIAssistant() {
  const { setAIPanelOpen } = useUIStore();
  const [messages, setMessages] = useState<AIMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>('loading');
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch('/api/ai/provider')
      .then(r => r.json())
      .then(d => setProvider(d.provider as Provider))
      .catch(() => setProvider('none'));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setApiError(null);

    const userMsg: AIMessage = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const assistantId = uuidv4();
    const assistantMsg: AIMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsStreaming(true);

    // Build history for the API (exclude the empty assistant placeholder)
    const history = [...messages, userMsg]
      .filter(m => m.id !== 'greeting' || m.role === 'user')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      .filter(m => m.content.trim());

    // Always keep the greeting as first assistant turn for context
    const apiMessages = [
      { role: 'user' as const, content: text },
      ...messages
        .filter(m => m.id !== 'greeting' && m.content.trim())
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: text },
    ];

    // Build properly interleaved messages
    const conversationMessages = messages
      .filter(m => m.id !== 'greeting' && m.content.trim())
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    conversationMessages.push({ role: 'user', content: text });

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationMessages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;

          try {
            const { delta, error } = JSON.parse(payload);
            if (error) throw new Error(error);
            if (delta) {
              accumulated += delta;
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: accumulated } : m)
              );
            }
          } catch { /* skip malformed lines */ }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      const msg = (err as Error).message ?? 'Unknown error';
      setApiError(msg.includes('No AI key')
        ? 'No AI key configured. Add GEMINI_API_KEY (free) or ANTHROPIC_API_KEY to your .env file.'
        : msg);
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsStreaming(false);
    }
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**'))
        return <p key={i} className="font-bold text-white mt-2 mb-1">{line.slice(2, -2)}</p>;
      if (line.startsWith('## '))
        return <p key={i} className="font-bold text-white mt-2 mb-1 text-sm">{line.slice(3)}</p>;
      if (line.startsWith('• ') || line.startsWith('- '))
        return <p key={i} className="text-sm text-gray-300 ml-2 leading-relaxed">• {line.slice(2)}</p>;
      if (line === '') return <br key={i} />;
      return <p key={i} className="text-sm text-gray-300 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="h-full flex flex-col w-[360px] bg-surface-2/95 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/8">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">AI Travel Assistant</p>
          <p className={`text-xs ${provider === 'none' ? 'text-red-400' : 'text-gray-500'}`}>
            {PROVIDER_LABEL[provider]}
          </p>
        </div>
        <button onClick={() => setAIPanelOpen(false)}
          className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* API error banner */}
      {apiError && (
        <div className="mx-3 mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300 leading-relaxed">{apiError}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 scrollbar-hide">
        {messages.map(msg => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
              ${msg.role === 'user' ? 'bg-indigo-600/30' : 'bg-white/10'}`}>
              {msg.role === 'user'
                ? <User className="w-3.5 h-3.5 text-indigo-300" />
                : <Bot className="w-3.5 h-3.5 text-gray-400" />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-indigo-600/30 border border-indigo-500/20'
                : 'bg-white/5 border border-white/8'
            }`}>
              {msg.role === 'user'
                ? <p className="text-sm text-indigo-200">{msg.content}</p>
                : msg.content
                  ? <div className="space-y-0.5">{renderContent(msg.content)}</div>
                  : <TypingDots />}
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-3 pb-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => sendMessage(p)} disabled={isStreaming}
              className="flex-shrink-0 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10
                         hover:bg-white/10 hover:border-white/20 text-xs text-gray-400 hover:text-white
                         disabled:opacity-40 transition-all">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-3 pb-4">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2
                        focus-within:border-indigo-500/50 transition-colors">
          <input
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none px-2"
            placeholder="Ask about your trip..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            disabled={isStreaming}
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || isStreaming}
            className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40
                       disabled:cursor-not-allowed flex items-center justify-center transition-colors">
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1.5 py-1">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-500"
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
      ))}
    </div>
  );
}
