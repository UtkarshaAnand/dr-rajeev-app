"use client";

import { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing chat in localStorage and verify it exists in database
    const storedChatId = localStorage.getItem('dr_rajeev_chat_id');
    const storedExpiry = localStorage.getItem('dr_rajeev_chat_expiry');

    if (storedChatId && storedExpiry) {
      const expiryDate = new Date(storedExpiry);
      if (expiryDate > new Date()) {
        // Verify chat exists in database
        fetch(`/api/chats?chatId=${storedChatId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.chat) {
              setChatId(storedChatId);
            } else {
              // Chat doesn't exist, clear storage
              localStorage.removeItem('dr_rajeev_chat_id');
              localStorage.removeItem('dr_rajeev_chat_expiry');
            }
          })
          .catch(() => {
            // Error verifying, clear storage to be safe
            localStorage.removeItem('dr_rajeev_chat_id');
            localStorage.removeItem('dr_rajeev_chat_expiry');
          });
      } else {
        // Expired, clear storage
        localStorage.removeItem('dr_rajeev_chat_id');
        localStorage.removeItem('dr_rajeev_chat_expiry');
      }
    }
  }, []);

  const handleOpen = () => {
    // Just open the chat window - chat will be created after intake completes
    setIsOpen(true);
  };

  const handleChatCreated = (newChatId: string) => {
    // Chat was created after intake completion
    setChatId(newChatId);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    localStorage.setItem('dr_rajeev_chat_id', newChatId);
    localStorage.setItem('dr_rajeev_chat_expiry', expiryDate.toISOString());
  };

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#017CA6]/20 text-[#017CA6] rounded-full shadow-lg hover:bg-[#017CA6] hover:text-white transition-colors flex items-center justify-center"
        aria-label="Open chat"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {/* Chat window */}
      {isOpen && (
        <ChatWindow 
          chatId={chatId} 
          onClose={() => setIsOpen(false)}
          onChatCreated={handleChatCreated}
          buttonPosition={{ bottom: 24, right: 24 }}
        />
      )}
    </>
  );
}

