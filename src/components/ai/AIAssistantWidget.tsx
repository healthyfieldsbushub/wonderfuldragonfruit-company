import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentSelector, AI_AGENTS, type AIAgent } from "@/components/ai/AgentSelector";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Phone,
  Leaf,
  ChevronDown,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${"/api"}/api/functions/onemin-chat`;

const quickPrompts = [
  { label: "🌱 Recommend plants", message: "I'm new to dragon fruit farming. What cultivars do you recommend for beginners?" },
  { label: "💰 View prices", message: "Can you show me the price ranges for different dragon fruit varieties?" },
  { label: "🏭 Commercial farming", message: "I want to start a commercial dragon fruit farm. What packages do you offer?" },
  { label: "📋 Business plan", message: "Tell me about your business plans for dragon fruit farming" },
  { label: "💵 Funding help", message: "I need help with funding applications for my dragon fruit farm" },
];

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent>(AI_AGENTS[2]); // Customer Support default
  const [showAgents, setShowAgents] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const streamChat = async (userMessage: string) => {
    const userMsg: Message = { role: "user", content: userMessage };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setIsLoading(true);
    setInput("");

    let assistantContent = "";

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${""}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          action: "with_products",
          agent: selectedAgent.id,
          agent_scope: selectedAgent.scope,
          agent_tools: selectedAgent.tools,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Add assistant message placeholder
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent
                };
                return newMessages;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev.filter(m => m.content !== ""),
        {
          role: "assistant",
          content: `I'm having trouble connecting right now. Please contact us directly:\n\n📞 **Reception:** +1 351 777 2848\n📱 **WhatsApp:** +27 83 447 4639\n📧 **Email:** admin@proagrisa.co.za`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleQuickPrompt = (message: string) => {
    if (isLoading) return;
    streamChat(message);
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-dragon-green to-dragon-pink text-white px-5 py-4 rounded-full shadow-2xl hover:shadow-dragon-pink/30 transition-all duration-300 hover:scale-105 group"
          >
            <Bot className="h-6 w-6" />
            <span className="font-medium hidden sm:inline">Ask DFSA Assistant</span>
            <Sparkles className="h-4 w-4 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[420px] h-[600px] max-h-[80vh] bg-card border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-dragon-green/10 to-dragon-pink/10">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dragon-green to-dragon-pink flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold">DFSA Assistant</h3>
                    <button
                      type="button"
                      onClick={() => setShowAgents(v => !v)}
                      className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
                    >
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      {selectedAgent.name}
                      <ChevronDown className={`h-3 w-3 transition-transform ${showAgents ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {showAgents && (
                <div className="px-4 pb-3">
                  <AgentSelector
                    selectedAgent={selectedAgent}
                    onSelectAgent={(a) => { setSelectedAgent(a); setShowAgents(false); }}
                    compact
                  />
                </div>
              )}
            </div>


            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="space-y-4">
                  {/* Welcome message */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dragon-green to-dragon-pink flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 bg-muted/50 rounded-2xl rounded-tl-sm p-4">
                      <p className="text-sm">
                        👋 Welcome to Wonderful Dragon Fruit South Africa! I'm your AI assistant.
                      </p>
                      <p className="text-sm mt-2">
                        I can help you with:
                      </p>
                      <ul className="text-sm mt-1 space-y-1 text-muted-foreground">
                        <li>🌱 Finding the perfect dragon fruit cultivars</li>
                        <li>💰 Product recommendations & pricing</li>
                        <li>🏭 Commercial farming packages</li>
                        <li>📋 Business plans & funding assistance</li>
                      </ul>
                      <p className="text-sm mt-3 font-medium">
                        How can I help you today?
                      </p>
                    </div>
                  </div>

                  {/* Quick prompts */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {quickPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickPrompt(prompt.message)}
                        className="text-xs px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === "user" 
                          ? "bg-primary" 
                          : "bg-gradient-to-br from-dragon-green to-dragon-pink"
                      }`}>
                        {msg.role === "user" ? (
                          <User className="h-4 w-4 text-primary-foreground" />
                        ) : (
                          <Bot className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className={`flex-1 max-w-[85%] rounded-2xl p-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted/50 rounded-tl-sm"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content || "..."}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dragon-green to-dragon-pink flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-muted/50 rounded-2xl rounded-tl-sm p-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Quick actions when in conversation */}
            {messages.length > 0 && (
              <div className="px-4 py-2 border-t bg-muted/30">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {quickPrompts.slice(0, 3).map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickPrompt(prompt.message)}
                      disabled={isLoading}
                      className="text-xs px-3 py-1.5 bg-background border rounded-full whitespace-nowrap hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about dragon fruit plants..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2 flex items-center justify-center gap-2">
                <Phone className="h-3 w-3" />
                Need human help? Call +1 351 777 2848
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
