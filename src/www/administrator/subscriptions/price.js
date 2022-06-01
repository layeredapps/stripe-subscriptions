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
        priceid: '',
        transform_quantity: {}
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
        priceid: req.query.priceid,
        transform_quantity: {}
      }
    }
    return
  }
  const price = formatStripeObject(priceRaw)
  price.transform_quantity = price.transform_quantity || {}
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
    if (req.data.price.billing_scheme !== 'per_unit') {
      removeElements.push('unit-billing')
      for (const tier of req.data.price.tiers) {
        tier.object = 'tier'
      }
      dashboard.HTML.renderTable(doc, req.data.price.tiers, 'tier-row', 'tiers-table')
    } else {
      removeElements.push('pricing-tiers')
    }
    if (req.data.price.type === 'one_time' ){
      removeElements.push('recurring-billing')
    }
     if (!req.data.price.transform_quantity.divide_by) {
      removeElements.push('transform-quantity')
     }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
