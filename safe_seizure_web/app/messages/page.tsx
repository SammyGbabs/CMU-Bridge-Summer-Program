'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Send, Plus, Search, Clock, User } from 'lucide-react';
import { Sidebar, defaultSidebarItems } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { StatusBadge } from '@/components/status-badge';
import { PatientAvatar } from '@/components/patient-avatar';
import {
  listConversations,
  listMessages,
  sendMessage,
  getUnreadMessageCount,
  markConversationRead,
  ConversationWithPatient,
} from '@/lib/supabase/messages';
import { getActiveAlertCount } from '@/lib/supabase/alerts';
import { StartConversationModal } from '@/components/messages/start-conversation-modal';
import { Message } from '@/lib/types';
import { useDoctor } from '@/lib/supabase/use-doctor';

export default function MessagesPage() {
  const { doctor, signOut } = useDoctor();
  const [conversations, setConversations] = useState<ConversationWithPatient[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, Message[]>
  >({});
  const [selectedConversation, setSelectedConversation] = useState<string | undefined>();
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isStartOpen, setIsStartOpen] = useState(false);

  useEffect(() => {
    if (!doctor) return;
    let isMounted = true;

    Promise.all([
      listConversations(doctor.id),
      getActiveAlertCount(),
      getUnreadMessageCount(doctor.id),
    ])
      .then(async ([convs, alertCount, messageCount]) => {
        if (!isMounted) return;
        setConversations(convs);
        setActiveAlertCount(alertCount);
        setUnreadMessageCount(messageCount);
        setSelectedConversation((prev) => prev ?? convs[0]?.id);

        const messageLists = await Promise.all(convs.map((c) => listMessages(c.id)));
        if (!isMounted) return;

        const map: Record<string, Message[]> = {};
        convs.forEach((c, i) => {
          map[c.id] = messageLists[i];
        });
        setMessagesByConversation(map);
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load conversations.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [doctor]);

  /* Mark the opened conversation's messages as read and refresh the unread badge */
  useEffect(() => {
    if (!doctor || !selectedConversation || isLoading) return;

    const hasUnread = (messagesByConversation[selectedConversation] ?? []).some(
      (m) => !m.isRead && m.senderId !== doctor.id
    );
    if (!hasUnread) return;

    let isMounted = true;

    markConversationRead(selectedConversation)
      .then(() => {
        if (!isMounted) return;
        setMessagesByConversation((prev) => ({
          ...prev,
          [selectedConversation]: (prev[selectedConversation] ?? []).map((m) => ({
            ...m,
            isRead: true,
          })),
        }));
        return getUnreadMessageCount(doctor.id);
      })
      .then((count) => {
        if (isMounted && count !== undefined) setUnreadMessageCount(count);
      });

    return () => {
      isMounted = false;
    };
  }, [doctor, selectedConversation, isLoading, messagesByConversation]);

  /* Get conversations with latest message preview */
  const conversationsWithPreview = useMemo(() => {
    return conversations.map((conv) => {
      const convMessages = messagesByConversation[conv.id] ?? [];
      const lastMessage = convMessages[convMessages.length - 1];
      return {
        ...conv,
        lastMessage: lastMessage?.content || 'No messages yet',
      };
    });
  }, [conversations, messagesByConversation]);

  /* Filter conversations */
  const filteredConversations = conversationsWithPreview.filter((conv) =>
    conv.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = messagesByConversation[selectedConversation ?? ''] ?? [];
  const currentConversation = conversationsWithPreview.find(
    (c) => c.id === selectedConversation
  );

  const handleConversationStarted = (conversation: ConversationWithPatient) => {
    setConversations((prev) => {
      if (prev.some((c) => c.id === conversation.id)) return prev;
      return [conversation, ...prev];
    });
    setMessagesByConversation((prev) => ({
      ...prev,
      [conversation.id]: prev[conversation.id] ?? [],
    }));
    setSelectedConversation(conversation.id);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !doctor || isSending) return;

    setIsSending(true);
    try {
      const sent = await sendMessage({
        conversationId: selectedConversation,
        senderId: doctor.id,
        senderName: doctor.name,
        senderRole: 'doctor',
        content: messageInput.trim(),
      });

      setMessagesByConversation((prev) => ({
        ...prev,
        [selectedConversation]: [...(prev[selectedConversation] ?? []), sent],
      }));
      setMessageInput('');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        items={defaultSidebarItems}
        onLogout={signOut}
        alertCount={activeAlertCount}
        messageCount={unreadMessageCount}
      />
      <div className="flex-1 flex flex-col">
        <Header doctorName={doctor?.name ?? 'Doctor'} notificationCount={activeAlertCount} onLogout={signOut} />

        <main className="flex-1 overflow-hidden flex">
          {/* Conversations List */}
          <div className="w-full lg:w-96 border-r border-border bg-card flex flex-col">
            {/* Search & Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-primary" />
                  Messages
                </h2>
                <button
                  onClick={() => setIsStartOpen(true)}
                  title="New conversation"
                  aria-label="New conversation"
                  className="p-2 rounded-lg hover:bg-secondary transition-colors text-primary"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {isLoading ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground text-sm">Loading conversations...</p>
                </div>
              ) : loadError ? (
                <div className="p-8 text-center">
                  <p className="text-destructive text-sm">{loadError}</p>
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-secondary/50 transition flex items-start gap-3 ${
                      selectedConversation === conv.id ? 'bg-secondary/50 border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <PatientAvatar patient={conv.patient!} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold text-foreground truncate">{conv.patient?.name}</p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(conv.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm mb-3">
                    {conversations.length === 0
                      ? "You haven't started any conversations yet."
                      : 'No conversations found'}
                  </p>
                  {conversations.length === 0 && (
                    <button
                      onClick={() => setIsStartOpen(true)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Start a conversation
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat View */}
          <div className="hidden lg:flex flex-1 flex-col bg-background">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PatientAvatar patient={currentConversation.patient!} size="md" />
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {currentConversation.patient?.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {currentConversation.patient?.status === 'alert' ? (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500" /> In alert
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500" /> Online
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {currentMessages.length > 0 ? (
                    currentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === doctor?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.senderId === doctor?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-foreground'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t border-border bg-card px-6 py-4">
                  <div className="flex items-end gap-3">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={isSending}
                      className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isSending}
                      className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {isLoading ? 'Loading...' : 'Select a conversation to start messaging'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {doctor && (
        <StartConversationModal
          open={isStartOpen}
          onClose={() => setIsStartOpen(false)}
          onStarted={handleConversationStarted}
          doctorId={doctor.id}
          existingPatientIds={conversations.map((c) => c.patientId)}
        />
      )}
    </div>
  );
}
