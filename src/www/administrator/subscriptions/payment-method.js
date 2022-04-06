const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.paymentmethodid) {
    throw new Error('invalid-paymentMethodid')
  }
  const paymentMethodRaw = await global.api.administrator.subscriptions.PaymentMethod.get(req)
  const paymentMethod = formatStripeObject(paymentMethodRaw)
  req.data = { paymentMethod }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.paymentMethod, 'payment_method')
  return dashboard.Response.end(req, res, doc)
}
