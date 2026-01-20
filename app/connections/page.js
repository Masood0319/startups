"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Send, Clock, CheckCircle, Users, UserPlus, MessageCircle, Trash2, Check, XCircle } from 'lucide-react';

// Main Connections Page Component
const ConnectionsPage = () => {
    const [activeTab, setActiveTab] = useState('invitations');
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUserId] = useState('current-user-id'); // Replace with actual user ID from auth

    useEffect(() => {
        fetchConnections();
    }, [activeTab]);

    const fetchConnections = async () => {
        setLoading(true);
        try {
            const status = activeTab === 'connections' ? 'accepted' : 'requested';
            const response = await fetch(`/api/connections?status=${status}`);
            if (!response.ok) throw new Error('Failed to fetch connections');
            const data = await response.json();
            setConnections(data);
        } catch (error) {
            console.error('Error fetching connections:', error);
            setConnections([]);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'invitations', label: 'Invitations', icon: UserPlus },
        { id: 'sent', label: 'Sent', icon: Send },
        { id: 'connections', label: 'Connections', icon: Users },
    ];

    const filteredConnections = connections.filter(conn => {
        if (activeTab === 'invitations') {
            return conn.status === 'requested' && conn.receiverId === currentUserId;
        }
        if (activeTab === 'sent') {
            return conn.status === 'requested' && conn.senderId === currentUserId;
        }
        return conn.status === 'accepted';
    });

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
                            <Users className="w-8 h-8 text-indigo-400" />
                            <span>My Network</span>
                        </h1>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition flex items-center space-x-2"
                        >
                            <UserPlus className="w-5 h-5" />
                            <span>Connect</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-gray-900 border-b border-gray-800">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="flex space-x-8">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const count = connections.filter(conn => {
                                if (tab.id === 'invitations') {
                                    return conn.status === 'requested' && conn.receiverId === currentUserId;
                                }
                                if (tab.id === 'sent') {
                                    return conn.status === 'requested' && conn.senderId === currentUserId;
                                }
                                return conn.status === 'accepted';
                            }).length;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-2 border-b-2 transition-colors font-medium flex items-center space-x-2 ${
                                        activeTab === tab.id
                                            ? 'border-indigo-500 text-indigo-400'
                                            : 'border-transparent text-gray-400 hover:text-gray-300'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{tab.label}</span>
                                    {count > 0 && (
                                        <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Clock className="w-8 h-8 text-indigo-400 animate-spin" />
                    </div>
                ) : filteredConnections.length === 0 ? (
                    <EmptyState activeTab={activeTab} />
                ) : (
                    <div className="space-y-4">
                        {filteredConnections.map(connection => (
                            <ConnectionCard
                                key={connection.id}
                                connection={connection}
                                currentUserId={currentUserId}
                                activeTab={activeTab}
                                onUpdate={fetchConnections}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Connection Request Modal */}
            <ConnectionRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchConnections}
            />
        </div>
    );
};

// Connection Card Component
const ConnectionCard = ({ connection, currentUserId, activeTab, onUpdate }) => {
    const [actionLoading, setActionLoading] = useState(false);
    
    const isInbound = connection.receiverId === currentUserId;
    const otherUser = isInbound ? connection.sender : connection.receiver;

    const handleAction = async (action) => {
        setActionLoading(true);
        try {
            const endpoint = action === 'withdraw' 
                ? `/api/connections/${connection.id}`
                : `/api/connections/${connection.id}/${action}`;
            
            const response = await fetch(endpoint, {
                method: action === 'withdraw' ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) throw new Error(`Failed to ${action}`);
            
            onUpdate();
        } catch (error) {
            console.error(`Error ${action}:`, error);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                    {/* Avatar */}
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {otherUser?.name?.charAt(0) || 'U'}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">
                            {otherUser?.name || 'Unknown User'}
                        </h3>
                        <p className="text-gray-400 text-sm">
                            {otherUser?.title || 'No title'}
                        </p>
                        {connection.message && activeTab !== 'connections' && (
                            <p className="text-gray-500 text-sm mt-2 italic">
                                "{connection.message}"
                            </p>
                        )}
                        <p className="text-gray-600 text-xs mt-2">
                            {new Date(connection.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                    {activeTab === 'invitations' && (
                        <>
                            <button
                                onClick={() => handleAction('accept')}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition disabled:opacity-50 flex items-center space-x-2"
                            >
                                <Check className="w-4 h-4" />
                                <span>Accept</span>
                            </button>
                            <button
                                onClick={() => handleAction('reject')}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg font-semibold hover:bg-gray-700 transition disabled:opacity-50 flex items-center space-x-2"
                            >
                                <XCircle className="w-4 h-4" />
                                <span>Reject</span>
                            </button>
                        </>
                    )}

                    {activeTab === 'sent' && (
                        <button
                            onClick={() => handleAction('withdraw')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg font-semibold hover:bg-gray-700 transition disabled:opacity-50 flex items-center space-x-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Withdraw</span>
                        </button>
                    )}

                    {activeTab === 'connections' && (
                        <button
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition flex items-center space-x-2"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>Message</span>
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// Empty State Component
const EmptyState = ({ activeTab }) => {
    const messages = {
        invitations: {
            title: 'No pending invitations',
            description: 'When someone sends you a connection request, it will appear here.',
        },
        sent: {
            title: 'No sent requests',
            description: 'Connection requests you send will appear here until accepted or rejected.',
        },
        connections: {
            title: 'No connections yet',
            description: 'Start building your network by sending connection requests.',
        },
    };

    const message = messages[activeTab];

    return (
        <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">{message.title}</h3>
            <p className="text-gray-600">{message.description}</p>
        </div>
    );
};

// Connection Request Modal (reused from your original code)
const ConnectionRequestModal = ({ isOpen, onClose, onSuccess }) => {
    const [targetProfileId, setTargetProfileId] = useState('');
    const [targetProfileName, setTargetProfileName] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('idle');

    const handleSendRequest = async (e) => {
        e.preventDefault();
        if (!message.trim() || !targetProfileId || status === 'loading') return;

        setStatus('loading');

        try {
            const response = await fetch('/api/connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    targetProfileId: targetProfileId,
                    message: message.trim(),
                }),
            });

            if (!response.ok) throw new Error('Failed to send connection request.');
            
            setStatus('success');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Connection API Error:", error);
            setStatus('error');
        }
    };

    const handleClose = () => {
        setStatus('idle');
        setMessage('');
        setTargetProfileId('');
        setTargetProfileName('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
            >
                <motion.div
                    className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                            <Zap className="w-6 h-6 text-indigo-400" />
                            <span>Send Connection Request</span>
                        </h2>
                        <button onClick={handleClose} className="text-gray-400 hover:text-white transition">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6">
                        {status === 'success' ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-8"
                            >
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Request Sent Successfully!</h3>
                                <p className="text-gray-400">
                                    Your request has been delivered to {targetProfileName || 'the user'}. You will be notified when they respond.
                                </p>
                                <button 
                                    onClick={handleClose} 
                                    className="mt-6 px-6 py-2 bg-indigo-600 rounded-lg text-white font-semibold hover:bg-indigo-500 transition"
                                >
                                    Done
                                </button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSendRequest} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Profile ID
                                    </label>
                                    <input
                                        type="text"
                                        value={targetProfileId}
                                        onChange={(e) => setTargetProfileId(e.target.value)}
                                        placeholder="Enter user/profile ID"
                                        required
                                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Name (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={targetProfileName}
                                        onChange={(e) => setTargetProfileName(e.target.value)}
                                        placeholder="Their name (for display)"
                                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Introduce yourself and explain why you'd like to connect..."
                                        rows={6}
                                        required
                                        className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                                    />
                                </div>

                                <motion.button
                                    type="submit"
                                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    disabled={!message.trim() || !targetProfileId || status === 'loading'}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Clock className="w-5 h-5 animate-spin" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            <span>Send Request</span>
                                        </>
                                    )}
                                </motion.button>
                                {status === 'error' && (
                                    <p className="text-red-400 text-center">
                                        Error sending request. Please try again.
                                    </p>
                                )}
                            </form>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ConnectionsPage;