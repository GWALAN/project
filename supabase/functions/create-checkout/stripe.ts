import Stripe from 'npm:stripe@13.7.0';

// Initialize Stripe with the secret key from environment variables
export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});