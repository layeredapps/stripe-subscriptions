const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-coupon.js')
const formatStripeObject = require('../../../stripe-object.js')
const statuses = ['active', 'trialing', 'past_due', 'canceled', 'unpaid']

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.couponid) {
    req.error = 'invalid-couponid'
    req.removeContents = true
    req.data = {
      coupon: {
        couponid: ''
      }
    }
    return
  }
  let couponRaw
  try {
    couponRaw = await global.api.administrator.subscriptions.Coupon.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      coupon: {
        couponid: ''
      }
    }
    if (error.message === 'invalid-couponid' || error.message === 'invalid-coupon') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const coupon = formatStripeObject(couponRaw)
  req.query.all = true
  const customers = await global.api.administrator.subscriptions.Customers.get(req)
  if (customers && customers.length) {
    for (const i in customers) {
      const customer = formatStripeObject(customers[i])
      customers[i] = customer
    }
  }
  delete (req.query.customerid)
  const subscriptions = await global.api.administrator.subscriptions.Subscriptions.get(req)
  if (subscriptions && subscriptions.length) {
    for (const i in subscriptions) {
      const subscription = formatStripeObject(subscriptions[i])
      subscriptions[i] = subscription
    }
  }
  req.data = { coupon, customers, subscriptions }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.coupon, 'coupon')
  navbar.setup(doc, req.data.coupon)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('coupons-table')
    }
  } else {
    if (!req.data.coupon.publishedAt) {
      removeElements.push('published', 'unpublished')
    } else if (req.data.coupon.unpublishedAt) {
      removeElements.push('published', 'not-published')
    } else {
      removeElements.push('unpublished', 'not-published')
    }
    if (req.data.coupon.amount_off) {
      removeElements.push('percent_off-heading', 'percent_off-value')
    } else {
      removeElements.push('amount_off-heading', 'amount_off-value')
    }
    if (req.data.customers && req.data.customers.length) {
      dashboard.HTML.renderTable(doc, req.data.customers, 'customer-row', 'customers-table')
      removeElements.push('no-customers')
    } else {
      removeElements.push('customers-table')
    }
    if (req.data.subscriptions && req.data.subscriptions.length) {
      dashboard.HTML.renderTable(doc, req.data.subscriptions, 'subscription-row', 'subscriptions-table')
      for (const subscription of req.data.subscriptions) {
        if (subscription.cancel_at_period_end) {
          subscription.status = 'canceling'
        }
        for (const status of statuses) {
          if (subscription.status === status) {
            continue
          }
          removeElements.push(`${status}-subscription-${subscription.id}`)
        }
        if (subscription.status === 'active') {
          removeElements.push(`canceling-subscription-${subscription.id}`)
        } else {
          if (!subscription.cancel_at_period_end) {
            removeElements.push(`canceling-subscription-${subscription.id}`)
          }
        }
      }
      removeElements.push('no-subscriptions')
    } else {
      removeElements.push('subscriptions-table')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
