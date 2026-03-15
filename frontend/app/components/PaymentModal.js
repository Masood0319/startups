'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  XMarkIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/apiClient';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Card element styling
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#424770',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#9e2146',
      iconColor: '#9e2146'
    }
  },
  hidePostalCode: false
};

// Payment form component that uses Stripe hooks
function PaymentForm({
  receiverId,
  receiverName,
  amount,
  description,
  onSuccess,
  onError,
  onClose,
  connectionId,
  startupId
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [transactionId, setTransactionId] = useState('');

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const data = await apiRequest('payments', {
          method: 'POST',
          data: {
            receiverId,
            amount: parseFloat(amount),
            description,
            connectionId,
            startupId
          },
        });
        setClientSecret(data.data.clientSecret);
        setTransactionId(data.data.transaction.transactionId);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        setPaymentError('Failed to initialize payment. Please try again.');
      }
    };

    if (receiverId && amount && !clientSecret) {
      createPaymentIntent();
    }
  }, [receiverId, amount, description, connectionId, startupId, clientSecret]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setPaymentError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        console.error('Payment failed:', error);
        setPaymentError(error.message || 'Payment failed. Please try again.');
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm transaction on backend
        try {
          const data = await apiRequest('payments/confirm', {
            method: 'POST',
            data: {
              transactionId,
              paymentIntentId: paymentIntent.id
            },
          });
          setPaymentSuccess(true);
          setTimeout(() => {
            onSuccess(data.data.transaction);
          }, 2000);
        } catch (error) {
          console.error('Error confirming payment:', error);
          setPaymentError('Payment succeeded but confirmation failed. Please contact support.');
        }
      } else {
        setPaymentError('Payment was not completed. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setPaymentError('An unexpected error occurred. Please try again.');
    }

    setProcessing(false);
  };

  if (paymentSuccess) {
    return (
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4"
        >
          <CheckCircleIcon className="h-6 w-6 text-green-600" />
        </motion.div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Payment Successful!
        </h3>
        <p className="text-sm text-gray-600">
          Your payment of ${amount} to {receiverName} has been processed successfully.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Details Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-900">Payment to</p>
            <p className="text-lg font-semibold text-gray-900">{receiverName}</p>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">${amount}</p>
            <p className="text-sm text-gray-600">USD</p>
          </div>
        </div>
      </div>

      {/* Card Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <CreditCardIcon className="inline h-5 w-5 mr-2" />
          Card Information
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {/* Error Display */}
      {paymentError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Payment Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{paymentError}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !clientSecret || processing}
          className="flex-1 bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <span className="flex items-center justify-center">
              <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Processing...
            </span>
          ) : (
            `Pay $${amount}`
          )}
        </button>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          🔒 Your payment information is encrypted and secure. We never store your card details.
        </p>
      </div>
    </form>
  );
}

// Main PaymentModal component
export default function PaymentModal({
  isOpen,
  onClose,
  receiverId,
  receiverName,
  receiverAvatar,
  receiverRole,
  initialAmount = '',
  initialDescription = '',
  connectionId,
  startupId,
  onSuccess
}) {
  const [amount, setAmount] = useState(initialAmount);
  const [description, setDescription] = useState(initialDescription);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [amountError, setAmountError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAmount(initialAmount);
      setDescription(initialDescription);
      setShowPaymentForm(false);
      setAmountError('');
    }
  }, [isOpen, initialAmount, initialDescription]);

  const validateAmount = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return 'Please enter a valid amount';
    }
    if (numValue < 0.50) {
      return 'Minimum payment amount is $0.50';
    }
    if (numValue > 1000000) {
      return 'Maximum payment amount is $1,000,000';
    }
    return '';
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    setAmountError(validateAmount(value));
  };

  const handleProceedToPayment = () => {
    const error = validateAmount(amount);
    if (error) {
      setAmountError(error);
      return;
    }
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (transaction) => {
    onSuccess && onSuccess(transaction);
    onClose();
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          >
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CreditCardIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {showPaymentForm ? 'Complete Payment' : 'Send Payment'}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Receiver Info */}
              <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-50 rounded-lg">
                {receiverAvatar ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={receiverAvatar}
                    alt={receiverName}
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {receiverName?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{receiverName}</p>
                  <p className="text-sm text-gray-600 capitalize">{receiverRole}</p>
                </div>
              </div>

              {/* Content */}
              {!showPaymentForm ? (
                // Amount and Description Form
                <div className="space-y-4">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                      Amount (USD)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        name="amount"
                        id="amount"
                        step="0.01"
                        min="0.50"
                        max="1000000"
                        value={amount}
                        onChange={handleAmountChange}
                        className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${amountError ? 'border-red-300' : ''}`}
                        placeholder="0.00"
                      />
                    </div>
                    {amountError && (
                      <p className="mt-2 text-sm text-red-600">{amountError}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description (Optional)
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="What is this payment for?"
                        maxLength={500}
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        {description.length}/500 characters
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToPayment}
                      disabled={!amount || parseFloat(amount) <= 0 || amountError}
                      className="flex-1 bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              ) : (
                // Stripe Payment Form
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    receiverId={receiverId}
                    receiverName={receiverName}
                    amount={amount}
                    description={description}
                    connectionId={connectionId}
                    startupId={startupId}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onClose={() => setShowPaymentForm(false)}
                  />
                </Elements>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
