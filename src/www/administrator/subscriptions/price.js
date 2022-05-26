const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-price.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.priceid) {
    req.error = 'invalid-priceid'
    req.removeContents = true
    req.data = {
      price: {
        priceid: ''
      }
    }
    return
  }
  let priceRaw
  try {
    priceRaw = await global.api.administrator.subscriptions.Price.get(req)
  } catch (error) {
    req.removeContents = true
    if (error.message === 'invalid-priceid' || error.message === 'invalid-price') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.data = {
      price: {
        priceid: req.query.priceid
      }
    }
    return
  }
  const price = formatStripeObject(priceRaw)
  req.data = { price }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.price, 'price')
  navbar.setup(doc, req.data.price)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('prices-table')
    }
  } else {
    if (req.data.price.unpublishedAt) {
      removeElements.push('published', 'not-published')
    } else if (req.data.price.publishedAt) {
      removeElements.push('unpublished', 'not-published')
    } else {
      removeElements.push('published', 'unpublished')
    }
    if (!req.data.price.amount) {
      removeElements.push('amount')
    } else {
      removeElements.push('free')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
