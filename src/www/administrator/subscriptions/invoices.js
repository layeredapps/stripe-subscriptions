const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.subscriptions.InvoicesCount.get(req)
  const invoices = await global.api.administrator.subscriptions.Invoices.get(req)
  const offset = req.query ? req.query.offset || 0 : 0
  if (invoices && invoices.length) {
    for (const i in invoices) {
      const invoice = formatStripeObject(invoices[i])
      invoices[i] = invoice
    }
  }
  req.data = { invoices, total, offset }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (req.data.invoices && req.data.invoices.length) {
    dashboard.HTML.renderTable(doc, req.data.invoices, 'invoice-row', 'invoices-table')
    for (const invoice of req.data.invoices) {
      if (invoice.status === 'open') {
        const paid = doc.getElementById(`paid-${invoice.id}`)
        paid.parentNode.removeChild(paid)
      } else {
        const open = doc.getElementById(`open-${invoice.id}`)
        open.parentNode.removeChild(open)
      }
    }
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noInvoices = doc.getElementById('no-invoices')
    noInvoices.parentNode.removeChild(noInvoices)
  } else {
    const invoicesTable = doc.getElementById('invoices-table')
    invoicesTable.parentNode.removeChild(invoicesTable)
  }
  return dashboard.Response.end(req, res, doc)
}
