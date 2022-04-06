const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-invoice.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.invoiceid) {
    throw new Error('invalid-invoiceid')
  }
  const invoiceRaw = await global.api.administrator.subscriptions.Invoice.get(req)
  const invoice = formatStripeObject(invoiceRaw)
  req.data = { invoice }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.invoice, 'invoice')
  navbar.setup(doc, req.data.invoice)
  return dashboard.Response.end(req, res, doc)
}
