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
  if (req.data.products && req.data.products.length) {
    dashboard.HTML.renderTable(doc, req.data.products, 'product-row', 'products-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    for (const product of req.data.products) {
      if (product.unpublishedAt) {
        const published = doc.getElementById(`published-${product.id}`)
        published.parentNode.removeChild(published)
        const notPublished = doc.getElementById(`not-published-${product.id}`)
        notPublished.parentNode.removeChild(notPublished)
      } else if (product.publishedAt) {
        const unpublished = doc.getElementById(`unpublished-${product.id}`)
        unpublished.parentNode.removeChild(unpublished)
        const notPublished = doc.getElementById(`not-published-${product.id}`)
        notPublished.parentNode.removeChild(notPublished)
      } else {
        const published = doc.getElementById(`published-${product.id}`)
        published.parentNode.removeChild(published)
        const unpublished = doc.getElementById(`unpublished-${product.id}`)
        unpublished.parentNode.removeChild(unpublished)
      }
    }
    const noProducts = doc.getElementById('no-products')
    noProducts.parentNode.removeChild(noProducts)
  } else {
    const productsTable = doc.getElementById('products-table')
    productsTable.parentNode.removeChild(productsTable)
  }
  return dashboard.Response.end(req, res, doc)
}
