const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.subscriptions.CustomersCount.get(req)
  const customers = await global.api.administrator.subscriptions.Customers.get(req)
  const offset = req.query ? req.query.offset || 0 : 0
  if (customers && customers.length) {
    for (const i in customers) {
      const customer = formatStripeObject(customers[i])
      req.query.customerid = customer.customerid
      const numSubscriptions = await global.api.administrator.subscriptions.SubscriptionsCount.get(req)
      customer.numSubscriptions = numSubscriptions
      customers[i] = customer
    }
  }
  let createdChartDays, createdChartHighlights, createdChartValues
  if (offset === 0) {
    req.query.keys = dashboard.Metrics.metricKeys('customers-created', 365).join(',')
    const createdChart = await global.api.administrator.MetricKeys.get(req)
    const createdChartMaximum = dashboard.Metrics.maximumDay(createdChart)
    createdChartDays = dashboard.Metrics.days(createdChart, createdChartMaximum)
    createdChartHighlights = dashboard.Metrics.highlights(createdChart, createdChartDays)
    createdChartValues = dashboard.Metrics.chartValues(createdChartMaximum)
  }
  req.data = { customers, total, offset, createdChartDays, createdChartHighlights, createdChartValues }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  const removeElements = []
  if (req.data.customers && req.data.customers.length) {
    dashboard.HTML.renderTable(doc, req.data.customers, 'customer-row', 'customers-table')
    if (req.data.total <= global.pageSize) {
      removeElements.push('page-links')
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    for (const customer of req.data.customers) {
      if (!customer.discount) {
        removeElements.push(`has-discount-${customer.id}`)
      } else {
        removeElements.push(`no-discount-${customer.id}`)
      }
    }
    const noCustomers = doc.getElementById('no-customers')
    noCustomers.parentNode.removeChild(noCustomers)
    if (req.data.createdChartDays && req.data.createdChartDays.length) {
      dashboard.HTML.renderList(doc, req.data.createdChartDays, 'chart-column', 'created-chart')
      dashboard.HTML.renderList(doc, req.data.createdChartValues, 'chart-value', 'created-values')
      dashboard.HTML.renderTemplate(doc, req.data.createdChartHighlights, 'metric-highlights', 'created-highlights')
    } else {
      removeElements.push('created-chart-container')
    }
  } else {
    removeElements.push('customers-table', 'created-chart-container')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
