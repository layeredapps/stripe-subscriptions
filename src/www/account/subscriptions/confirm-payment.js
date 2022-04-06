const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.invoiceid) {
    throw new Error('invalid-invoiceid')
  }
  const invoiceRaw = await global.api.user.subscriptions.Invoice.get(req)
  if (!invoiceRaw) {
    throw new Error('invalid-invoiceid')
  }
  const invoice = formatStripeObject(invoiceRaw)
  if (invoice.paid || !invoice.amount_due || invoice.status !== 'open') {
    throw new Error('invalid-invoice')
  }
  req.query.paymentintentid = invoice.payment_intent
  const paymentIntentRaw = await global.api.user.subscriptions.PaymentIntent.get(req)
  const paymentIntent = formatStripeObject(paymentIntentRaw)
  paymentIntent.stripePublishableKey = global.stripePublishableKey
  if (!paymentIntent) {
    throw new Error('invalid-invoice')
  }
  req.data = { paymentIntent }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.paymentIntent, 'payment_intent')
  res.setHeader('content-security-policy',
    'default-src * \'unsafe-inline\'; ' +
  `style-src https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline'; ` +
  `script-src * https://m.stripe.com/ https://m.stripe.network/  https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline' 'unsafe-eval'; ` +
  'frame-src https://m.stripe.com/ https://m.stripe.network/  https://js.stripe.com/ \'unsafe-inline\' ; ' +
  'connect-src https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\' ; ')
  return dashboard.Response.end(req, res, doc)
}
