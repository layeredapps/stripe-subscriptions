const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.subscriptions.PayoutsCount.get(req)
  const payouts = await global.api.administrator.subscriptions.Payouts.get(req)
  if (payouts && payouts.length) {
    for (const i in payouts) {
      const payout = formatStripeObject(payouts[i])
      payouts[i] = payout
    }
  }
  const offset = req.query ? req.query.offset || 0 : 0
  let createdChartDays, createdChartHighlights, createdChartValues
  if (offset === 0) {
    req.query.keys = dashboard.Metrics.metricKeys('payouts-created', 365).join(',')
    const createdChart = await global.api.administrator.MetricKeys.get(req)
    const createdChartMaximum = dashboard.Metrics.maximumDay(createdChart)
    createdChartDays = dashboard.Metrics.days(createdChart, createdChartMaximum)
    createdChartHighlights = dashboard.Metrics.highlights(createdChart, createdChartDays)
    createdChartValues = dashboard.Metrics.chartValues(createdChartMaximum)
  }
  req.data = { payouts, total, offset, createdChartDays, createdChartHighlights, createdChartValues }
}

async function renderPage (req, res, messageTemplate) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (req.data.payouts && req.data.payouts.length) {
    dashboard.HTML.renderTable(doc, req.data.payouts, 'payout-row', 'payouts-table')
    for (const payout of req.data.payouts) {
      if (payout.failure_code) {
        dashboard.HTML.renderTemplate(doc, null, payout.failure_code, `status-${payout.id}`)
      }
    }
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noPayouts = doc.getElementById('no-payouts')
    noPayouts.parentNode.removeChild(noPayouts)
    if (req.data.createdChartDays && req.data.createdChartDays.length) {
      dashboard.HTML.renderList(doc, req.data.createdChartDays, 'chart-column', 'created-chart')
      dashboard.HTML.renderList(doc, req.data.createdChartValues, 'chart-value', 'created-values')
      dashboard.HTML.renderTemplate(doc, req.data.createdChartHighlights, 'metric-highlights', 'created-highlights')
    } else {
      const createdChart = doc.getElementById('created-chart-container')
      createdChart.parentNode.removeChild(createdChart)
    }
  } else {
    const payoutsTable = doc.getElementById('payouts-table')
    payoutsTable.parentNode.removeChild(payoutsTable)
    const createdChart = doc.getElementById('created-chart-container')
    createdChart.parentNode.removeChild(createdChart)
  }
  return dashboard.Response.end(req, res, doc)
}
