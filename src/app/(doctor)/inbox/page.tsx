"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Chat {
  id: string;
  created_at: string;
  expires_at: string;
  status: string;
  last_message?: {
    content: string;
    created_at: string;
  };
  intake?: {
    age: number | null;
    sex: string | null;
    complaint: string | null;
    emergency: boolean | null;
  };
}

export default function DoctorInbox() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadChats = async () => {
    try {
      const response = await fetch('/api/doctor/inbox');
      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (data.chats) {
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
      setError('Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/doctor/logout', { method: 'POST' });
    router.push('/login');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#017CA6] rounded-full flex items-center justify-center">
              <span className="text-white font-bold">RR</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Inbox</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Chat list */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {chats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No active chats</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Chat #{chat.id.slice(0, 8)}
                      </span>
                      {chat.intake?.emergency && (
                        <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                          EMERGENCY
                        </span>
                      )}
                    </div>

                    {chat.intake && (
                      <div className="text-sm text-gray-600 mb-2">
                        {chat.intake.age && chat.intake.sex && (
                          <span>
                            {chat.intake.age}yo {chat.intake.sex}
                          </span>
                        )}
                        {chat.intake.complaint && (
                          <span className="ml-2">• {chat.intake.complaint}</span>
                        )}
                      </div>
                    )}

                    {chat.last_message && (
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {chat.last_message.content}
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 ml-4">
                    {formatTime(chat.last_message?.created_at || chat.created_at)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

