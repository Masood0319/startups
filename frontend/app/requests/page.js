"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Mail, Send, CheckCircle, XCircle, Clock, MessageSquare, ArrowRight } from 'lucide-react';

// --- Global User Context Mock (Replace with actual auth context) ---
const USER_ROLE = 'Founder'; // Change to 'Investor' to test the other view

// --- Mock Data Structure (Replace with actual data fetching) ---
const mockConnections = [
    // Inbound Requests (Founder's View)
    { id: 1, type: 'inbound', partnerName: 'Quantum Ventures', partnerRole: 'Investor', status: 'Requested', targetName: 'AetherAI', message: 'Fascinated by your edge computing solution. I specialize in early-stage DeepTech. Ready for a discussion.', createdAt: '2025-11-28' },
    { id: 2, type: 'inbound', partnerName: 'Alpha Capital', partnerRole: 'Investor', status: 'Accepted', targetName: 'AetherAI', message: null, createdAt: '2025-11-20' },
    { id: 3, type: 'inbound', partnerName: 'Beta Angels', partnerRole: 'Investor', status: 'Declined', targetName: 'AetherAI', message: 'Great pitch, but timing is off for our fund cycle.', createdAt: '2025-11-15' },

    // Outbound Requests (Investor's View)
    { id: 4, type: 'outbound', partnerName: 'Synapse Labs', partnerRole: 'Founder', status: 'Requested', targetName: 'Synapse Labs', message: 'Your deck looks promising, focusing on B2B SaaS in logistics. Interested in learning more.', createdAt: '2025-11-29' },
    { id: 5, type: 'outbound', partnerName: 'FlowPay Systems', partnerRole: 'Founder', status: 'Declined', targetName: 'FlowPay Systems', message: null, createdAt: '2025-11-25' },
];

// --- Sub-Components ---

/**
 * Renders the status badge based on the connection state.
 */
const StatusBadge = ({ status }) => {
    let classes = "";
    let Icon = Clock;

    switch (status) {
        case 'Requested':
            classes = "bg-yellow-600/50 text-yellow-300";
            Icon = Clock;
            break;
        case 'Accepted':
            classes = "bg-green-600/50 text-green-300";
            Icon = CheckCircle;
            break;
        case 'Declined':
            classes = "bg-red-600/50 text-red-300";
            Icon = XCircle;
            break;
        case 'Withdrawn':
            classes = "bg-gray-600/50 text-gray-300";
            Icon = XCircle;
            break;
        default:
            classes = "bg-gray-700/50 text-gray-400";
            break;
    }

    return (
        <span className={`flex items-center space-x-1 px-3 py-1 text-xs font-bold rounded-full ${classes}`}>
            <Icon className="w-3 h-3" />
            <span>{status}</span>
        </span>
    );
};

/**
 * Card for a single inbound connection request (Founder's Action Card)
 */
const InboundRequestCard = ({ connection }) => (
    <motion.div
        className="p-6 bg-gray-800 border border-gray-700 rounded-xl shadow-lg space-y-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
    >
        <div className="flex justify-between items-start border-b border-gray-700 pb-3">
            <div>
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-indigo-400" />
                    <span>{connection.partnerName}</span>
                </h3>
                <p className="text-sm text-gray-400">Request for: **{connection.targetName}**</p>
            </div>
            <StatusBadge status={connection.status} />
        </div>

        {connection.message && (
            <div className="p-4 bg-gray-700/50 border-l-4 border-indigo-500 rounded-md">
                <p className="text-sm font-semibold text-gray-300 mb-1">Initial Message:</p>
                <p className="text-sm italic text-gray-400">&quot;{connection.message}&quot;</p>
            </div>
        )}

        <div className="pt-2 flex justify-end space-x-3">
            {connection.status === 'Requested' ? (
                <>
                    <button 
                        className="px-4 py-2 text-sm font-semibold rounded-lg text-red-400 border border-red-400 hover:bg-red-900/50 transition"
                        onClick={() => console.log('Decline clicked for', connection.id)} // Implement Decline Logic
                    >
                        Decline
                    </button>
                    <button 
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-500 transition shadow-md shadow-green-500/30"
                        onClick={() => console.log('Accept clicked for', connection.id)} // Implement Accept Logic
                    >
                        Accept & Unlock Chat
                    </button>
                </>
            ) : connection.status === 'Accepted' ? (
                <a 
                    href={`/chat/${connection.id}`} 
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 transition"
                >
                    <MessageSquare className="w-4 h-4" />
                    <span>Go to Chat</span>
                </a>
            ) : (
                <p className="text-sm text-gray-500">Action complete.</p>
            )}
        </div>
    </motion.div>
);

