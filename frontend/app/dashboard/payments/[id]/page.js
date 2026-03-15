'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CreditCardIcon,
  UserIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/apiClient';

export default function TransactionDetailPage() {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const params = useParams();
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    fetchCurrentUser();
    fetchTransaction();
  }, [id]);

  const fetchCurrentUser = async () => {
    try {
      const data = await apiRequest('auth/me', { method: 'GET' });
      setCurrentUser(data?.data?.user || null);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchTransaction = async () => {
    try {
      const data = await apiRequest(`payments/${id}`, { method: 'GET' });
      setTransaction(data.data.transaction);
      setError(null);
    } catch (err) {
      console.error('Error fetching transaction:', err);
      setError('Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTransaction = async () => {
    if (!confirm('Are you sure you want to cancel this payment?')) {
      return;
    }

    try {
      setActionLoading('cancel');

      await apiRequest(`payments/${id}`, {
        method: 'PUT',
        data: {
          action: 'cancel'
        },
      });
      await fetchTransaction(); // Refresh transaction data
      alert('Payment canceled successfully');
    } catch (error) {
      console.error('Error canceling transaction:', error);
      alert('Failed to cancel payment. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefundTransaction = async () => {
    const refundAmount = prompt('Enter refund amount (leave empty for full refund):');

    if (refundAmount === null) return; // User clicked cancel

    const amount = refundAmount ? parseFloat(refundAmount) : null;

    if (amount && (isNaN(amount) || amount <= 0)) {
      alert('Please enter a valid refund amount');
      return;
    }

    if (!confirm(`Are you sure you want to refund ${amount ? `$${amount}` : 'the full amount'}?`)) {
      return;
    }

    try {
      setActionLoading('refund');

      await apiRequest(`payments/${id}`, {
        method: 'PUT',
        data: {
          action: 'refund',
          refundAmount: amount,
          reason: 'Customer request'
        },
      });
      await fetchTransaction(); // Refresh transaction data
      alert('Refund processed successfully');
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-8 w-8 text-red-500" />;
      case 'pending':
      case 'processing':
        return <ClockIcon className="h-8 w-8 text-yellow-500" />;
      case 'canceled':
        return <ExclamationTriangleIcon className="h-8 w-8 text-gray-500" />;
      case 'refunded':
        return <ArrowPathIcon className="h-8 w-8 text-blue-500" />;
      default:
        return <ClockIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return 'text-green-800 bg-green-100 border-green-200';
      case 'failed':
        return 'text-red-800 bg-red-100 border-red-200';
      case 'pending':
      case 'processing':
        return 'text-yellow-800 bg-yellow-100 border-yellow-200';
      case 'canceled':
        return 'text-gray-800 bg-gray-100 border-gray-200';
      case 'refunded':
        return 'text-blue-800 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isSender = transaction && currentUser && transaction.sender.id === (currentUser.id || currentUser.userId || currentUser._id);
  const otherUser = transaction ? (isSender ? transaction.receiver : transaction.sender) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transaction</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button
              onClick={() => router.back()}
              className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
            >
              Go Back
            </button>
            <button
              onClick={fetchTransaction}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Transaction Not Found</h3>
          <p className="text-sm text-gray-600 mb-4">The transaction you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/dashboard/payments')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            View All Payments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Payments
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction Details</h1>
              <p className="mt-2 text-sm text-gray-600">
                Transaction ID: {transaction.transactionId}
              </p>
            </div>
            <div className="flex items-center">
              {getStatusIcon(transaction.status)}
              <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(transaction.status)}`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Payment Overview</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${isSender ? 'bg-red-100' : 'bg-green-100'}`}>
                      <BanknotesIcon className={`h-6 w-6 ${isSender ? 'text-red-600' : 'text-green-600'}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {isSender ? '-' : '+'}${(transaction.amount / 100).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">
                        {isSender ? 'Payment Sent' : 'Payment Received'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Net Amount</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${((transaction.amount - (transaction.refundAmount || 0)) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Transaction Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Amount:</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${(transaction.amount / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Currency:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {transaction.currency.toUpperCase()}
                        </span>
                      </div>
                      {transaction.refundAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Refunded:</span>
                          <span className="text-sm font-medium text-red-600">
                            -${(transaction.refundAmount / 100).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Created:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(transaction.createdAt)}
                        </span>
                      </div>
                      {transaction.completedAt && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Completed:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(transaction.completedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Method</h4>
                    <div className="space-y-3">
                      {transaction.paymentMethod ? (
                        <>
                          <div className="flex items-center space-x-3">
                            <CreditCardIcon className="h-5 w-5 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {transaction.paymentMethod.brand?.toUpperCase()} ****{transaction.paymentMethod.last4}
                            </span>
                          </div>
                          {transaction.paymentMethod.country && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Country:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {transaction.paymentMethod.country}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No payment method information available</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {transaction.description && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-700">{transaction.description}</p>
                  </div>
                )}

                {/* Failure Information */}
                {transaction.status === 'failed' && (transaction.failureMessage || transaction.failureCode) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-red-900 mb-2">Failure Information</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      {transaction.failureMessage && (
                        <p className="text-sm text-red-700 mb-2">{transaction.failureMessage}</p>
                      )}
                      {transaction.failureCode && (
                        <p className="text-xs text-red-600">Error Code: {transaction.failureCode}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Status History */}
            {transaction.statusHistory && transaction.statusHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Status History</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {transaction.statusHistory.map((entry, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getStatusIcon(entry.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {entry.status.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(entry.timestamp)}
                            </p>
                          </div>
                          {entry.reason && (
                            <p className="text-sm text-gray-600 mt-1">{entry.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Other User Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {isSender ? 'Sent To' : 'Received From'}
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  {otherUser?.avatar ? (
                    <img
                      className="h-12 w-12 rounded-full"
                      src={otherUser.avatar}
                      alt={otherUser.name}
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-medium text-gray-900">{otherUser?.name}</p>
                    <p className="text-sm text-gray-600 capitalize">{otherUser?.role}</p>
                    <p className="text-sm text-gray-500">{otherUser?.email}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            {isSender && (transaction.status === 'pending' || (transaction.status === 'succeeded' && transaction.canBeRefunded)) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Actions</h3>
                </div>
                <div className="p-6 space-y-3">
                  {transaction.status === 'pending' && (
                    <button
                      onClick={handleCancelTransaction}
                      disabled={actionLoading === 'cancel'}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {actionLoading === 'cancel' ? 'Canceling...' : 'Cancel Payment'}
                    </button>
                  )}

                  {transaction.status === 'succeeded' && transaction.canBeRefunded && (
                    <button
                      onClick={handleRefundTransaction}
                      disabled={actionLoading === 'refund'}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {actionLoading === 'refund' ? 'Processing...' : 'Request Refund'}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Security Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-center">
                <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="text-sm font-medium text-blue-900">Secure Transaction</h4>
              </div>
              <p className="text-sm text-blue-800 mt-2">
                This payment was processed securely through Stripe with end-to-end encryption.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
