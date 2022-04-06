const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const plans = await global.api.administrator.subscriptions.Plans.get(req)
  if (plans && plans.length) {
    for (const i in plans) {
      const plan = formatStripeObject(plans[i])
      plans[i] = plan
    }
  }
  const coupons = await global.api.administrator.subscriptions.Coupons.get(req)
  if (coupons && coupons.length) {
    for (const i in coupons) {
      const coupon = formatStripeObject(coupons[i])
      coupons[i] = coupon
    }
  }
  const subscriptions = await global.api.administrator.subscriptions.Subscriptions.get(req)
  if (subscriptions && subscriptions.length) {
    for (const i in subscriptions) {
      const subscription = formatStripeObject(subscriptions[i])
      subscriptions[i] = subscription
    }
  }
  req.data = { plans, coupons, subscriptions }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (req.data.plans && req.data.plans.length) {
    dashboard.HTML.renderTable(doc, req.data.plans, 'plan-row', 'plans-table')
    for (const plan of req.data.plans) {
      const draftPlan = doc.getElementById(`draft-plan-${plan.id}`)
      const publishedPlan = doc.getElementById(`published-plan-${plan.id}`)
      const unpublishedPlan = doc.getElementById(`unpublished-plan-${plan.id}`)
      if (plan.publishedAt) {
        draftPlan.parentNode.removeChild(draftPlan)
        if (plan.unpublishedAt) {
          publishedPlan.parentNode.removeChild(publishedPlan)
        } else {
          unpublishedPlan.parentNode.removeChild(unpublishedPlan)
        }
      } else {
        publishedPlan.parentNode.removeChild(publishedPlan)
        unpublishedPlan.parentNode.removeChild(unpublishedPlan)
      }
    }
    const noPlans = doc.getElementById('no-plans')
    noPlans.parentNode.removeChild(noPlans)
  } else {
    const plansTable = doc.getElementById('plans-table')
    plansTable.parentNode.removeChild(plansTable)
  }
  if (req.data.coupons && req.data.coupons.length) {
    dashboard.HTML.renderTable(doc, req.data.coupons, 'coupon-row', 'coupons-table')
    for (const coupon of req.data.coupons) {
      const draftCoupon = doc.getElementById(`draft-coupon-${coupon.id}`)
      const publishedCoupon = doc.getElementById(`published-coupon-${coupon.id}`)
      const unpublishedCoupon = doc.getElementById(`unpublished-coupon-${coupon.id}`)
      if (coupon.unpublishedAt) {
        draftCoupon.parentNode.removeChild(draftCoupon)
        publishedCoupon.parentNode.removeChild(publishedCoupon)
      } else if (coupon.publishedAt) {
        draftCoupon.parentNode.removeChild(draftCoupon)
        unpublishedCoupon.parentNode.removeChild(unpublishedCoupon)
      } else {
        publishedCoupon.parentNode.removeChild(publishedCoupon)
        unpublishedCoupon.parentNode.removeChild(unpublishedCoupon)
      }
    }
    const noCoupons = doc.getElementById('no-coupons')
    noCoupons.parentNode.removeChild(noCoupons)
  } else {
    const couponsTable = doc.getElementById('coupons-table')
    couponsTable.parentNode.removeChild(couponsTable)
  }
  if (req.data.subscriptions && req.data.subscriptions.length) {
    dashboard.HTML.renderTable(doc, req.data.subscriptions, 'subscription-row', 'subscriptions-table')
    const noSubscriptions = doc.getElementById('no-subscriptions')
    noSubscriptions.parentNode.removeChild(noSubscriptions)
  } else {
    const subscriptionsTable = doc.getElementById('subscriptions-table')
    subscriptionsTable.parentNode.removeChild(subscriptionsTable)
  }
  return dashboard.Response.end(req, res, doc)
}
