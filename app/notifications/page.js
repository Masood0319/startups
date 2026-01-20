"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bell, MessageSquare, CheckCircle, Clock, Loader2 } from 'lucide-react';
import Navbar from '../components/navbar';

// Mock User ID used across the application
const CURRENT_USER_ID_MOCK = '6565f5e4f4a3b2c1d0e9f8a7'; 
const PARTNER_ID_1 = '6565f5e4f4a3b2c1d0e9f8a8';

// --- START: Merged MOCK SOCKET.IO CLIENT Logic ---

/**
 * Mock Socket.IO instance (Self-contained implementation)
 * It simulates the key methods: on, off, and emit.
 */
const mockSocket = (() => {
    // Stores event listeners attached by the client
    const listeners = {};
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Simple handler to simulate the server acknowledging and broadcasting
    const serverHandler = async (event, data) => {
        if (event === 'send_message') {
            const { connectionId, senderId, text } = data;
            
            // 1. Simulate network delay before server processes
            await delay(500); 

            // 2. Simulate the server broadcasting the sender's message back (confirmation/receipt)
            const senderReceivedMessage = {
                id: data.tempId || 'mock-realtime-msg-' + Date.now(),
                connectionId,
                senderId,
                text,
                timestamp: new Date().toISOString(),
                isRealTime: true, 
                partnerName: 'You'
            };
            listeners['receive_message']?.(senderReceivedMessage);
            
            // Emit a notification for the message sent confirmation
            listeners['new_notification']?.({
                id: 'notif-send-' + Date.now() + '-A',
                type: 'message_sent',
                content: `Your message was delivered to connection ID ${connectionId}.`,
                timestamp: new Date().toISOString(),
                isRead: false
            });
            
            // 3. Simulate the other party automatically responding after a short delay
            if (connectionId === 'deal-xyz') {
                 await delay(800);
                 const partnerMessage = {
                    id: 'partner-response-' + Date.now() + '-R',
                    connectionId,
                    senderId: PARTNER_ID_1, 
                    text: `[Auto-Reply from Partner]: I received your message: "${text.substring(0, 20)}...". I'll review your docs now.`,
                    timestamp: new Date().toISOString(),
                    isRealTime: true,
                    partnerName: 'Alexandra Chen (Ascent)' // Explicitly set partner name for immediate display
                 };
                 listeners['receive_message']?.(partnerMessage);

                // Emit a notification for the simulated partner response
                listeners['new_notification']?.({
                    id: 'notif-receive-' + Date.now() + '-B',
                    type: 'new_message',
                    content: `New message received from Alexandra Chen (Ascent) in connection ID ${connectionId}.`,
                    timestamp: new Date().toISOString(),
                    isRead: false
                });
            }
        }
    };

    return {
        id: 'mock-socket-id-1234',

        on: (event, callback) => {
            listeners[event] = callback;
        },

        off: (event) => {
            delete listeners[event];
        },

        emit: (event, data) => {
            console.log(`Socket EMIT: ${event}`, data);
            serverHandler(event, data);
        },

        connected: true
    };
})();

/**
 * Main connection function (replaces the external import).
 */
const connectSocket = (userId, connectionId) => {
    console.log(`[Socket.IO Mock] Attempting connection for User: ${userId}, Connection: ${connectionId}`);
    
    // Simulate successful initial connection event
    setTimeout(() => {
        // Since the notifications page doesn't have a connectionId context, 
        // we pass 'general' here for connection establishment.
        mockSocket.on('connect')?.({ userId, connectionId: connectionId || 'general' });
    }, 100);

    return mockSocket;
};
// --- END: Merged MOCK SOCKET.IO CLIENT Logic ---


/**
 * Utility to format timestamp difference
 */
const timeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};

/**
 * Notification Item Component
 */
