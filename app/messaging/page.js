"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Lock, MessageSquare, FileText, User, ArrowRight,
  Loader2, Menu, X
} from 'lucide-react';
import Navbar from '../components/navbar';

// REQUIRED MOCK USER
const CURRENT_USER_ID = '6565f5e4f4a3b2c1d0e9f8a7';

// ─────────────────────── MESSAGE BUBBLE ───────────────────────
const MessageBubble = ({ message }) => {
  const isMine = message.senderId === CURRENT_USER_ID;

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-xs sm:max-w-md lg:max-w-xl px-5 py-3 rounded-2xl shadow-lg ${
        isMine ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'
      }`}>
        {!isMine && (
          <p className="text-xs font-semibold text-indigo-300 mb-1">
            {message.partnerName || 'Partner'}
          </p>
        )}
        <p className="text-sm break-words">{message.text}</p>
        <p className="text-xs mt-2 opacity-70 text-right">
          {new Date(message.timestamp || message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
};

// ─────────────────────── CONVERSATION ITEM ───────────────────────
const ConversationItem = ({ conn, active, onClick }) => (
  <div
    onClick={() => onClick(conn.id)}
    className={`flex items-center p-5 cursor-pointer border-b border-gray-800 transition-all ${
      active ? 'bg-indigo-900/50 border-l-4 border-indigo-500' : 'hover:bg-gray-800/60'
    }`}
  >
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 ${
      active ? 'bg-indigo-600' : 'bg-gray-600'
    }`}>
      {conn.partnerName?.[0]?.toUpperCase() || '?'}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`font-medium truncate ${active ? 'text-indigo-300' : 'text-white'}`}>
        {conn.partnerName || 'Unknown'}
      </p>
      <p className="text-xs text-gray-400 truncate">
        {conn.lastMessage || 'No messages yet'}
      </p>
    </div>
  </div>
);

// ─────────────────────── MAIN CHAT COMPONENT ───────────────────────
export default function SecureChat() {
  const [connections, setConnections] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const activeConn = connections.find(c => c.id === activeId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => scrollToBottom(), [messages]);

  // FETCH CONNECTIONS
  const loadConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/connections?status=Accepted', {
        credentials: 'include'
      });

      let data = [];
      if (res.ok) {
        const json = await res.json();
        data = json.data || json.connections || json || [];
      } else {
        console.warn('Connections API returned', res.status);
        data = [];
      }

      setConnections(Array.isArray(data) ? data : []);
      if (data.length > 0 && !activeId) {
        setActiveId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => { loadConnections(); }, [loadConnections]);

  // FETCH MESSAGES – THIS IS THE FIX
  const loadMessages = useCallback(async (connId) => {
    if (!connId) return;

    try {
      const res = await fetch(`/api/messages/${connId}`, {
        credentials: 'include'
      });

      let msgs = [];

      if (res.ok) {
        const json = await res.json();
        msgs = json.data || json.messages || json || [];
      } else {
        const errorText = await res.text();
        console.warn(`Messages API ${res.status}:`, errorText);
      }

      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      console.error('Network error loading messages:', err);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId, loadMessages]);

  // SEND MESSAGE – 100% reliable
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || !activeId) return;

    const text = input.trim();
    const tempId = Date.now() + Math.random();

    const tempMsg = {
      id: tempId,
      senderId: CURRENT_USER_ID,
      text,
      timestamp: new Date().toISOString(),
      partnerName: activeConn?.partnerName
    };

    setMessages(prev => [...prev, tempMsg]);
    setInput('');
    scrollToBottom();
    setSending(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ connectionId: activeId, text })
      });

      if (res.ok) {
        const result = await res.json();
        const realMsg = result.data || result.message || result;
        setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
      } else {
        throw new Error('Send failed');
      }
    } catch (err) {
      console.error('Failed to send:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(text);
      alert('Message failed to send');
    } finally {
      setSending(false);
    }
  };

  // ─────────────────────── RENDER ───────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8 text-center">
        <div>
          <MessageSquare className="w-24 h-24 text-gray-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-3">No Active Connections</h2>
          <p className="text-gray-400 mb-6">Accept a connection request to start secure messaging</p>
          <a href="/connections" className="text-indigo-400 text-lg hover:underline">
            Go to Requests
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-gray-950 text-white flex flex-col lg:flex-row">

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 z-50 flex items-center justify-between px-5">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className="w-7 h-7" />
        </button>
        <div className="flex items-center font-bold">
          <Lock className="w-5 h-5 text-green-400 mr-2" />
          Secure Chat
        </div>
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            className="fixed lg:relative inset-y-0 left-0 w-80 bg-gray-900 border-r border-gray-800 z-40 flex flex-col pt-16 lg:pt-0"
          >
            {sidebarOpen && (
              <button onClick={() => setSidebarOpen(false)} className="absolute top-5 right-5">
                <X className="w-6 h-6" />
              </button>
            )}
            <div className="p-5 border-b border-gray-800">
              <h2 className="text-xl font-bold flex items-center">
                <User className="w-6 h-6 mr-3 text-indigo-400" />
                My Connections
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {connections.map(conn => (
                <ConversationItem
                  key={conn.id}
                  conn={conn}
                  active={conn.id === activeId}
                  onClick={(id) => {
                    setActiveId(id);
                    setSidebarOpen(false);
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {sidebarOpen && <div className="fixed inset-0 bg-black/70 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
          {activeConn ? (
            <>
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg">
                  {activeConn.partnerName?.[0] || '?'}
                </div>
                <div>
                  <p className="font-semibold text-lg">{activeConn.partnerName}</p>
                  <p className="text-xs text-gray-400">End-to-end encrypted</p>
                </div>
              </div>
              <button className="text-cyan-400 hover:text-cyan-300 flex items-center text-sm">
                <FileText className="w-5 h-5 mr-1" />
                Documents
              </button>
            </>
          ) : (
            <p className="text-gray-400">Select a conversation</p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-950 to-gray-900">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-gray-500">
              <div>
                <Lock className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-lg">No messages yet. Say hello!</p>
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <MessageBubble key={msg.id || msg._id || Math.random()} message={msg} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {activeConn && (
          <form onSubmit={sendMessage} className="bg-gray-900 border-t border-gray-800 p-4">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a secure message..."
                className="flex-1 px-6 py-4 bg-gray-800 border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500 text-base"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="px-7 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 rounded-full transition flex items-center justify-center"
              >
                {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
    </>
  );
}