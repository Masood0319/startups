'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCardIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/apiClient';

export default function PaymentHistory({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all', // sent, received, all
    dateRange: '30d', // 7d, 30d, 90d, all
    search: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    hasMore: false
  });

  const router = useRouter();

  // Fetch transactions
  const fetchTransactions = async (resetPagination = false) => {
    try {
      if (resetPagination) {
        setTransactions([]);
        setPagination(prev => ({ ...prev, page: 1 }));
      }

      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.type !== 'all') params.append('type', filters.type);
      params.append('page', resetPagination ? '1' : pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      // Date range filtering
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let dateFrom = new Date(now);

        switch (filters.dateRange) {
          case '7d':
            dateFrom.setDate(now.getDate() - 7);
            break;
          case '30d':
            dateFrom.setDate(now.getDate() - 30);
            break;
          case '90d':
            dateFrom.setDate(now.getDate() - 90);
            break;
        }
        params.append('dateFrom', dateFrom.toISOString());
      }

      const data = await apiRequest(`payments?${params}`, { method: "GET" });
      if (data.success) {
        if (resetPagination) {
          setTransactions(data.data.transactions);
        } else {
          setTransactions(prev => [...prev, ...data.data.transactions]);
        }

        setPagination({
          page: data.data.pagination.page,
          limit: data.data.pagination.limit,
          totalPages: data.data.pagination.totalPages,
          hasMore: data.data.pagination.hasMore
        });

        setStats(data.data.stats);
        setError(null);
      } else {
        setError(data.error || data.message || 'Failed to load transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (userId) {
      fetchTransactions(true);
    }
  }, [userId, filters]);

  // Load more transactions
  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
      fetchTransactions();
    }
  };

  // Refresh transactions
  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions(true);
  };

  // Filter change handler
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'canceled':
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
      case 'refunded':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get status color class
  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Filter transactions based on search
  const filteredTransactions = transactions.filter(transaction => {
    if (!filters.search) return true;

    const searchLower = filters.search.toLowerCase();
    const senderName = transaction.senderId?.full_name?.toLowerCase() || '';
    const receiverName = transaction.receiverId?.full_name?.toLowerCase() || '';
    const description = transaction.description?.toLowerCase() || '';
    const transactionId = transaction.transactionId?.toLowerCase() || '';

    return (
      senderName.includes(searchLower) ||
      receiverName.includes(searchLower) ||
      description.includes(searchLower) ||
      transactionId.includes(searchLower)
    );
  });

  if (loading && transactions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-8 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">Error Loading Transactions</h3>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
            <p className="text-sm text-gray-600">
              {stats.totalTransactions || 0} transactions
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <FunnelIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600">Total Sent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.formattedTotalSent || '$0.00'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600">Total Received</p>
              <p className="text-2xl font-bold text-gray-900">{stats.formattedTotalReceived || '$0.00'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-green-600">{stats.successfulTransactions || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failedTransactions || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 px-6 py-4 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="mt-1 block w-full text-sm border-gray-300 rounded-md"
                >
                  <option value="all">All Statuses</option>
                  <option value="succeeded">Successful</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                  <option value="canceled">Canceled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="mt-1 block w-full text-sm border-gray-300 rounded-md"
                >
                  <option value="all">All Transactions</option>
                  <option value="sent">Sent</option>
                  <option value="received">Received</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="mt-1 block w-full text-sm border-gray-300 rounded-md"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Search</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search transactions..."
                    className="block w-full pl-10 text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions List */}
      <div className="divide-y divide-gray-200">
        {filteredTransactions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No transactions found</h3>
            <p className="mt-2 text-sm text-gray-600">
              {filters.search || filters.status !== 'all' || filters.type !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'You haven\'t sent or received any payments yet.'}
            </p>
          </div>
        ) : (
          <>
            {filteredTransactions.map((transaction) => {
              const isSent = transaction.senderId?._id === userId;
              const otherUser = isSent ? transaction.receiverId : transaction.senderId;

              return (
                <motion.div
                  key={transaction._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/payments/${transaction.transactionId}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Direction Icon */}
                      <div className={`flex-shrink-0 p-2 rounded-full ${
                        isSent ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        {isSent ? (
                          <ArrowUpIcon className="h-5 w-5 text-red-600" />
                        ) : (
                          <ArrowDownIcon className="h-5 w-5 text-green-600" />
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex items-center space-x-3">
                        {otherUser?.avatar ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={otherUser.avatar}
                            alt={otherUser.full_name}
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {otherUser?.full_name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {isSent ? 'To' : 'From'} {otherUser?.full_name}
                          </p>
                          <p className="text-sm text-gray-600 capitalize">
                            {otherUser?.role} • {formatDate(transaction.createdAt)}
                          </p>
                          {transaction.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {transaction.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount and Status */}
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        isSent ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {isSent ? '-' : '+'}${(transaction.amount / 100).toFixed(2)}
                      </p>
                      <div className="flex items-center justify-end mt-1 space-x-2">
                        {getStatusIcon(transaction.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Load More Button */}
            {pagination.hasMore && (
              <div className="px-6 py-4 border-t border-gray-200">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" />
                      Loading...
                    </span>
                  ) : (
                    `Load More (${pagination.totalPages - pagination.page} more pages)`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
