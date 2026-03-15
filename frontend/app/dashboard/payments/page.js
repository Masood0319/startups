'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PlusIcon,
  CreditCardIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import PaymentModal from '@/app/components/PaymentModal';
import PaymentHistory from '@/app/components/PaymentHistory';
import { apiRequest } from '@/lib/apiClient';

export default function PaymentsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [recentContacts, setRecentContacts] = useState([]);
  const [paymentStats, setPaymentStats] = useState({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchUserData();
    fetchRecentContacts();

    // Check for success/error messages from URL params
    const status = searchParams.get('status');
    if (status === 'success') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      // Clean URL
      router.replace('/dashboard/payments');
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const data = await apiRequest('auth/me', { method: 'GET' });
      setUser(data?.data?.user || null);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentContacts = async () => {
    try {
      // Fetch recent connections for quick payment access
      const data = await apiRequest('connections?status=accepted&limit=5', {
        method: 'GET',
      });
      setRecentContacts(data?.data?.connections || []);
    } catch (error) {
      console.error('Error fetching recent contacts:', error);
    }
  };

  const handleQuickPayment = (contact) => {
    setSelectedReceiver({
      id: contact.partnerId,
      name: contact.partnerName,
      email: contact.partnerEmail,
      avatar: contact.partnerAvatar,
      role: contact.partnerRole,
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (transaction) => {
    console.log('Payment successful:', transaction);
    setShowPaymentModal(false);
    setSelectedReceiver(null);
    // Refresh the payment history component
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
              <p className="mt-2 text-gray-600">
                Send and receive payments securely with other platform members.
              </p>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Send Payment
            </button>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 border border-green-200 rounded-md p-4"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Payment Successful!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Your payment has been processed successfully.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Payment Stats Card */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <CreditCardIcon className="inline h-5 w-5 mr-2" />
                  Quick Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-2 bg-green-100 rounded-full">
                        <ArrowDownIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Received</p>
                        <p className="text-xs text-gray-600">This month</p>
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-green-600">$0.00</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-2 bg-red-100 rounded-full">
                        <ArrowUpIcon className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Sent</p>
                        <p className="text-xs text-gray-600">This month</p>
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-red-600">$0.00</p>
                  </div>
                </div>
              </div>

              {/* Recent Contacts */}
              {recentContacts.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Quick Pay
                  </h3>
                  <div className="space-y-3">
                    {recentContacts.map((contact) => {
                      const otherUser = {
                        full_name: contact.partnerName,
                        role: contact.partnerRole,
                        avatar: contact.partnerAvatar,
                      };

                      return (
                        <button
                          key={contact.id}
                          onClick={() => handleQuickPayment(contact)}
                          className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          {otherUser.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={otherUser.avatar}
                              alt={otherUser.full_name}
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {otherUser.full_name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {otherUser.full_name}
                            </p>
                            <p className="text-sm text-gray-600 capitalize truncate">
                              {otherUser.role}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Send to someone else →
                    </button>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  🔒 Secure Payments
                </h4>
                <p className="text-sm text-blue-800">
                  All payments are processed securely through Stripe.
                  We never store your payment information.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Payment History */}
            <PaymentHistory userId={user?.id || user?.userId || user?._id} />
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedReceiver(null);
          }}
          receiverId={selectedReceiver?.id}
          receiverName={selectedReceiver?.name}
          receiverAvatar={selectedReceiver?.avatar}
          receiverRole={selectedReceiver?.role}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
