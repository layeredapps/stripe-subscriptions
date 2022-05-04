const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-subscription.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.subscriptionid) {
    req.error = 'invalid-subscriptionid'
    req.removeContents = true
    req.data = {
      subscription: {
        subscriptionid: ''
      }
    }
    return
  }
  let subscriptionRaw
  try {
    subscriptionRaw = await global.api.administrator.subscriptions.Subscription.get(req)
  } catch (error) {
    req.removeContents = true
    if (error.message === 'invalid-subscriptionid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.data = {
      subscription: {
        subscriptionid: req.query.subscriptionid
      }
    }
    return
  }
  const subscription = formatStripeObject(subscriptionRaw)
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      subscription
    }
    return
  }
  req.query.planid = subscription.planid
  let planRaw
  try {
    planRaw = await global.api.administrator.subscriptions.Plan.get(req)
  } catch (error) {
    req.removeContents = true
    if (error.message === 'invalid-planid' || error.message === 'invalid-plan') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.data = {
      subscription: {
        subscriptionid: req.query.subscriptionid
      }
    }
    return
  }
  if (!planRaw.stripeObject.amount) {
    req.error = 'invalid-subscription-free'
    req.removeContents = true
    req.data = {
      subscription: {
        subscriptionid: ''
      }
    }
    return
  }
  if (subscription.cancel_at_period_end) {
    req.error = 'invalid-subscription-canceling'
    req.removeContents = true
    req.data = {
      subscription: {
        subscriptionid: ''
      }
    }
    return
  }
  if (subscription.discount && subscription.discount.coupon && subscription.discount.coupon.id) {
    req.error = 'already-discounted'
    req.removeContents = true
    req.data = {
      subscription: {
        subscriptionid: ''
      }
    }
    return
  }
  req.query.all = true
  const coupons = await global.api.administrator.subscriptions.Coupons.get(req)
  const published = []
  if (coupons && coupons.length) {
    for (const i in coupons) {
      const coupon = formatStripeObject(coupons[i])
      if (coupon.publishedAt && !coupon.unpublishedAt) {
        published.push(coupon)
      }
    }
  }
  req.data = { subscription, coupons: published }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.subscription, 'subscription')
  navbar.setup(doc, req.data.subscription)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (req.data.coupons && req.data.coupons.length) {
    dashboard.HTML.renderList(doc, req.data.coupons, 'coupon-option', 'couponid')
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || !req.body.couponid) {
    return renderPage(req, res)
  }
  if (!req.data.coupons || !req.data.coupons.length) {
    return renderPage(req, res, 'invalid-couponid')
  }
  let coupon
  try {
    coupon = await global.api.administrator.subscriptions.Coupon.get(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (coupon.unpublishedAt ||
      !coupon.publishedAt ||
      (coupon.max_redemptions &&
      coupon.max_redemptions === coupon.times_redeemed)) {
    return renderPage(req, res, 'invalid-coupon')
  }
  try {
    await global.api.administrator.subscriptions.SetSubscriptionCoupon.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?subscriptionid=${req.query.subscriptionid}&message=success`
    })
    return res.end()
  }
}
