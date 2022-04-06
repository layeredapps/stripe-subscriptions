const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')
const statusFields = [
  'requires_capture', 'requires_setup_method', 'requires_payment_method', 'processing', 'requires_confirmation', 'requires_action', 'canceled', 'succeeded'
]

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.setupintentid) {
    throw new Error('invalid-setupIntentid')
  }
  const setupIntentRaw = await global.api.administrator.subscriptions.SetupIntent.get(req)
  const setupIntent = formatStripeObject(setupIntentRaw)
  req.data = { setupIntent }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.setupIntent, 'setup_intent')
  const removeElements = []
  for (const status of statusFields) {
    if (req.data.setupIntent.status !== status) {
      removeElements.push(status)
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
