# Payment System Setup Guide

This guide will help you set up the complete peer-to-peer payment system using Stripe.

## 🚀 Quick Start

### 1. Environment Variables

Add these variables to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (if not already configured)
MONGODB_URI=your_mongodb_connection_string

# JWT (if not already configured)
JWT_SECRET=your_jwt_secret_here
```

### 2. Stripe Dashboard Setup

#### A. Get Your API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers > API Keys**
3. Copy your **Publishable Key** and **Secret Key**
4. Use TEST keys for development (they start with `pk_test_` and `sk_test_`)

#### B. Configure Webhooks
1. Go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL: `https://your-domain.com/api/payments/webhooks`
   - For local development: `https://your-ngrok-url.ngrok.io/api/payments/webhooks`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.succeeded`
   - `charge.failed`
   - `charge.refunded`
5. Copy the **Signing Secret** (starts with `whsec_`)

### 3. Install Dependencies

The required packages are already installed:
- `stripe` (server-side)
- `@stripe/stripe-js` (client-side)

### 4. Database Setup

The payment system uses these MongoDB collections:
- `transactions` - Payment transaction records
- `paymentmethods` - User payment method storage (optional)

No additional setup needed - collections will be created automatically.

## 🔧 Development Setup

### Local Testing with Stripe CLI

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli
2. **Login to Stripe**:
   ```bash
   stripe login
   ```
3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhooks
   ```
4. **Copy webhook signing secret** from CLI output to your `.env.local`

### Testing Payments

Use these Stripe test cards:

| Card Number | Description |
|-------------|-------------|
| `4242424242424242` | Visa - Always succeeds |
| `4000000000000002` | Visa - Always declined |
| `4000000000009995` | Visa - Always fails |
| `4000002500003155` | Visa - Requires 3D Secure |

Use any future expiry date and any 3-digit CVC.

## 📋 API Endpoints

### Payment APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments` | GET | Get payment history |
| `/api/payments` | POST | Create payment transaction |
| `/api/payments/confirm` | POST | Confirm payment after Stripe processing |
| `/api/payments/[id]` | GET | Get specific transaction |
| `/api/payments/[id]` | PUT | Update transaction (cancel/refund) |
| `/api/payments/webhooks` | POST | Stripe webhook handler |

### API Usage Examples

#### Create Payment
```javascript
const response = await fetch('/api/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    receiverId: 'user_id_here',
    amount: 50.00,
    description: 'Investment milestone payment',
    connectionId: 'connection_id_here', // optional
    startupId: 'startup_id_here' // optional
  }),
});
```

#### Get Payment History
```javascript
const response = await fetch('/api/payments?status=succeeded&type=sent&page=1&limit=20');
```

## 🎨 Frontend Components

### PaymentModal
Complete payment interface with Stripe Elements integration.

```javascript
import PaymentModal from '@/app/components/PaymentModal';

<PaymentModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  receiverId="user_id"
  receiverName="John Doe"
  receiverAvatar="avatar_url"
  receiverRole="founder"
  onSuccess={(transaction) => console.log('Payment successful:', transaction)}
/>
```

### PaymentHistory
Display transaction history with filtering and pagination.

```javascript
import PaymentHistory from '@/app/components/PaymentHistory';

<PaymentHistory userId={currentUserId} />
```

## 🔒 Security Features

### Server-Side Validation
- All payment processing happens server-side
- Webhook signature verification
- JWT authentication required
- Input sanitization and validation
- Idempotency protection

### Client-Side Security
- No card data touches your servers
- Stripe Elements for PCI compliance
- Client secret validation
- Error handling and retry logic

### Database Security
- Encrypted sensitive fields
- Audit trail for all transactions
- Role-based access control
- Transaction authorization checks

## 🚦 Production Deployment

### 1. Environment Setup
```env
# Production Stripe Keys
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# Production App URL
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

### 2. Webhook Configuration
- Update webhook URL to production domain
- Enable webhook signature verification
- Monitor webhook delivery in Stripe Dashboard

### 3. SSL Certificate
Ensure your production site has a valid SSL certificate for secure payments.

### 4. Monitoring
- Monitor transactions in Stripe Dashboard
- Set up alerts for failed payments
- Monitor webhook delivery success rates

## 📊 Payment Flow

```
1. User clicks "Send Payment"
2. PaymentModal opens with amount/description form
3. Frontend creates PaymentIntent via /api/payments
4. Stripe Elements collects card information securely
5. Frontend confirms payment with Stripe
6. Stripe processes payment and sends webhook
7. Webhook handler updates transaction status
8. Users receive notifications
9. Transaction appears in payment history
```

## 🔍 Troubleshooting

### Common Issues

#### Webhook Signature Verification Failed
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Ensure webhook endpoint is accessible
- Verify request body is raw (not parsed)

#### Payment Intent Not Found
- Check if transaction was created in database
- Verify JWT authentication is working
- Ensure user permissions are correct

#### Card Declined
- Use test cards for development
- Check card expiry date and CVC
- Test with different card numbers

### Debugging Tips

1. **Check Stripe Dashboard** - View real-time events and webhook delivery
2. **Enable Logging** - Add console.logs to track payment flow
3. **Test Webhooks** - Use Stripe CLI to simulate events
4. **Monitor Network** - Check browser dev tools for API errors

## 🛡️ Compliance & Legal

### PCI Compliance
- Using Stripe Elements ensures PCI compliance
- No card data is stored or transmitted through your servers
- Stripe handles all sensitive payment processing

### Data Protection
- Store only necessary transaction metadata
- Encrypt sensitive fields in database
- Implement data retention policies
- Provide data export/deletion capabilities

### Terms of Service
Update your terms to include:
- Payment processing terms
- Refund policy
- Dispute resolution process
- Platform fee structure (if applicable)

## 📈 Monitoring & Analytics

### Key Metrics to Track
- Payment success rate
- Average transaction amount
- Failed payment reasons
- User engagement with payment features
- Revenue trends

### Stripe Dashboard Analytics
- Track transaction volume
- Monitor dispute rates
- Analyze payment method preferences
- Review geographic distribution

## 🆘 Support & Resources

### Stripe Documentation
- [Accept a Payment](https://stripe.com/docs/payments/accept-a-payment)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Guide](https://stripe.com/docs/testing)

### Support Channels
- Stripe Support: https://support.stripe.com
- Stripe Community: https://github.com/stripe
- Documentation: https://stripe.com/docs

---

## ✅ Production Checklist

Before going live, ensure:

- [ ] Production Stripe keys configured
- [ ] Webhook endpoints tested and working
- [ ] SSL certificate installed
- [ ] Database backup strategy in place
- [ ] Error monitoring configured
- [ ] User acceptance testing completed
- [ ] Legal terms updated
- [ ] Support processes documented
- [ ] Security audit completed
- [ ] Load testing performed

---

**🎉 Your payment system is now ready for secure peer-to-peer transactions!**

For additional support or custom modifications, refer to the codebase documentation or contact your development team.