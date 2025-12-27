"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import IntakeFlow from './IntakeFlow';
import { useWebSocket } from '@/lib/useWebSocket';

interface Message {
  id: string;
  sender: 'patient' | 'doctor';
  content: string;
  created_at: string;
}

interface ChatWindowProps {
  chatId: string | null;
  onClose: () => void;
  onChatCreated?: (chatId: string) => void;
  buttonPosition?: { bottom: number; right: number };
}

export default function ChatWindow({ chatId, onClose, onChatCreated, buttonPosition = { bottom: 24, right: 24 } }: ChatWindowProps) {
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [isIntakeActive, setIsIntakeActive] = useState(false);
  const [isDoctorTyping, setIsDoctorTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesMapRef = useRef<Map<string, Message>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize the onMessage callback to prevent re-renders
  const handleWebSocketMessage = useCallback((wsMessage: any) => {
    if (wsMessage.type === 'message' && wsMessage.message) {
      const newMessage = wsMessage.message as Message;
      // Only add if we don't already have this message
      if (!messagesMapRef.current.has(newMessage.id)) {
        messagesMapRef.current.set(newMessage.id, newMessage);
        setMessages(Array.from(messagesMapRef.current.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ));
      }
    }
  }, []);

  // Handle typing indicator
  const handleTyping = useCallback((sender: 'patient' | 'doctor', isTyping: boolean) => {
    if (sender === 'doctor') {
      setIsDoctorTyping(isTyping);
    }
  }, []);

  // Initialize WebSocket connection
  const { isConnected, connectionStatus, sendTyping, sendStopTyping } = useWebSocket({
    chatId: currentChatId,
    sender: 'patient',
    enabled: !!currentChatId && intakeComplete,
    onMessage: handleWebSocketMessage,
    onTyping: handleTyping,
    fallbackToPolling: true,
    pollingInterval: 2000,
  });

  // Handle input changes for typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Send typing indicator
    if (value.trim().length > 0) {
      sendTyping();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Send stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTyping();
      }, 3000);
    } else {
      sendStopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Update currentChatId when prop changes
  useEffect(() => {
    setCurrentChatId(chatId);
  }, [chatId]);

  useEffect(() => {
    if (!currentChatId) {
      // No chat yet - show intake flow
      setIsIntakeActive(true);
      setIntakeComplete(false);
      return;
    }

    // Chat exists - load messages and check intake status
    loadMessages();
    checkIntakeStatus();
  }, [currentChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!currentChatId) return;
    try {
      const response = await fetch(`/api/messages?chatId=${currentChatId}`);
      const data = await response.json();
      if (data.messages) {
        // Update messages map
        data.messages.forEach((msg: Message) => {
          messagesMapRef.current.set(msg.id, msg);
        });
        setMessages(Array.from(messagesMapRef.current.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const checkIntakeStatus = async () => {
    if (!currentChatId) return;
    try {
      const response = await fetch(`/api/intake?chatId=${currentChatId}`);
      const data = await response.json();
      if (data.completed) {
        setIntakeComplete(true);
        setIsIntakeActive(false);
      } else {
        setIsIntakeActive(true);
      }
    } catch (error) {
      console.error('Failed to check intake status:', error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Stop typing indicator
    sendStopTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const content = input.trim();
    setInput('');
    setIsLoading(true);

      if (!currentChatId) return;
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: currentChatId,
            sender: 'patient',
            content,
          }),
        });

      if (response.ok) {
        const data = await response.json();
        // If WebSocket isn't connected, add the message immediately to UI
        if (!isConnected && data.message) {
          const sentMessage = data.message as Message;
          if (!messagesMapRef.current.has(sentMessage.id)) {
            messagesMapRef.current.set(sentMessage.id, sentMessage);
            setMessages(Array.from(messagesMapRef.current.values()).sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            ));
          }
        }
        // Always reload to ensure consistency
        await loadMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntakeComplete = (newChatId: string) => {
    setCurrentChatId(newChatId);
    setIntakeComplete(true);
    setIsIntakeActive(false);
    if (onChatCreated) {
      onChatCreated(newChatId);
    }
    loadMessages();
  };

  // Calculate position above the button
  const windowHeight = 600; // Height of chat window
  const windowWidth = 380; // Width of chat window
  const spacing = 16; // Space between button and window
  const buttonSize = 56; // Size of chat button (w-14 h-14 = 56px)
  
  const bottomPosition = buttonPosition.bottom + buttonSize + spacing;
  const rightPosition = buttonPosition.right;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      
      {/* Chat window positioned above button */}
      <div 
        className="fixed z-50 bg-white rounded-2xl shadow-2xl flex flex-col w-[380px] max-w-[calc(100vw-32px)] sm:w-[380px]"
        style={{
          bottom: `${bottomPosition}px`,
          right: `${rightPosition}px`,
          height: `${windowHeight}px`,
          maxHeight: 'calc(100vh - 120px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#017CA6] to-[#016a8f] text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Dr. Rajeev Ranjan</h3>
              <p className="text-xs text-white/80">
                Usually replies in a few minutes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            aria-label="Close chat"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3">
          {isIntakeActive && !intakeComplete && (
            <IntakeFlow chatId={currentChatId} onComplete={handleIntakeComplete} />
          )}

          {messages.length === 0 && intakeComplete && (
            <div className="text-center py-8 text-gray-500 text-sm">
              <p>Start a conversation with the doctor</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'patient' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  message.sender === 'patient'
                    ? 'bg-[#017CA6]/20 text-gray-900 rounded-br-sm'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <p
                  className={`text-xs mt-1.5 ${
                    message.sender === 'patient'
                      ? 'text-gray-600'
                      : 'text-gray-500'
                  }`}
                >
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          {isDoctorTyping && (
            <div className="flex justify-start">
              <div className="px-2 py-1">
                <span className="text-xs text-gray-400 italic">Dr. Rajeev is typing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        {intakeComplete && (
          <form onSubmit={handleSend} className="border-t border-gray-200 bg-white p-3 rounded-b-2xl">
            <div className="flex gap-2 items-end w-full">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="flex-1 w-full px-4 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#017CA6] focus:border-transparent text-sm text-gray-900 bg-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 bg-[#017CA6] text-white rounded-2xl hover:bg-[#016a8f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                aria-label="Send message"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

