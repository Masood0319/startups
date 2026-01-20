"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, DollarSign, Briefcase, MapPin, TrendingUp, Users } from 'lucide-react';

const [investors, setInvestors] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch("/api/investors")
    .then(res => res.json())
    .then(data => {
      if (data.success) setInvestors(data.investors || []);
    })
    .finally(() => setLoading(false));
}, []);

const InvestorCard = ({ investor }) => (
    <motion.div
        className="p-6 bg-gray-800/50 border border-gray-700/50 rounded-xl shadow-lg hover:border-indigo-500/50 transition duration-300 cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(99, 102, 241, 0.2)" }}
        onClick={() => window.location.href = `/investor/${investor.id}`}
    >
        <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-indigo-600/70 flex items-center justify-center text-white text-xl font-bold">
                {investor.name.charAt(0)}
            </div>
            <div>
                <h3 className="text-xl font-bold text-white">{investor.name}</h3>
                <p className="text-sm text-indigo-400">{investor.title}</p>
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="flex items-center text-gray-400">
                <TrendingUp className="w-4 h-4 mr-2 text-cyan-400" />
                <span className='text-white font-semibold'>{investor.stage}</span>
            </div>
            <div className="flex items-center text-gray-400">
                <Briefcase className="w-4 h-4 mr-2 text-cyan-400" />
                {investor.sector}
            </div>
            <div className="flex items-center text-gray-400">
                <DollarSign className="w-4 h-4 mr-2 text-cyan-400" />
                {investor.check}
            </div>
            <div className="flex items-center text-gray-400">
                <MapPin className="w-4 h-4 mr-2 text-cyan-400" />
                {investor.location}
            </div>
        </div>
    </motion.div>
);

/**
 * Filter Component for the Sidebar
 */
const InvestorFilters = ({ filters, setFilters }) => {
    const handleCheckboxChange = (group, value) => {
        setFilters(prev => ({
            ...prev,
            [group]: prev[group].includes(value)
                ? prev[group].filter(v => v !== value)
                : [...prev[group], value]
        }));
    };

    const filterOptions = {
        stage: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth'],
        sector: ['SaaS B2B', 'FinTech', 'HealthTech', 'DeepTech', 'ClimateTech', 'Consumer'],
        location: ['SF', 'NYC', 'LA', 'Austin', 'Remote', 'Europe', 'Asia'],
        check: ['$100K-500K', '$500K+', '$1M+', '$5M+'],
    };

    return (
        <div className="sticky top-24 p-6 bg-gray-900 border border-gray-800 rounded-xl space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-3 text-indigo-400" />
                Filter Investors
            </h2>

            {Object.entries(filterOptions).map(([group, options]) => (
                <div key={group} className="border-b border-gray-700 pb-4 last:border-b-0">
                    <h3 className="text-lg font-semibold text-gray-300 mb-3 capitalize">
                        {group.replace('check', 'Investment Size')}
                    </h3>
                    <div className="space-y-2">
                        {options.map((option) => (
                            <label key={option} className="flex items-center text-gray-400 cursor-pointer hover:text-white transition">
                                <input
                                    type="checkbox"
                                    checked={filters[group].includes(option)}
                                    onChange={() => handleCheckboxChange(group, option)}
                                    className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 mr-3"
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Main Investor Listing Component ---

const InvestorListing = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        stage: [],
        sector: [],
        location: [],
        check: [],
    });

    const filteredInvestors = useMemo(() => {
        return investors.filter(investor => {
            // 1. Search Term Filter (Name, Title)
            const matchesSearch = investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                investor.title.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (!matchesSearch) return false;

            // 2. Multi-Select Filters
            const matchesStage = filters.stage.length === 0 || filters.stage.includes(investor.stage);
            const matchesSector = filters.sector.length === 0 || filters.sector.includes(investor.sector);
            const matchesLocation = filters.location.length === 0 || filters.location.includes(investor.location);
            const matchesCheck = filters.check.length === 0 || filters.check.includes(investor.check);

            return matchesStage && matchesSector && matchesLocation && matchesCheck;
        });
    }, [searchTerm, filters, mockInvestors]); // Re-calculate only when these dependencies change

    return (
        <div className="min-h-screen bg-gray-950 text-white pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header and Search */}
                <div className="mb-10">
                    <motion.h1 
                        className="text-4xl font-extrabold text-white mb-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        Investor Discovery Engine
                    </motion.h1>
                    <p className="text-xl text-gray-400 mb-6">Find the perfect capital partner that aligns with your mission and stage.</p>
                    
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by investor name or firm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full py-4 pl-12 pr-6 text-lg text-white bg-gray-800 border border-gray-700 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                        <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>

                {/* Main Content Grid: Filters and Results */}
                <div className="grid lg:grid-cols-4 gap-10">
                    
                    {/* Filter Sidebar (Col 1) */}
                    <div className="lg:col-span-1">
                        <InvestorFilters filters={filters} setFilters={setFilters} />
                    </div>

                    {/* Results Area (Cols 2-4) */}
                    <div className="lg:col-span-3">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-300 flex items-center">
                                <Users className="w-6 h-6 mr-2 text-cyan-400" />
                                Showing {filteredInvestors.length} Investors
                            </h2>
                        </div>

                        {filteredInvestors.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredInvestors.map(investor => (
                                    <InvestorCard key={investor.id} investor={investor} />
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                className="p-12 text-center bg-gray-800/50 rounded-xl border border-gray-700/50"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                            >
                                <Filter className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                                <p className="text-xl font-semibold text-white">No investors match your criteria.</p>
                                <p className="text-gray-400 mt-2">Try adjusting your search terms or filters.</p>
                                <button 
                                    onClick={() => setFilters({ stage: [], sector: [], location: [], check: [] })}
                                    className="mt-4 text-sm text-cyan-400 hover:text-cyan-300 transition font-medium"
                                >
                                    Clear All Filters
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvestorListing;