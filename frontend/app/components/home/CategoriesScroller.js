"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, TrendingUp, Users, Building, Zap } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";

const CategoriesScroller = ({ onCategorySelect, selectedCategory = null }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Industry categories with icons and colors
  const defaultCategories = [
    {
      id: 'all',
      name: 'All Categories',
      icon: Building,
      color: 'from-gray-600 to-gray-700',
      borderColor: 'border-gray-500/30',
      textColor: 'text-gray-300',
      count: 0
    },
    {
      id: 'fintech',
      name: 'FinTech',
      icon: TrendingUp,
      color: 'from-green-600 to-emerald-700',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-300',
      count: 0
    },
    {
      id: 'healthtech',
      name: 'HealthTech',
      icon: Users,
      color: 'from-red-600 to-pink-700',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-300',
      count: 0
    },
    {
      id: 'saas',
      name: 'SaaS',
      icon: Zap,
      color: 'from-blue-600 to-indigo-700',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-300',
      count: 0
    },
    {
      id: 'ecommerce',
      name: 'E-commerce',
      icon: Building,
      color: 'from-purple-600 to-violet-700',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-300',
      count: 0
    },
    {
      id: 'ai',
      name: 'AI & ML',
      icon: Zap,
      color: 'from-yellow-600 to-orange-700',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-300',
      count: 0
    },
    {
      id: 'blockchain',
      name: 'Blockchain',
      icon: Building,
      color: 'from-cyan-600 to-teal-700',
      borderColor: 'border-cyan-500/30',
      textColor: 'text-cyan-300',
      count: 0
    },
    {
      id: 'edtech',
      name: 'EdTech',
      icon: Users,
      color: 'from-indigo-600 to-purple-700',
      borderColor: 'border-indigo-500/30',
      textColor: 'text-indigo-300',
      count: 0
    },
    {
      id: 'foodtech',
      name: 'FoodTech',
      icon: Building,
      color: 'from-orange-600 to-red-700',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-300',
      count: 0
    },
    {
      id: 'proptech',
      name: 'PropTech',
      icon: Building,
      color: 'from-slate-600 to-gray-700',
      borderColor: 'border-slate-500/30',
      textColor: 'text-slate-300',
      count: 0
    },
    {
      id: 'mobility',
      name: 'Mobility',
      icon: Zap,
      color: 'from-emerald-600 to-green-700',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-300',
      count: 0
    },
    {
      id: 'cleantech',
      name: 'CleanTech',
      icon: Users,
      color: 'from-lime-600 to-green-700',
      borderColor: 'border-lime-500/30',
      textColor: 'text-lime-300',
      count: 0
    }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("platform/stats", { method: "GET" });
      const totalStartups = data?.data?.startups?.total || 0;
      const categoriesWithCounts = defaultCategories.map((cat) => ({
        ...cat,
        count: cat.id === 'all' ? totalStartups : 0,
      }));
      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories(defaultCategories);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (direction) => {
    const scrollContainer = document.getElementById('categories-scroll');
    if (!scrollContainer) return;

    const scrollAmount = 200;
    const newPosition = direction === 'left'
      ? scrollPosition - scrollAmount
      : scrollPosition + scrollAmount;

    scrollContainer.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });

    setScrollPosition(newPosition);

    // Update scroll button states
    setTimeout(() => {
      const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      setCanScrollLeft(newPosition > 0);
      setCanScrollRight(newPosition < maxScroll);
    }, 300);
  };

  const handleCategoryClick = (category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  if (loading) {
    return (
      <section className="py-8 bg-gray-950/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-4 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex-shrink-0 animate-pulse">
                <div className="w-32 h-20 bg-gray-800 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-gray-950/50 border-y border-gray-800/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Browse by Category</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`p-2 rounded-lg transition-all ${
                canScrollLeft
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-gray-900 text-gray-600 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`p-2 rounded-lg transition-all ${
                canScrollRight
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-gray-900 text-gray-600 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div
            id="categories-scroll"
            className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category, index) => {
              const Icon = category.icon;
              const isSelected = selectedCategory?.id === category.id;

              return (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  onClick={() => handleCategoryClick(category)}
                  className={`flex-shrink-0 group relative overflow-hidden rounded-xl p-4 min-w-[140px] h-24 transition-all duration-300 ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 scale-105 shadow-lg shadow-indigo-500/25'
                      : 'hover:scale-105 hover:shadow-lg'
                  }`}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-80 group-hover:opacity-100 transition-opacity`} />

                  {/* Border */}
                  <div className={`absolute inset-0 border ${category.borderColor} rounded-xl`} />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                    <Icon className={`w-6 h-6 mb-2 ${category.textColor} group-hover:text-white transition-colors`} />
                    <h3 className="font-semibold text-white text-sm mb-1 group-hover:text-white transition-colors">
                      {category.name}
                    </h3>
                    {category.count > 0 && (
                      <p className="text-xs text-white/70 group-hover:text-white/90 transition-colors">
                        {category.count} {category.id === 'all' ? 'total' : 'startups'}
                      </p>
                    )}
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-xl" />

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Gradient fade edges */}
          <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-gray-950 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-gray-950 to-transparent pointer-events-none" />
        </div>

        {/* Selected Category Info */}
        {selectedCategory && selectedCategory.id !== 'all' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-4 bg-gray-900/50 rounded-xl border border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${selectedCategory.color}`}>
                  <selectedCategory.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedCategory.name}</h3>
                  <p className="text-sm text-gray-400">
                    {selectedCategory.count} startups in this category
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleCategoryClick(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-90" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CategoriesScroller;
