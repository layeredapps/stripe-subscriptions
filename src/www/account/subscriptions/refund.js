const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.refundid) {
    throw new Error('invalid-refundid')
  }
  const refundRaw = await global.api.user.subscriptions.Refund.get(req)
  const refund = formatStripeObject(refundRaw)
  req.data = { refund }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.refund, 'refund')
  return dashboard.Response.end(req, res, doc)
}
