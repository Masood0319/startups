
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Zap, DollarSign, MapPin, Target, User, TrendingUp } from 'lucide-react';

// --- Mock Data Structure (Replace with actual data fetching via API) ---
const mockInvestorData = {
    id: 'inv-123',
    name: 'Alexandra Chen',
    title: 'Venture Partner, Ascent Capital',
    profileImageUrl: 'https://placehold.co/100x100/374151/d1d5db?text=AC', // Placeholder
    focusStages: ['Seed', 'Series A'],
    focusIndustries: ['SaaS B2B', 'FinTech', 'HealthTech'],
    averageCheckSize: '$500K - $1M',
    location: 'San Francisco, CA',
    thesisSummary: "I look for deeply technical teams solving major infrastructure problems in regulated industries. Strong preference for recurring revenue models and proven PMF metrics ($20k+ MRR). I focus on founders with domain expertise.",
    portfolioCompanies: [
        { name: 'Synapse AI', sector: 'AI/ML', status: 'Exited' },
        { name: 'FlowPay', sector: 'FinTech', status: 'Active' },
        { name: 'Aether Health', sector: 'HealthTech', status: 'Active' },
    ],
    investmentPhilosophy: [
        "Founder-first approach with heavy operational support.",
        "Focus on 5-10 year growth horizon.",
        "Commitment to ESG principles.",
    ],
};

// --- Reusable Sub-Components ---

/**
 * Renders a single statistic or data point in the sidebar.
 */
const InfoBlock = ({ icon: Icon, title, value }) => (
    <div className="flex items-start space-x-3 p-4 bg-gray-800/50 rounded-lg">
        <Icon className="w-6 h-6 text-indigo-400 flex-shrink-0" />
        <div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</p>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    </div>
);

/**
 * Renders a tag for focus areas.
 */
const FocusTag = ({ label }) => (
    <span className="inline-block px-4 py-1 text-sm font-semibold rounded-full bg-cyan-700/50 text-cyan-200 border border-cyan-500/30">
        {label}
    </span>
);

// --- Main Component ---

const InvestorProfile = ({ investor = mockInvestorData }) => {
    return (
        <div className="min-h-screen bg-gray-950 text-white pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="grid lg:grid-cols-3 gap-10"
                >
                    {/* Left Column: Core Profile & Stats */}
                    <div className="lg:col-span-1 space-y-8 sticky top-24">
                        {/* Profile Header */}
                        <motion.div
                            className="p-8 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl shadow-indigo-900/30"
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <img
                                src={investor.profileImageUrl}
                                alt={investor.name}
                                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-indigo-600"
                            />
                            <h1 className="text-3xl font-extrabold text-center text-white mb-1">{investor.name}</h1>
                            <p className="text-lg text-indigo-400 text-center mb-6">{investor.title}</p>
                            
                            {/* Primary Action */}
                            <button
                                className="w-full flex items-center justify-center space-x-2 px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-500 transition duration-300 shadow-xl shadow-indigo-600/50"
                                onClick={() => alert('Connect Request Modal Triggered!')} // Triggers the Formal Interest mechanism
                            >
                                <Zap className="w-5 h-5" />
                                <span>Send Connect Request</span>
                            </button>
                        </motion.div>

                        {/* Investment Snapshot */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Investment Focus</h2>
                            <InfoBlock icon={DollarSign} title="Check Size" value={investor.averageCheckSize} />
                            <InfoBlock icon={TrendingUp} title="Target Stages" value={investor.focusStages.join(', ')} />
                            <InfoBlock icon={MapPin} title="Location" value={investor.location} />
                        </div>
                    </div>

                    {/* Right Column: Detailed Thesis & Portfolio */}
                    <div className="lg:col-span-2 space-y-12">
                        
                        {/* Investment Thesis */}
                        <div className="p-8 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
                                <Target className="w-6 h-6 text-indigo-400" />
                                <span>Investment Thesis</span>
                            </h2>
                            <p className="text-gray-300 leading-relaxed">{investor.thesisSummary}</p>
                        </div>

                        {/* Focus Industries */}
                        <div className="p-8 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
                                <Briefcase className="w-6 h-6 text-indigo-400" />
                                <span>Industry Expertise</span>
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                {investor.focusIndustries.map((industry, index) => (
                                    <FocusTag key={index} label={industry} />
                                ))}
                            </div>
                        </div>

                        {/* Portfolio */}
                        <div className="p-8 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
                                <User className="w-6 h-6 text-indigo-400" />
                                <span>Recent Portfolio Companies</span>
                            </h2>
                            <ul className="space-y-4">
                                {investor.portfolioCompanies.map((company, index) => (
                                    <li key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                                        <div className="text-lg font-semibold text-gray-200">{company.name}</div>
                                        <div className="flex items-center space-x-3">
                                            <span className="text-sm text-gray-400">{company.sector}</span>
                                            <span 
                                                className={`px-3 py-1 text-xs font-bold rounded-full ${
                                                    company.status === 'Exited' ? 'bg-green-600/50 text-green-300' : 'bg-yellow-600/50 text-yellow-300'
                                                }`}
                                            >
                                                {company.status}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Philosophy/Value-Add */}
                        <div className="p-8 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
                                <Briefcase className="w-6 h-6 text-indigo-400" />
                                <span>Investment Philosophy & Value-Add</span>
                            </h2>
                            <ul className="space-y-3 list-disc list-inside text-gray-300">
                                {investor.investmentPhilosophy.map((item, index) => (
                                    <li key={index} className="text-gray-300">{item}</li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default InvestorProfile;