/**
 * Card for an outgoing connection request (Investor's Tracking Card)
 */
const OutboundRequestCard = ({ connection }) => (
    <motion.div
        className="p-6 bg-gray-800 border border-gray-700 rounded-xl shadow-lg space-y-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
    >
        <div className="flex justify-between items-start border-b border-gray-700 pb-3">
            <div>
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <Send className="w-5 h-5 text-indigo-400" />
                    <span>{connection.targetName}</span>
                </h3>
                <p className="text-sm text-gray-400">Sent: {connection.createdAt}</p>
            </div>
            <StatusBadge status={connection.status} />
        </div>

        {connection.message && (
            <div className="p-4 bg-gray-700/50 border-l-4 border-indigo-500 rounded-md">
                <p className="text-sm font-semibold text-gray-300 mb-1">Your Message:</p>
                <p className="text-sm italic text-gray-400">&quot;{connection.message}&quot;</p>
            </div>
        )}

        <div className="pt-2 flex justify-end space-x-3">
            {connection.status === 'Requested' ? (
                <button 
                    className="px-4 py-2 text-sm font-semibold rounded-lg text-yellow-400 border border-yellow-400 hover:bg-yellow-900/50 transition"
                    onClick={() => console.log('Withdraw clicked for', connection.id)} // Implement Withdraw Logic
                >
                    Withdraw Request
                </button>
            ) : connection.status === 'Accepted' ? (
                <a 
                    href={`/chat/${connection.id}`} 
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 transition"
                >
                    <MessageSquare className="w-4 h-4" />
                    <span>Go to Chat</span>
                </a>
            ) : (
                <p className="text-sm text-gray-500">Status is final.</p>
            )}
        </div>
    </motion.div>
);


// --- Main Component ---

const RequestsInbox = () => {
    const [activeTab, setActiveTab] = useState(USER_ROLE === 'Founder' ? 'inbound' : 'outbound');

    const connections = mockConnections.filter(c => c.type === activeTab);

    // Determine the header text based on the active tab and user role
    const headerTitle = USER_ROLE === 'Founder' 
        ? (activeTab === 'inbound' ? 'Investor Connection Requests' : 'Your Outbound Requests (if any)')
        : (activeTab === 'outbound' ? 'Startups You Contacted' : 'Startup Requests (Should be rare)');


    return (
        <div className="min-h-screen bg-gray-950 text-white pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10 border-b border-gray-700 pb-6"
                >
                    <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center space-x-3">
                        <Mail className="w-8 h-8 text-indigo-400" />
                        <span>{headerTitle}</span>
                    </h1>
                    <p className="text-xl text-gray-400">
                        Manage your deal pipeline and connection status history.
                    </p>
                </motion.div>
                
                {/* Tabs */}
                <div className="flex mb-8">
                    {/* Founder Primary View */}
                    <button
                        onClick={() => setActiveTab('inbound')}
                        className={`py-3 px-6 text-lg font-semibold border-b-2 transition duration-300 ${
                            activeTab === 'inbound' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-white'
                        }`}
                    >
                        Incoming Requests
                    </button>
                    {/* Investor Primary View */}
                    <button
                        onClick={() => setActiveTab('outbound')}
                        className={`py-3 px-6 text-lg font-semibold border-b-2 transition duration-300 ${
                            activeTab === 'outbound' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-white'
                        }`}
                    >
                        {USER_ROLE === 'Founder' ? 'Outbound Requests' : 'Your Sent Requests'}
                    </button>
                </div>

                {/* Connection List */}
                <div className="space-y-6">
                    {connections.length > 0 ? (
                        connections.map(connection => (
                            activeTab === 'inbound' && USER_ROLE === 'Founder' ? (
                                <InboundRequestCard key={connection.id} connection={connection} />
                            ) : (
                                <OutboundRequestCard key={connection.id} connection={connection} />
                            )
                        ))
                    ) : (
                        <motion.div
                            className="p-12 text-center bg-gray-800/50 rounded-xl border border-gray-700/50"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                        >
                            <MessageSquare className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                            <p className="text-xl font-semibold text-white">
                                {activeTab === 'inbound' ? "No new connection requests." : "No requests sent yet."}
                            </p>
                            <p className="text-gray-400 mt-2">
                                {activeTab === 'inbound' ? "Your profile is active and waiting for investor interest." : "Time to explore the Startups page and connect!"}
                            </p>
                            {activeTab === 'outbound' && USER_ROLE === 'Investor' && (
                                <a href="/startups" className="mt-4 inline-flex items-center text-cyan-400 hover:text-cyan-300 transition font-medium">
                                    Browse Startups <ArrowRight className="w-4 h-4 ml-2" />
                                </a>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestsInbox;