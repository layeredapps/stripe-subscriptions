const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.subscriptions.PricesCount.get(req)
  const prices = await global.api.administrator.subscriptions.Prices.get(req)
  const offset = req.query ? req.query.offset || 0 : 0
  if (prices && prices.length) {
    for (const i in prices) {
      const price = formatStripeObject(prices[i])
      prices[i] = price
    }
  }
  req.data = { prices, total, offset }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  const removeElements = []
  if (req.data.prices && req.data.prices.length) {
    dashboard.HTML.renderTable(doc, req.data.prices, 'price-row', 'prices-table')
    for (const price of req.data.prices) {
      if (price.active) {
        removeElements.push(`inactive-price-${price.priceid}`)
      } else {
        removeElements.push(`active-price-${price.priceid}`)
      }
      if (!price.amount) {
        removeElements.push(`amount-price-${price.priceid}`)
      } else {
        removeElements.push(`free-price-${price.priceid}`)
      }
    }
    if (req.data.total <= global.pageSize) {
      removeElements.push('page-links')
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    removeElements.push('no-prices')
  } else {
    removeElements.push('prices-table')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
