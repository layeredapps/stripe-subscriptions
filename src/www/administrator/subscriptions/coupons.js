const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.subscriptions.CouponsCount.get(req)
  const coupons = await global.api.administrator.subscriptions.Coupons.get(req)
  const offset = req.query ? req.query.offset || 0 : 0
  if (coupons && coupons.length) {
    for (const i in coupons) {
      const coupon = formatStripeObject(coupons[i])
      coupons[i] = coupon
    }
  }
  req.data = { coupons, total, offset }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  const removeElements = []
  if (req.data.coupons && req.data.coupons.length) {
    dashboard.HTML.renderTable(doc, req.data.coupons, 'coupon-row', 'coupons-table')
    for (const coupon of req.data.coupons) {
      if (coupon.amount_off) {
        removeElements.push(`percent_off-${coupon.id}`)
      } else {
        removeElements.push(`amount_off-${coupon.id}`)
      }
      if (coupon.unpublishedAt) {
        removeElements.push(`draft-coupon-${coupon.id}`, `published-coupon-${coupon.id}`)
      } else if (coupon.publishedAt) {
        removeElements.push(`draft-coupon-${coupon.id}`, `unpublished-coupon-${coupon.id}`)
      } else {
        removeElements.push(`published-coupon-${coupon.id}`, `unpublished-coupon-${coupon.id}`)
      }
    }
    if (req.data.total <= global.pageSize) {
      removeElements.push('page-links')
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    removeElements.push('no-coupons')
  } else {
    removeElements.push('coupons-table')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
