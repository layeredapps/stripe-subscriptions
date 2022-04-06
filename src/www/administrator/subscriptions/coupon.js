const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-coupon.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.couponid) {
    throw new Error('invalid-couponid')
  }
  const couponRaw = await global.api.administrator.subscriptions.Coupon.get(req)
  const coupon = formatStripeObject(couponRaw)
  req.data = { coupon }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.coupon, 'coupon')
  navbar.setup(doc, req.data.coupon)
  const removeElements = []
  if (!req.data.coupon.publishedAt) {
    removeElements.push('published', 'unpublished')
  } else if (req.data.coupon.unpublishedAt) {
    removeElements.push('published', 'not-published')
  } else {
    removeElements.push('unpublished', 'not-published')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
