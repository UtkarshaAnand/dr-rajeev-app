"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatWindow from '../components/ChatWindow';

export default function ChatPage() {
  const router = useRouter();
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    // Get chat ID from localStorage or create new one
    const storedChatId = localStorage.getItem('dr_rajeev_chat_id');
    const storedExpiry = localStorage.getItem('dr_rajeev_chat_expiry');

    if (storedChatId && storedExpiry) {
      const expiryDate = new Date(storedExpiry);
      if (expiryDate > new Date()) {
        setChatId(storedChatId);
        return;
      }
    }

    // Create new chat
    fetch('/api/chats', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.chatId) {
          setChatId(data.chatId);
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 7);
          localStorage.setItem('dr_rajeev_chat_id', data.chatId);
          localStorage.setItem('dr_rajeev_chat_expiry', expiryDate.toISOString());
        }
      })
      .catch((error) => {
        console.error('Failed to create chat:', error);
      });
  }, []);

  if (!chatId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ChatWindow
        chatId={chatId}
        onClose={() => router.push('/')}
      />
    </div>
  );
}

