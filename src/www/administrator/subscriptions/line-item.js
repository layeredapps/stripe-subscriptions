const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.lineitemid) {
    req.error = 'invalid-lineitemid'
    req.removeContents = true
    req.data = {
      invoiceItem: {
        lineitemid: ''
      }
    }
    return
  }
  let invoiceItemRaw
  try {
    invoiceItemRaw = await global.api.administrator.subscriptions.LineItem.get(req)
  } catch (error) {
    if (error.message === 'invalid-lineitemid' || error.message === 'invalid-invoice') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.removeContents = true
    req.data = {
      invoiceItem: {
        lineitemid: req.query.lineitemid
      }
    }
    return
  }
  const invoiceItem = formatStripeObject(invoiceItemRaw)
  req.data = { invoiceItem }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.invoiceItem, 'line_item')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const invoiceTable = doc.getElementById('invoices-table')
      invoiceTable.parentNode.removeChild(invoiceTable)
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (req.data.invoiceItem.tax_rates.length) {
    dashboard.HTML.renderTable(doc, req.data.invoiceItem.tax_rates, 'tax-rate-row', 'tax-rates-table')
  } else {
    const taxRates = doc.getElementById('tax-rates')
    taxRates.parentNode.removeChild(taxRates)
  }
  return dashboard.Response.end(req, res, doc)
}
