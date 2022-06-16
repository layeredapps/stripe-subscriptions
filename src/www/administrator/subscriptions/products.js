const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.subscriptions.ProductsCount.get(req)
  const products = await global.api.administrator.subscriptions.Products.get(req)
  for (const i in products) {
    const product = formatStripeObject(products[i])
    products[i] = product
  }
  const offset = req.query ? req.query.offset || 0 : 0
  req.data = { products, total, offset }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  const removeElements = []
  if (req.data.products && req.data.products.length) {
    dashboard.HTML.renderTable(doc, req.data.products, 'product-row', 'products-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    for (const product of req.data.products) {
      if (product.active) {
        removeElements.push(`inactive-${product.id}`)
      } else {
        removeElements.push(`active-${product.id}`)
      }
    }
    removeElements.push('no-products')
  } else {
    removeElements.push('products-table')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
