const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const total = await global.api.user.subscriptions.InvoicesCount.get(req)
  const invoices = await global.api.user.subscriptions.Invoices.get(req)
  const offset = req.query.offset || 0
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
  const removeElements = []
  if (req.data.invoices && req.data.invoices.length) {
    dashboard.HTML.renderTable(doc, req.data.invoices, 'invoice-row', 'invoices-table')
    if (req.data.total <= global.pageSize) {
      removeElements.push('page-links')
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    for (const invoice of req.data.invoices) {
      if (invoice.status === 'open') {
        removeElements.push(`paid-${invoice.id}`)
      } else {
        removeElements.push(`open-${invoice.id}`)
      }
      if (invoice.total) {
        removeElements.push(`no-total-${invoice.id}`)
      } else {
        removeElements.push(`total-${invoice.id}`)
      }
    }
    removeElements.push('no-invoices')
  } else {
    removeElements.push('invoices-table')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
