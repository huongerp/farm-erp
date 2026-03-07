import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { generateResponse } from '../api/gemini';
import Button from '../components/ui/Button';
import DashboardToolbar from '../components/shared/DashboardToolbar';
import { Send, Bot, User, Sparkles, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ChatMessage } from '../types';
import { formatTime } from '../lib/utils';

const AiStudio: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      content: t('page.ai.initialMessage'),
      timestamp: Date.now()
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const mutation = useMutation({
    mutationFn: (prompt: string) => generateResponse(prompt),
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'model', content: data || t('page.ai.fallbackError'), timestamp: Date.now() }
      ]);
    },
    onError: (error) => {
      toast.error(t('page.ai.apiError'));
      if (import.meta.env.DEV) console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!process.env.API_KEY) {
        toast.error(t('page.ai.missingApiKey'));
        return;
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    mutation.mutate(input);
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'model',
        content: t('page.ai.initialMessage'),
        timestamp: Date.now(),
      },
    ]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] min-h-0">
      <DashboardToolbar
        onBack={() => navigate('/')}
        leadingContent={
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-primary/80 text-white shadow-md shadow-primary/20">
              <Sparkles size={16} />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">{t('page.ai.title')}</h2>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" aria-hidden />
              <span className="text-xs text-muted-foreground truncate">{t('page.ai.online')}</span>
            </div>
          </div>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            className="gap-1.5 border-border bg-card text-foreground hover:bg-muted"
          >
            <PlusCircle size={16} />
            <span className="hidden sm:inline">{t('page.ai.newChat')}</span>
          </Button>
        }
      />
      <div className="flex-1 min-h-0 flex flex-col pt-3 md:pt-4">
        <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Vùng chat: flex-1, trống khi ít tin, cuộn dọc khi nhiều */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-muted/30">
        <AnimatePresence initial={false}>
            {messages.map((msg) => (
            <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${msg.role === 'model' ? 'bg-card border-border text-primary' : 'bg-foreground border-foreground/80 text-background'}`}>
                    {msg.role === 'model' ? <Bot size={16} /> : <User size={16} />}
                </div>
                
                <div className={`flex flex-col max-w-[92%] md:max-w-[88%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 md:px-5 md:py-3.5 text-sm leading-relaxed shadow-sm break-words ${
                    msg.role === 'user' 
                        ? 'bg-foreground text-background rounded-2xl rounded-tr-sm' 
                        : 'bg-card text-foreground border border-border rounded-2xl rounded-tl-sm'
                    }`}>
                        {msg.content}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 px-1">
                        {formatTime(new Date(msg.timestamp))}
                    </span>
                </div>
            </motion.div>
            ))}
            
            {mutation.isPending && (
                 <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="flex gap-4"
             >
                 <div className="w-8 h-8 rounded-full bg-card border border-border text-primary flex items-center justify-center shrink-0 shadow-sm">
                    <Bot size={16} />
                 </div>
                 <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex space-x-1.5 items-center shadow-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
             </motion.div>
            )}
            <div ref={messagesEndRef} />
        </AnimatePresence>
      </div>

        {/* Ô nhập câu hỏi: cố định sát mép dưới */}
        <div className="shrink-0 p-3 md:p-4 bg-card border-t border-border pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <form onSubmit={handleSubmit} className="w-full flex items-end gap-2 p-2 rounded-xl bg-muted border border-border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                    }
                }}
                placeholder={t('page.ai.inputPlaceholder')}
                className="w-full bg-transparent border-0 px-2 py-2 text-sm text-foreground focus:outline-none resize-none max-h-32 placeholder:text-muted-foreground"
                rows={1}
                style={{ minHeight: '40px' }}
                disabled={mutation.isPending}
            />
            <Button 
                type="submit" 
                size="icon"
                disabled={mutation.isPending || !input.trim()} 
                className={`h-9 w-9 rounded-lg shrink-0 transition-all ${input.trim() ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-muted text-muted-foreground'}`}
            >
                <Send size={16} className={input.trim() ? 'ml-0.5' : ''} />
            </Button>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AiStudio;
