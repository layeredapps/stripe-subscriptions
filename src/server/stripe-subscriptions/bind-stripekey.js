module.exports = {
  after: bindStripeKey
}

async function bindStripeKey (req) {
  req.stripeKey = req.stripeKey || {
    apiKey: process.env.SUBSCRIPTIONS_STRIPE_KEY || process.env.STRIPE_KEY
  }
}
