import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/integrations/manus/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  MessageCircle,
  Send,
  Phone,
  Search,
  RefreshCw,
  User,
  Clock,
  CheckCheck,
  AlertCircle,
  Loader2,
  Bot,
  Facebook,
  Instagram,
  Sparkles,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  platform: "whatsapp" | "facebook" | "instagram";
  fromId: string;
  fromName: string;
  content: string;
  direction: "inbound" | "outbound";
  status: string;
  timestamp: string;
}

interface Contact {
  id: string;
  platform: "whatsapp" | "facebook" | "instagram";
  platformId: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

const PLATFORMS = [
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, color: "text-green-500" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-500" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500" },
];

export default function SocialInbox() {
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState<string>("whatsapp");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAIMode, setIsAIMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Fetch WhatsApp contacts
  const { data: whatsappContacts = [], isLoading: loadingWhatsApp } = useQuery({
    queryKey: ["whatsapp-contacts"],
    queryFn: async () => {
      const { data, error } = await appClient
        .from("whatsapp_contacts")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((c) => ({
        id: c.id,
        platform: "whatsapp" as const,
        platformId: c.wa_id,
        name: c.name || c.phone_number || c.wa_id,
      }));
    },
  });

  // Fetch WhatsApp messages for selected contact
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["social-messages", selectedPlatform, selectedContact?.platformId],
    queryFn: async () => {
      if (!selectedContact) return [];

      if (selectedPlatform === "whatsapp") {
        const { data, error } = await appClient
          .from("whatsapp_messages")
          .select("*")
          .or(`from_number.eq.${selectedContact.platformId},to_number.eq.${selectedContact.platformId}`)
          .order("timestamp", { ascending: true });

        if (error) throw error;
        return (data || []).map((m) => ({
          id: m.id,
          platform: "whatsapp" as const,
          fromId: m.from_number,
          fromName: m.direction === "inbound" ? selectedContact.name : "You",
          content: m.message_content || "",
          direction: m.direction as "inbound" | "outbound",
          status: m.status || "sent",
          timestamp: m.timestamp || m.created_at || "",
        }));
      }

      return [];
    },
    enabled: !!selectedContact,
  });

  // Get contacts based on selected platform
  const contacts = selectedPlatform === "whatsapp" ? whatsappContacts : [];
  const filteredContacts = contacts.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.platformId.includes(searchQuery)
  );

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ platform, to, message, messageType }: { platform: string; to: string; message: string; messageType?: string }) => {
      const response = await appClient.functions.invoke("social-send", {
        body: { platform, to, message, messageType },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-messages"] });
      setReplyMessage("");
      toast.success("Message sent!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  // Generate AI response
  const generateAIResponse = async () => {
    if (!selectedContact || !aiPrompt.trim()) return;

    setGeneratingAI(true);
    try {
      const conversationContext = messages.slice(-10).map((m) => ({
        role: m.direction === "inbound" ? "user" : "assistant",
        content: m.content,
      }));

      const response = await appClient.functions.invoke("kilo-ai", {
        body: {
          type: "chat",
          messages: [
            ...conversationContext,
            { role: "user", content: `Customer: ${messages[messages.length - 1]?.content || ""}\n\nAdmin instruction: ${aiPrompt}\n\nGenerate a helpful response:` },
          ],
        },
      });

      if (response.error) throw response.error;
      setReplyMessage(response.data.content || "");
      setAiPrompt("");
      toast.success("AI response generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate AI response");
    } finally {
      setGeneratingAI(false);
    }
  };

  // Send catalogue
  const sendCatalogue = async () => {
    if (!selectedContact) return;

    setSendingReply(true);
    try {
      await sendMessageMutation.mutateAsync({
        platform: selectedPlatform,
        to: selectedContact.platformId,
        message: "Check out our latest dragon fruit catalogue! 🐉🌿",
        messageType: "catalogue",
      });
    } finally {
      setSendingReply(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedContact) return;

    setSendingReply(true);
    try {
      await sendMessageMutation.mutateAsync({
        platform: selectedPlatform,
        to: selectedContact.platformId,
        message: replyMessage,
      });
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-green-500" />;
      case "sent":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "failed":
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    const p = PLATFORMS.find((pl) => pl.id === platform);
    if (!p) return null;
    const Icon = p.icon;
    return <Icon className={`h-5 w-5 ${p.color}`} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Social Inbox</h1>
          <p className="text-muted-foreground">Manage all your social media conversations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isAIMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAIMode(!isAIMode)}
          >
            <Bot className="h-4 w-4 mr-2" />
            AI Mode {isAIMode ? "ON" : "OFF"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
              queryClient.invalidateQueries({ queryKey: ["social-messages"] });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Platform tabs */}
      <Tabs value={selectedPlatform} onValueChange={(v) => { setSelectedPlatform(v); setSelectedContact(null); }}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          {PLATFORMS.map((p) => (
            <TabsTrigger key={p.id} value={p.id} className="flex items-center gap-2">
              <p.icon className={`h-4 w-4 ${p.color}`} />
              {p.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {PLATFORMS.map((platform) => (
          <TabsContent key={platform.id} value={platform.id}>
            <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
              {/* Contacts list */}
              <Card className="glass-card lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getPlatformIcon(platform.id)}
                    Conversations
                    <Badge variant="secondary">{filteredContacts.length}</Badge>
                  </CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-430px)]">
                    {loadingWhatsApp && platform.id === "whatsapp" ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : filteredContacts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {platform.id === "whatsapp" ? (
                          <>
                            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No conversations yet</p>
                            <p className="text-xs mt-1">Messages will appear when customers contact the business number</p>
                          </>
                        ) : (
                          <>
                            {platform.id === "facebook" ? <Facebook className="h-12 w-12 mx-auto mb-2 opacity-50" /> : <Instagram className="h-12 w-12 mx-auto mb-2 opacity-50" />}
                            <p className="font-medium text-foreground">Not connected yet</p>
                            <p className="text-xs mt-1">Facebook and Instagram messaging need the Meta page token configured in Secrets.</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {filteredContacts.map((contact) => (
                          <motion.div
                            key={contact.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedContact?.id === contact.id
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-muted"
                            }`}
                            onClick={() => setSelectedContact(contact)}
                          >
                            <Avatar>
                              <AvatarFallback className={`${platform.id === "whatsapp" ? "bg-green-500/20 text-green-700" : platform.id === "facebook" ? "bg-blue-500/20 text-blue-700" : "bg-pink-500/20 text-pink-700"}`}>
                                {contact.name?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{contact.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{contact.platformId}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chat area */}
              <Card className="glass-card lg:col-span-2 flex flex-col">
                {selectedContact ? (
                  <>
                    {/* Chat header */}
                    <CardHeader className="border-b pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={`${selectedPlatform === "whatsapp" ? "bg-green-500/20 text-green-700" : selectedPlatform === "facebook" ? "bg-blue-500/20 text-blue-700" : "bg-pink-500/20 text-pink-700"}`}>
                              {selectedContact.name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{selectedContact.name}</h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {getPlatformIcon(selectedPlatform)}
                              {selectedContact.platformId}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={sendCatalogue} disabled={sendingReply}>
                          <FileText className="h-4 w-4 mr-2" />
                          Send Catalogue
                        </Button>
                      </div>
                    </CardHeader>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No messages yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <AnimatePresence>
                            {messages.map((msg) => (
                              <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[70%] rounded-lg p-3 ${
                                    msg.direction === "outbound"
                                      ? selectedPlatform === "whatsapp"
                                        ? "bg-green-500 text-white"
                                        : selectedPlatform === "facebook"
                                        ? "bg-blue-500 text-white"
                                        : "bg-pink-500 text-white"
                                      : "bg-muted"
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap">{msg.content || "[Media]"}</p>
                                  <div
                                    className={`flex items-center gap-1 mt-1 text-xs ${
                                      msg.direction === "outbound" ? "text-white/70" : "text-muted-foreground"
                                    }`}
                                  >
                                    {msg.timestamp && (
                                      <span>
                                        {new Date(msg.timestamp).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    )}
                                    {msg.direction === "outbound" && getStatusIcon(msg.status)}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </ScrollArea>

                    {/* AI Mode panel */}
                    {isAIMode && (
                      <div className="p-3 border-t bg-muted/50">
                        <div className="flex gap-2 items-center mb-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">AI Assistant</span>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Instruct AI (e.g., 'Recommend red dragon fruit varieties')"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                generateAIResponse();
                              }
                            }}
                          />
                          <Button onClick={generateAIResponse} disabled={generatingAI || !aiPrompt.trim()}>
                            {generatingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Reply input */}
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Type a message..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          className="min-h-[44px] max-h-32 resize-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendReply();
                            }
                          }}
                        />
                        <Button
                          onClick={handleSendReply}
                          disabled={!replyMessage.trim() || sendingReply}
                          className={
                            selectedPlatform === "whatsapp"
                              ? "bg-green-500 hover:bg-green-600"
                              : selectedPlatform === "facebook"
                              ? "bg-blue-500 hover:bg-blue-600"
                              : "bg-pink-500 hover:bg-pink-600"
                          }
                        >
                          {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      {getPlatformIcon(platform.id)}
                      <p className="text-lg font-medium mt-4">Select a conversation</p>
                      <p className="text-sm">Choose a contact to view messages</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
