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
  let createdChartDays, createdChartHighlights, createdChartValues
  if (offset === 0) {
    req.query.keys = dashboard.Metrics.metricKeys('invoices-created', 365).join(',')
    const createdChart = await global.api.administrator.MetricKeys.get(req)
    const createdChartMaximum = dashboard.Metrics.maximumDay(createdChart)
    createdChartDays = dashboard.Metrics.days(createdChart, createdChartMaximum)
    createdChartHighlights = dashboard.Metrics.highlights(createdChart, createdChartDays)
    createdChartValues = dashboard.Metrics.chartValues(createdChartMaximum)
  }
  req.data = { invoices, total, offset, createdChartDays, createdChartHighlights, createdChartValues }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  const removeElements = []
  if (req.data.invoices && req.data.invoices.length) {
    dashboard.HTML.renderTable(doc, req.data.invoices, 'invoice-row', 'invoices-table')
    for (const invoice of req.data.invoices) {
      if (invoice.status === 'open') {
        removeElements.push(`paid-${invoice.id}`)
      } else {
        removeElements.push(`open-${invoice.id}`)
      }
      if (invoice.total > 0) {
         if (invoice.amount_remaining) {
          removeElements.push(`no-total-${invoice.id}`, `no-remaining-${invoice.id}`)
         } else {
          removeElements.push(`no-total-${invoice.id}`, `remaining-${invoice.id}`)
         }
      } else {
        removeElements.push(`total-${invoice.id}`, `remaining-${invoice.id}`)
      }
    }
    if (req.data.total <= global.pageSize) {
      removeElements.push('page-links')
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    removeElements.push('no-invoices')
    if (req.data.createdChartDays && req.data.createdChartDays.length) {
      dashboard.HTML.renderList(doc, req.data.createdChartDays, 'chart-column', 'created-chart')
      dashboard.HTML.renderList(doc, req.data.createdChartValues, 'chart-value', 'created-values')
      dashboard.HTML.renderTemplate(doc, req.data.createdChartHighlights, 'metric-highlights', 'created-highlights')
    } else {
      removeElements.push('created-chart-container')
    }
  } else {
    removeElements.push('invoices-table', 'created-chart-container')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
