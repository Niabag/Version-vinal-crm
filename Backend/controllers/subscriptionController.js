const Subscription = require('../models/subscription');
const User = require('../models/user');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Get subscription status for authenticated user
exports.getStatus = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ userId: req.userId });
    if (!sub) {
      return res.json({ status: 'none' });
    }
    res.json({
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      trialEndDate: sub.trialEndDate
    });
  } catch (err) {
    console.error('Error fetching subscription status:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Start a free trial (14 days)
exports.startTrial = async (req, res) => {
  try {
    const existing = await Subscription.findOne({ userId: req.userId });
    if (existing) {
      return res.status(400).json({ message: 'Subscription already exists' });
    }
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);
    const sub = new Subscription({
      userId: req.userId,
      status: 'trial',
      trialEndDate: trialEnd
    });
    await sub.save();
    res.status(201).json(sub);
  } catch (err) {
    console.error('Error starting trial:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create Stripe checkout session
exports.createCheckoutSession = async (req, res) => {
  try {
    const { priceId } = req.body;
    const user = await User.findById(req.userId);
    let subscription = await Subscription.findOne({ userId: req.userId });

    let customerId = subscription && subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email
      });
      customerId = customer.id;
      if (!subscription) {
        subscription = new Subscription({ userId: req.userId });
      }
      subscription.stripeCustomerId = customerId;
      await subscription.save();
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/subscription-success`,
      cancel_url: process.env.FRONTEND_URL
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create portal session to manage subscription
exports.createPortalSession = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ userId: req.userId });
    if (!sub || !sub.stripeCustomerId) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: process.env.FRONTEND_URL
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating portal session:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel subscription via Stripe
exports.cancelSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ userId: req.userId });
    if (!sub || !sub.stripeSubscriptionId) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    await stripe.subscriptions.del(sub.stripeSubscriptionId);
    sub.status = 'canceled';
    await sub.save();
    res.json({ message: 'Subscription canceled' });
  } catch (err) {
    console.error('Error canceling subscription:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Webhook to handle Stripe events
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const subscription = event.data.object;
    const subDoc = await Subscription.findOne({ stripeSubscriptionId: subscription.id });
    if (subDoc) {
      subDoc.status = subscription.status === 'active' ? 'active' : subDoc.status;
      subDoc.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      await subDoc.save();
    }
  }
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const subDoc = await Subscription.findOne({ stripeSubscriptionId: subscription.id });
    if (subDoc) {
      subDoc.status = 'canceled';
      await subDoc.save();
    }
  }

  res.json({ received: true });
};
