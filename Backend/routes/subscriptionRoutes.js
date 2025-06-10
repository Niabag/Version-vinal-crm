const express = require('express');
const {
  getStatus,
  startTrial,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  webhook
} = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/status', auth, getStatus);
router.post('/trial', auth, startTrial);
router.post('/create-checkout', auth, createCheckoutSession);
router.post('/create-portal', auth, createPortalSession);
router.post('/cancel', auth, cancelSubscription);
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

module.exports = router;
