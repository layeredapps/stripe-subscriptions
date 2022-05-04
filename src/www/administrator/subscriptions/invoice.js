const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-invoice.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.invoiceid) {
    req.error = 'invalid-invoiceid'
    req.removeContents = true
    req.data = {
      invoice: {
        invoiceid: ''
      }
    }
    return
  }
  let invoiceRaw
  try {
    invoiceRaw = await global.api.administrator.subscriptions.Invoice.get(req)
  } catch (error) {
    if (error.message === 'invalid-invoiceid' || error.message === 'invalid-invoice') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.removeContents = true
    req.data = {
      invoice: {
        invoiceid: req.query.invoiceid
      }
    }
    return
  }
  const invoice = formatStripeObject(invoiceRaw)
  req.data = { invoice }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.invoice, 'invoice')
  navbar.setup(doc, req.data.invoice)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const invoiceTable = doc.getElementById('invoices-table')
      invoiceTable.parentNode.removeChild(invoiceTable)
    }
  }
  return dashboard.Response.end(req, res, doc)
}
