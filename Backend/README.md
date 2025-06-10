# Backend Setup

This API requires Node.js with pnpm or npm.

1. Copy `.env.example` to `.env` and update the values.
2. Install dependencies:
   ```
   pnpm install
   ```
3. Start the development server:
   ```
   pnpm run dev
   ```

The server includes Stripe support. Ensure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are defined in your `.env`.
You can customize the trial duration with `TRIAL_PERIOD_DAYS`.
