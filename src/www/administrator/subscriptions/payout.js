const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.payoutid) {
    throw new Error('invalid-payoutid')
  }
  const payoutRaw = await global.api.administrator.subscriptions.Payout.get(req)
  const payout = formatStripeObject(payoutRaw)
  req.data = { payout }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.payout, 'payout')
  if (req.data.payout.failure_code) {
    dashboard.HTML.renderTemplate(doc, null, req.data.payout.failure_code, `status-${req.data.payout.id}`)
  }
  return dashboard.Response.end(req, res, doc)
}
