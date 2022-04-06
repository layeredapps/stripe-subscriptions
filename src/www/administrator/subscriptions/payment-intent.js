const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.paymentintentid) {
    throw new Error('invalid-paymentIntentid')
  }
  const paymentIntentRaw = await global.api.administrator.subscriptions.PaymentIntent.get(req)
  const paymentIntent = formatStripeObject(paymentIntentRaw)
  req.data = { paymentIntent }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.paymentIntent, 'payment_intent')
  const removeElements = []
  for (const status of ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'canceled', 'succeeded']) {
    if (req.data.paymentIntent.status !== status) {
      removeElements.push(status)
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
