// Client-side WebSocket hook with reconnection logic and polling fallback
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: 'joined' | 'message' | 'error' | 'ping' | 'pong' | 'typing' | 'stop_typing';
  chatId?: string;
  sender?: 'patient' | 'doctor';
  content?: string;
  message?: any;
}

interface UseWebSocketOptions {
  chatId: string | null;
  sender: 'patient' | 'doctor';
  enabled?: boolean;
  onMessage?: (message: any) => void;
  onTyping?: (sender: 'patient' | 'doctor', isTyping: boolean) => void;
  onError?: (error: Error) => void;
  fallbackToPolling?: boolean;
  pollingInterval?: number;
}

export function useWebSocket({
  chatId,
  sender,
  enabled = true,
  onMessage,
  onTyping,
  onError,
  fallbackToPolling = true,
  pollingInterval = 2000,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'polling'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // Start with 1 second
  
  // Store callbacks in refs to avoid dependency issues
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onErrorRef = useRef(onError);
  
  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onTypingRef.current = onTyping;
    onErrorRef.current = onError;
  }, [onMessage, onTyping, onError]);

  // Get WebSocket URL - use wss in production, ws in development
  const getWebSocketUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.hostname;
    const port = process.env.NEXT_PUBLIC_WS_PORT || '3001';
    
    // In production on Render, WebSocket might be on the same port
    // Try to detect if we're in production
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_WS_PORT) {
      return `${protocol}//${host}/ws`;
    }
    
    return `${protocol}//${host}:${port}`;
  }, []);

  // Track last message timestamp for polling
  const lastMessageTimeRef = useRef<number>(0);

  // Polling fallback
  const startPolling = useCallback(() => {
    if (!chatId || isPollingRef.current || !fallbackToPolling) return;
    
    isPollingRef.current = true;
    setConnectionStatus('polling');
    
    const poll = async () => {
      if (!chatId) return;
      
      try {
        const response = await fetch(`/api/messages?chatId=${chatId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages && onMessageRef.current) {
            // Check for new messages (after last known message time)
            const newMessages = data.messages.filter((msg: any) => {
              const msgTime = new Date(msg.created_at).getTime();
              return msgTime > lastMessageTimeRef.current;
            });
            
            if (newMessages.length > 0) {
              // Update last message time
              const latestTime = Math.max(...newMessages.map((msg: any) => 
                new Date(msg.created_at).getTime()
              ));
              lastMessageTimeRef.current = latestTime;
              
              // Notify about new messages
              newMessages.forEach((msg: any) => {
                onMessageRef.current?.({
                  type: 'message',
                  message: msg,
                });
              });
            }
            
            // Also update baseline if no new messages but we have messages
            if (data.messages.length > 0 && lastMessageTimeRef.current === 0) {
              const latestTime = Math.max(...data.messages.map((msg: any) => 
                new Date(msg.created_at).getTime()
              ));
              lastMessageTimeRef.current = latestTime;
            }
          }
        }
      } catch (error) {
        console.error('[WebSocket] Polling error:', error);
      }
    };

    // Initial poll to get current messages and set baseline
    (async () => {
      if (!chatId) return;
      try {
        const response = await fetch(`/api/messages?chatId=${chatId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            const latestTime = Math.max(...data.messages.map((msg: any) => 
              new Date(msg.created_at).getTime()
            ));
            lastMessageTimeRef.current = latestTime;
          }
        }
      } catch (error) {
        console.error('[WebSocket] Initial poll error:', error);
      }
    })();

    pollIntervalRef.current = setInterval(poll, pollingInterval);
  }, [chatId, fallbackToPolling, pollingInterval]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!chatId || !enabled) {
      return;
    }

    // Prevent duplicate connections
    if (wsRef.current) {
      const state = wsRef.current.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        return;
      }
      // Clean up existing connection if it's in a bad state
      if (state === WebSocket.CLOSING || state === WebSocket.CLOSED) {
        wsRef.current = null;
      }
    }

    const url = getWebSocketUrl();
    if (!url) {
      startPolling();
      return;
    }

    setConnectionStatus('connecting');

    // Ensure WebSocket server is initialized by calling the API
    // This is a best-effort attempt - don't wait for it
    fetch('/api/ws').catch(() => {
      // Ignore errors - server will initialize on first message API call
    });

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        stopPolling();

        // Join the chat immediately upon connection
        if (chatId) {
          const joinMessage = {
            type: 'join',
            chatId,
            sender,
          };
          ws.send(JSON.stringify(joinMessage));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'pong') {
            // Heartbeat response
            return;
          }

          if (message.type === 'joined') {
            return;
          }

          if (message.type === 'message' && onMessageRef.current) {
            // Update last message time to prevent duplicate polling
            if (message.message?.created_at) {
              const msgTime = new Date(message.message.created_at).getTime();
              if (msgTime > lastMessageTimeRef.current) {
                lastMessageTimeRef.current = msgTime;
              }
            }
            // Call the message handler
            onMessageRef.current(message);
          }

          if (message.type === 'typing' && onTypingRef.current && message.sender) {
            onTypingRef.current(message.sender, true);
          }

          if (message.type === 'stop_typing' && onTypingRef.current && message.sender) {
            onTypingRef.current(message.sender, false);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error, event.data);
        }
      };

      ws.onerror = (error) => {
        // Extract more information from the error event
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'WebSocket connection error';
        const errorDetails = {
          message: errorMessage,
          type: error.type || 'unknown',
          target: error.target ? (error.target as WebSocket).url : 'unknown',
        };
        console.error('[WebSocket] Connection error:', errorDetails);
        // Don't call onError here - onclose will handle it
        // This prevents double error handling
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        wsRef.current = null;

        // Clear backup polling interval
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }

        // Handle different close codes
        const isNormalClosure = event.code === 1000;

        if (onErrorRef.current && !isNormalClosure) {
          onErrorRef.current(new Error(`WebSocket closed: ${event.code} ${event.reason || 'Connection lost'}`));
        }

        // Attempt to reconnect if not a normal closure and haven't exceeded max attempts
        if (!isNormalClosure && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          // Max attempts reached or normal closure, fall back to polling
          startPolling();
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      setConnectionStatus('disconnected');
      if (onErrorRef.current) {
        onErrorRef.current(error as Error);
      }
      startPolling();
    }
  }, [chatId, sender, enabled, getWebSocketUrl, startPolling, stopPolling]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopPolling();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnecting');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, [stopPolling]);

  // Send message via WebSocket
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        ...message,
      }));
      return true;
    }
    return false;
  }, []);

  // Send typing indicator
  const sendTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && chatId) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        chatId,
        sender,
      }));
      return true;
    }
    return false;
  }, [chatId, sender]);

  // Send stop typing indicator
  const sendStopTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && chatId) {
      wsRef.current.send(JSON.stringify({
        type: 'stop_typing',
        chatId,
        sender,
      }));
      return true;
    }
    return false;
  }, [chatId, sender]);

  // Effect to manage connection
  useEffect(() => {
    // Reset last message time when chatId changes
    lastMessageTimeRef.current = 0;
    reconnectAttemptsRef.current = 0;
    
    if (chatId && enabled) {
      // Small delay to prevent rapid reconnections
      const timeoutId = setTimeout(() => {
        connect();
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        disconnect();
      };
    } else {
      disconnect();
      return () => {
        disconnect();
      };
    }
  }, [chatId, enabled]); // Only depend on chatId and enabled, not callbacks

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
    sendStopTyping,
  };
}

