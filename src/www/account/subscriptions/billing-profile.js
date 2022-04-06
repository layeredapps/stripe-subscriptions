const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.customerid) {
    throw new Error('invalid-customerid')
  }
  const customerRaw = await global.api.user.subscriptions.Customer.get(req)
  const customer = formatStripeObject(customerRaw)
  req.data = { customer }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.customer, 'customer')
  return dashboard.Response.end(req, res, doc)
}
