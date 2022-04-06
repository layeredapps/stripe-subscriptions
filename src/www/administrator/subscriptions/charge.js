const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-charge.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.chargeid) {
    throw new Error('invalid-chargeid')
  }
  const chargeRaw = await global.api.administrator.subscriptions.Charge.get(req)
  const charge = formatStripeObject(chargeRaw)
  req.data = { charge: charge }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.charge, 'charge')
  navbar.setup(doc, req.data.charge)
  return dashboard.Response.end(req, res, doc)
}
