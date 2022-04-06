const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-product.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.productid) {
    throw new Error('invalid-productid')
  }
  const productRaw = await global.api.administrator.subscriptions.Product.get(req)
  const product = formatStripeObject(productRaw)
  req.data = { product }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.product, 'product')
  navbar.setup(doc, req.data.product)
  if (req.data.product.unpublishedAt) {
    const published = doc.getElementById('published')
    published.parentNode.removeChild(published)
    const notPublished = doc.getElementById('not-published')
    notPublished.parentNode.removeChild(notPublished)
  } else if (req.data.product.publishedAt) {
    const unpublished = doc.getElementById('unpublished')
    unpublished.parentNode.removeChild(unpublished)
    const notPublished = doc.getElementById('not-published')
    notPublished.parentNode.removeChild(notPublished)
  } else {
    const published = doc.getElementById('published')
    published.parentNode.removeChild(published)
    const unpublished = doc.getElementById('unpublished')
    unpublished.parentNode.removeChild(unpublished)
  }
  return dashboard.Response.end(req, res, doc)
}
