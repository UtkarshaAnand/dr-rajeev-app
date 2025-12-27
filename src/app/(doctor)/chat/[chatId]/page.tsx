"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useWebSocket } from '@/lib/useWebSocket';

interface Message {
  id: string;
  sender: 'patient' | 'doctor';
  content: string;
  created_at: string;
}

interface IntakeData {
  age: number | null;
  sex: string | null;
  complaint: string | null;
  duration: string | null;
  emergency: boolean | null;
  emergency_symptoms: string[] | null;
  conditions: string | null;
  medications: string | null;
}

export default function DoctorChat() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.chatId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [intake, setIntake] = useState<IntakeData | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPatientTyping, setIsPatientTyping] = useState(false);
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
    if (sender === 'patient') {
      setIsPatientTyping(isTyping);
    }
  }, []);

  // Initialize WebSocket connection
  const { isConnected, connectionStatus, sendTyping, sendStopTyping } = useWebSocket({
    chatId,
    sender: 'doctor',
    enabled: !!chatId,
    onMessage: handleWebSocketMessage,
    onTyping: handleTyping,
    fallbackToPolling: true,
    pollingInterval: 2000,
  });


  // Handle input changes for typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
    // Send typing indicator
    if (e.target.value.trim().length > 0) {
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

  useEffect(() => {
    loadMessages();
    loadIntake();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/messages?chatId=${chatId}`);
      if (response.status === 401) {
        router.push('/login');
        return;
      }

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

  const loadIntake = async () => {
    try {
      const response = await fetch(`/api/intake?chatId=${chatId}`);
      const data = await response.json();
      if (data.intake) {
        setIntake(data.intake);
      }
    } catch (error) {
      console.error('Failed to load intake:', error);
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

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          sender: 'doctor',
          content,
        }),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

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
      console.error('[Doctor Chat] Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/inbox"
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back to Inbox</span>
          </Link>
          <h2 className="text-lg font-semibold text-gray-900">
            Chat #{chatId.slice(0, 8)}
          </h2>
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Live
              </span>
            )}
            {connectionStatus === 'polling' && (
              <span className="text-xs text-yellow-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Polling
              </span>
            )}
            {connectionStatus === 'connecting' && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                Connecting
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Intake summary */}
      {intake && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h3 className="font-semibold text-blue-900 mb-2">Patient Intake Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {intake.age && (
                <div>
                  <span className="text-blue-700 font-medium">Age:</span>{' '}
                  <span className="text-blue-900">{intake.age}</span>
                </div>
              )}
              {intake.sex && (
                <div>
                  <span className="text-blue-700 font-medium">Sex:</span>{' '}
                  <span className="text-blue-900">{intake.sex}</span>
                </div>
              )}
              {intake.complaint && (
                <div className="col-span-2">
                  <span className="text-blue-700 font-medium">Complaint:</span>{' '}
                  <span className="text-blue-900">{intake.complaint}</span>
                </div>
              )}
              {intake.duration && (
                <div>
                  <span className="text-blue-700 font-medium">Duration:</span>{' '}
                  <span className="text-blue-900">{intake.duration}</span>
                </div>
              )}
              {intake.emergency && (
                <div className="col-span-2">
                  <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                    EMERGENCY: {intake.emergency_symptoms?.join(', ')}
                  </span>
                </div>
              )}
              {intake.conditions && (
                <div className="col-span-2">
                  <span className="text-blue-700 font-medium">Conditions:</span>{' '}
                  <span className="text-blue-900">{intake.conditions}</span>
                </div>
              )}
              {intake.medications && (
                <div className="col-span-2">
                  <span className="text-blue-700 font-medium">Medications:</span>{' '}
                  <span className="text-blue-900">{intake.medications}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'doctor' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.sender === 'doctor'
                    ? 'bg-[#017CA6]/20 text-gray-900'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender === 'doctor'
                      ? 'text-gray-600'
                      : 'text-gray-600'
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
          {isPatientTyping && (
            <div className="flex justify-start">
              <div className="px-4 py-1">
                <span className="text-xs text-gray-600 italic">Patient is typing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#017CA6] text-gray-900 bg-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 bg-[#017CA6] text-white rounded-full hover:bg-[#016a8f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
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
      </div>
    </div>
  );
}

