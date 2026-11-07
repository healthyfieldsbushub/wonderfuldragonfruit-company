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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface WhatsAppMessage {
  id: string;
  wa_message_id: string | null;
  from_number: string;
  to_number: string | null;
  message_content: string | null;
  message_type: string;
  direction: string;
  status: string | null;
  timestamp: string | null;
  created_at: string | null;
}

interface WhatsAppContact {
  id: string;
  wa_id: string;
  name: string | null;
  phone_number: string | null;
  email: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string | null;
}

export default function WhatsAppInbox() {
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Fetch contacts with latest message
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ["whatsapp-contacts"],
    queryFn: async (): Promise<WhatsAppContact[]> => {
      const { data, error } = await appClient
        .from("whatsapp_contacts")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch messages for selected contact
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["whatsapp-messages", selectedContact],
    queryFn: async (): Promise<WhatsAppMessage[]> => {
      if (!selectedContact) return [];

      const contact = contacts.find((c) => c.id === selectedContact);
      if (!contact) return [];

      const { data, error } = await appClient
        .from("whatsapp_messages")
        .select("*")
        .or(`from_number.eq.${contact.wa_id},to_number.eq.${contact.wa_id}`)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedContact,
  });

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async ({ to, message }: { to: string; message: string }) => {
      const response = await appClient.functions.invoke("whatsapp-webhook", {
        body: {
          action: "send",
          to,
          message,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
      setReplyMessage("");
      toast.success("Message sent!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedContact) return;

    const contact = contacts.find((c) => c.id === selectedContact);
    if (!contact) return;

    setSendingReply(true);
    try {
      await sendReplyMutation.mutateAsync({
        to: contact.wa_id,
        message: replyMessage,
      });
    } finally {
      setSendingReply(false);
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone_number?.includes(searchQuery) ||
      c.wa_id.includes(searchQuery)
  );

  const selectedContactData = contacts.find((c) => c.id === selectedContact);

  const getStatusIcon = (status: string | null) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">WhatsApp Inbox</h1>
          <p className="text-muted-foreground">
            Manage WhatsApp Business conversations
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
            queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Contacts list */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-green-500" />
              Conversations
              <Badge variant="secondary">{contacts.length}</Badge>
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
            <ScrollArea className="h-[calc(100vh-350px)]">
              {loadingContacts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredContacts.map((contact) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedContact === contact.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedContact(contact.id)}
                    >
                      <Avatar>
                        <AvatarFallback className="bg-green-500/20 text-green-700">
                          {contact.name?.[0] || contact.wa_id[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {contact.name || contact.phone_number || contact.wa_id}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.wa_id}
                        </p>
                      </div>
                      {contact.created_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(contact.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="glass-card lg:col-span-2 flex flex-col">
          {selectedContactData ? (
            <>
              {/* Chat header */}
              <CardHeader className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-green-500/20 text-green-700">
                        {selectedContactData.name?.[0] ||
                          selectedContactData.wa_id[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {selectedContactData.name ||
                          selectedContactData.phone_number ||
                          selectedContactData.wa_id}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedContactData.wa_id}
                      </p>
                    </div>
                  </div>
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
                          className={`flex ${
                            msg.direction === "outbound"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.direction === "outbound"
                                ? "bg-green-500 text-white"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.message_content || "[Media]"}
                            </p>
                            <div
                              className={`flex items-center gap-1 mt-1 text-xs ${
                                msg.direction === "outbound"
                                  ? "text-green-100"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {msg.timestamp && (
                                <span>
                                  {new Date(msg.timestamp).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              )}
                              {msg.direction === "outbound" &&
                                getStatusIcon(msg.status)}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </ScrollArea>

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
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {sendingReply ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">
                  Choose a contact to view messages
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
