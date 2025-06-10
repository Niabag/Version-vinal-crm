const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  status: {
    type: String,
    enum: ['trial', 'active', 'canceled', 'expired', 'past_due'],
    default: 'trial'
  },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  currentPeriodEnd: Date,
  trialEndDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
