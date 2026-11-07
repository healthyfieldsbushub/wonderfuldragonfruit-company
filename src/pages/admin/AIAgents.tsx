import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Send, 
  Loader2, 
  Copy, 
  RefreshCw, 
  Bot,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { appClient } from '@/integrations/manus/client';
import { AgentSelector, AI_AGENTS, AIAgent, AgentBadge } from '@/components/ai/AgentSelector';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent?: AIAgent;
  toolUsed?: string;
}

export default function AIAgents() {
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAgentSelect = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setMessages([]);
    setInput('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim() || isLoading || !selectedAgent) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      agent: selectedAgent,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call the appropriate MCP endpoint
      const { data, error } = await appClient.functions.invoke(selectedAgent.mcpEndpoint, {
        body: {
          action: 'chat',
          prompt: input,
          tools: selectedAgent.tools,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content || data.response || JSON.stringify(data, null, 2),
        agent: selectedAgent,
        toolUsed: data.tool_used,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      toast.success('Response received', {
        description: `${selectedAgent.name}${data.tool_used ? ` used ${data.tool_used}` : ''}`,
      });
    } catch (error: any) {
      console.error('Agent error:', error);
      toast.error('Failed to get response', {
        description: error.message,
      });
      
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
          agent: selectedAgent,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!selectedAgent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            AI Agents
          </h1>
          <p className="text-muted-foreground mt-2">
            Select an AI agent specialized for your task. Each agent has access to specific tools and knowledge.
          </p>
        </div>

        <AgentSelector
          selectedAgent={selectedAgent}
          onSelectAgent={handleAgentSelect}
        />

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{AI_AGENTS.length}</div>
              <div className="text-sm text-muted-foreground">Specialized Agents</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">
                {AI_AGENTS.reduce((acc, a) => acc + a.tools.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Tools</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">6</div>
              <div className="text-sm text-muted-foreground">MCP Servers</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const Icon = selectedAgent.icon;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedAgent(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${selectedAgent.color} text-white`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{selectedAgent.name}</h1>
              <p className="text-sm text-muted-foreground">{selectedAgent.tools.length} tools available</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearChat}>
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Available Tools */}
      <div className="flex flex-wrap gap-1 mb-4">
        {selectedAgent.tools.map((tool) => (
          <Badge key={tool} variant="secondary" className="text-xs">
            {tool.replace(/_/g, ' ')}
          </Badge>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass-card rounded-xl overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
              <div className={`p-4 rounded-full ${selectedAgent.color} text-white mb-4`}>
                <Icon className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm text-center max-w-md mt-2">
                {selectedAgent.description}
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg">
                {selectedAgent.tools.slice(0, 4).map((tool) => (
                  <Button
                    key={tool}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start"
                    onClick={() => setInput(`Use ${tool.replace(/_/g, ' ')} to help me with...`)}
                  >
                    {tool.replace(/_/g, ' ')}
                  </Button>
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
                      {message.role === 'assistant' && message.toolUsed && (
                        <Badge variant="secondary" className="mb-2 text-xs">
                          Used: {message.toolUsed.replace(/_/g, ' ')}
                        </Badge>
                      )}
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
                    <span>{selectedAgent.name} is thinking...</span>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${selectedAgent.name}...`}
              className="min-h-[60px] max-h-[120px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              type="submit"
              className={`self-end ${selectedAgent.color}`}
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
    </div>
  );
}
