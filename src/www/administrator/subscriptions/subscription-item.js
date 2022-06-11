const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.subscriptionitemid) {
    req.error = 'invalid-subscriptionitemid'
    req.removeContents = true
    req.data = {
      subscriptionItem: {
        subscriptionitemid: '',
        price: {
          transform_quantity: {}
        }
      }
    }
    return
  }
  let subscriptionItemRaw
  try {
    subscriptionItemRaw = await global.api.administrator.subscriptions.SubscriptionItem.get(req)
  } catch (error) {
    if (error.message === 'invalid-subscriptionitemid' || error.message === 'invalid-subscription') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.removeContents = true
    req.data = {
      subscriptionItem: {
        subscriptionitemid: req.query.subscriptionitemid,
        price: {
          transform_quantity: {}
        }
      }
    }
    return
  }
  const subscriptionItem = formatStripeObject(subscriptionItemRaw)
  subscriptionItem.price.transform_quantity = subscriptionItem.price.transform_quantity || {}
  req.data = { subscriptionItem }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.subscriptionItem, 'subscription_item')
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('subscription-items-table')
    }
  } else {
    if (req.data.subscriptionItem.price.billing_scheme !== 'per_unit') {
      removeElements.push('unit-billing')
      for (const tier of req.data.subscriptionItem.price.tiers) {
        tier.object = 'tier'
      }
      dashboard.HTML.renderTable(doc, req.data.subscriptionItem.price.tiers, 'tier-row', 'tiers-table')
    } else {
      removeElements.push('pricing-tiers')
    }
    if (req.data.subscriptionItem.price.type === 'one_time') {
      removeElements.push('recurring-billing')
    }
    if (!req.data.subscriptionItem.price.transform_quantity.divide_by) {
      removeElements.push('transform-quantity')
    }
    if (req.data.subscriptionItem.tax_rates.length) {
      dashboard.HTML.renderTable(doc, req.data.subscriptionItem.tax_rates, 'tax-rate-row', 'tax-rates-table')
    } else {
      const taxRates = doc.getElementById('tax-rates')
      taxRates.parentNode.removeChild(taxRates)
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
