const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.subscriptions.TaxRatesCount.get(req)
  const taxRates = await global.api.administrator.subscriptions.TaxRates.get(req)
  if (taxRates && taxRates.length) {
    for (const i in taxRates) {
      const taxRate = formatStripeObject(taxRates[i])
      taxRates[i] = taxRate
    }
  }
  const offset = req.query ? req.query.offset || 0 : 0
  req.data = { taxRates, total, offset }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (req.data.taxRates && req.data.taxRates.length) {
    dashboard.HTML.renderTable(doc, req.data.taxRates, 'tax-rate-row', 'tax-rates-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noTaxRates = doc.getElementById('no-tax-rates')
    noTaxRates.parentNode.removeChild(noTaxRates)
  } else {
    const taxRatesTable = doc.getElementById('tax-rates-table')
    taxRatesTable.parentNode.removeChild(taxRatesTable)
  }
  return dashboard.Response.end(req, res, doc)
}
