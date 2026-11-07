import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Send, Sparkles, Loader2, Copy, RefreshCw, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAIGateway, useAIScopeConfig } from '@/hooks/use-ai-config';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: string;
}

// Prompt templates - NO hardcoded models
const promptTemplates = [
  { label: 'Product Description', value: 'content_generation', prompt: 'Generate a compelling product description for...' },
  { label: 'SEO Meta Tags', value: 'seo_optimization', prompt: 'Generate SEO meta tags for...' },
  { label: 'Marketing Content', value: 'content_generation', prompt: 'Create marketing content for...' },
  { label: 'Code Review', value: 'security_audit', prompt: 'Review this code for security and performance...' },
  { label: 'Custom Prompt', value: 'ai_control_panel', prompt: '' },
];

export default function AdminAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [promptType, setPromptType] = useState('ai_control_panel');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current config for the selected scope (for display purposes only)
  const { data: scopeConfig } = useAIScopeConfig(promptType as any);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      type: promptType,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Route through unified gateway - no direct provider calls
      const result = await callAIGateway({
        scope: promptType,
        prompt: input,
      });
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.content,
        type: promptType,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      toast.success('Response generated', { 
        description: `${result.provider}/${result.model}` 
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const regenerate = async (message: Message) => {
    const userMessageIndex = messages.findIndex(
      (m) => m.role === 'user' && messages[messages.indexOf(m) + 1]?.id === message.id
    );
    
    if (userMessageIndex >= 0) {
      setInput(messages[userMessageIndex].content);
      setPromptType(messages[userMessageIndex].type || 'ai_control_panel');
    }
  };

  const handleTemplateChange = (value: string) => {
    setPromptType(value);
    const template = promptTemplates.find((t) => t.value === value);
    if (template && template.prompt) {
      setInput(template.prompt);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Assistant
          <span className="text-xs font-normal bg-primary/20 text-primary px-2 py-1 rounded-full ml-2">
            z.ai / GLM-4.7
          </span>
        </h1>
        <p className="text-muted-foreground">
          Powered by z.ai — Generate product descriptions, SEO content, and more
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto glass-card rounded-xl p-4 mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Wand2 className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm">Ask me to generate content, descriptions, or marketing copy</p>
            
            <div className="grid grid-cols-2 gap-3 mt-6 max-w-lg">
              {promptTemplates.slice(0, -1).map((template) => (
                <button
                  key={template.value}
                  onClick={() => handleTemplateChange(template.value)}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted text-left transition-colors"
                >
                  <p className="font-medium text-sm">{template.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{template.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {message.role === 'assistant' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.content)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => regenerate(message)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Regenerate
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-muted rounded-2xl p-4 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="glass-card rounded-xl p-4">
        <div className="flex gap-3 mb-3">
          <Select value={promptType} onValueChange={handleTemplateChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {promptTemplates.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your prompt here..."
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            type="submit"
            className="btn-sunset self-end"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