const NotificationItem = ({ notification }) => {
    const { type, content, timestamp, isRead } = notification;

    const iconMap = {
        new_message: MessageSquare,
        message_sent: CheckCircle,
        // Add more types here (e.g., connection_accepted)
        default: Bell
    };

    const Icon = iconMap[type] || iconMap.default;
    
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start p-4 mb-3 rounded-xl shadow-lg border transition duration-300 ${
                isRead 
                    ? 'bg-gray-800 border-gray-700 text-gray-400 opacity-80' 
                    : 'bg-gray-900 border-indigo-600/50 text-white hover:bg-gray-800'
            }`}
        >
            <div className={`p-3 rounded-full ${isRead ? 'bg-gray-700' : 'bg-indigo-600'} flex-shrink-0 mr-4`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
                <p className={`text-sm font-medium ${isRead ? 'text-gray-400' : 'text-white'}`}>
                    {content}
                </p>
                <div className="flex items-center text-xs mt-1 text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{timeAgo(timestamp)}</span>
                </div>
            </div>
            {!isRead && (
                <span className="w-2 h-2 bg-red-500 rounded-full ml-4 flex-shrink-0 mt-2" title="New"></span>
            )}
        </motion.div>
    );
};


/**
 * Main Notifications Page Component
 */
const NotificationsPage = () => {
    // Initial mock notifications
    const [notifications, setNotifications] = useState([
        { id: 'notif-001', type: 'system', content: 'Welcome! Real-time notifications are active.', timestamp: new Date(Date.now() - 3600000).toISOString(), isRead: true },
        { id: 'notif-002', type: 'connection', content: 'John Smith (SeedFund) accepted your connection request.', timestamp: new Date(Date.now() - 1800000).toISOString(), isRead: false },
    ]);
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const listRef = useRef(null);

    // Initial setup for the mock socket
    useEffect(() => {
        // We use a generic connection ID 'notifications' here as the context is global
        const newSocket = connectSocket(CURRENT_USER_ID_MOCK, 'notifications'); 
        setSocket(newSocket);
        setLoading(false);

        const onConnect = () => {
            console.log("Notifications socket connected.");
            setError(null);
        };

        const onDisconnect = () => {
            console.log("Notifications socket disconnected.");
            setError("Disconnected from real-time service. Notifications may be delayed.");
        };

        const onNewNotification = (notification) => {
            console.log("Received new notification:", notification);
            // Prepend new notification to the list
            setNotifications(prev => [notification, ...prev]);
        };

        newSocket.on('connect', onConnect);
        newSocket.on('disconnect', onDisconnect);
        newSocket.on('new_notification', onNewNotification);

        return () => {
            newSocket.off('connect', onConnect);
            newSocket.off('disconnect', onDisconnect);
            newSocket.off('new_notification', onNewNotification);
            // No newSocket.disconnect() for mock
        };
    }, []);

    // Scroll to the top when new items are added (optional UX)
    useEffect(() => {
        listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [notifications.length]);


    const handleMarkAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }, []);

    return (
        <>
        <Navbar/>
        <div className="min-h-screen bg-gray-950 text-white pt-16 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6">
                    <h1 className="text-3xl font-bold flex items-center">
                        <Bell className="w-7 h-7 mr-3 text-indigo-400" />
                        Notifications
                        {notifications.some(n => !n.isRead) && (
                            <span className="ml-3 text-sm font-extrabold bg-red-600 text-white rounded-full h-6 px-3 flex items-center justify-center">
                                {notifications.filter(n => !n.isRead).length} New
                            </span>
                        )}
                    </h1>
                    <motion.button
                        onClick={handleMarkAllRead}
                        className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-500 transition disabled:bg-gray-700 disabled:text-gray-500"
                        disabled={!notifications.some(n => !n.isRead)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Mark all as read
                    </motion.button>
                </header>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="p-3 bg-red-900 border border-red-700 rounded-lg mb-4 text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center p-12 text-indigo-400">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Connecting to real-time service...
                    </div>
                ) : (
                    <div ref={listRef} className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
                        {notifications.length > 0 ? (
                            notifications.map(n => <NotificationItem key={n.id} notification={n} />)
                        ) : (
                            <div className="p-12 text-center text-gray-500 bg-gray-900 rounded-xl mt-4">
                                You are all caught up! No recent notifications.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default NotificationsPage;