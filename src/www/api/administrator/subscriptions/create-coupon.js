const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
    if (!req.body || !req.body.couponid) {
      throw new Error('invalid-couponid')
    }
    if (!req.body.couponid.match(/^[a-zA-Z0-9_]+$/) ||
      global.minimumCouponLength > req.body.couponid.length ||
      global.maximumCouponLength < req.body.couponid.length) {
      throw new Error('invalid-couponid')
    }
    if (!req.body.name) {
      throw new Error('invalid-name')
    }
    if (req.body.amount_off) {
      try {
        req.body.amount_off = parseInt(req.body.amount_off, 10)
        if (!req.body.amount_off) {
          throw new Error('invalid-amount_off')
        }
      } catch (s) {
        throw new Error('invalid-amount_off')
      }
      if (req.body.amount_off < 0) {
        throw new Error('invalid-amount_off')
      }
      if (!req.body.currency || req.body.currency.length !== 3) {
        throw new Error('invalid-currency')
      }
    } else if (req.body.percent_off) {
      try {
        req.body.percent_off = parseInt(req.body.percent_off, 10)
        if (!req.body.percent_off) {
          throw new Error('invalid-percent_off')
        }
      } catch (s) {
        throw new Error('invalid-percent_off')
      }
      if (req.body.percent_off < 0 || req.body.percent_off > 100) {
        throw new Error('invalid-percent_off')
      }
    }
    if (!req.body.amount_off && !req.body.percent_off) {
      throw new Error('invalid-amount_off')
    }
    if (req.body.duration !== 'once' && req.body.duration !== 'repeating' && req.body.duration !== 'forever') {
      throw new Error('invalid-duration')
    }
    if (req.body.duration === 'repeating') {
      if (req.body.duration_in_months) {
        try {
          req.body.duration_in_months = parseInt(req.body.duration_in_months, 10)
          if (!req.body.duration_in_months) {
            throw new Error('invalid-duration_in_months')
          }
        } catch (s) {
          throw new Error('invalid-duration_in_months')
        }
        if (req.body.duration_in_months < 1 || req.body.duration_in_months > 24) {
          throw new Error('invalid-duration_in_months')
        }
      } else {
        throw new Error('invalid-duration_in_months')
      }
    }
    if (req.body.max_redemptions) {
      try {
        req.body.max_redemptions = parseInt(req.body.max_redemptions, 10)
        if (!req.body.max_redemptions) {
          throw new Error('invalid-max_redemptions')
        }
      } catch (s) {
        throw new Error('invalid-max_redemptions')
      }
      if (req.body.max_redemptions < 0) {
        throw new Error('invalid-max_redemptions')
      }
    }
    const couponInfo = {
      id: req.body.couponid,
      duration: req.body.duration || null,
      name: req.body.name
    }
    if (req.body.redeem_by) {
      try {
        const redeemDate = new Date(Date.parse(req.body.redeem_by))
        const now = new Date()
        if (redeemDate.getTime() < now.getTime()) {
          throw new Error('invalid-redeem_by')
        }
        couponInfo.redeem_by = Math.floor(redeemDate.getTime() / 1000)
      } catch (error) {
        throw new Error('invalid-redeem_by')
      }
    }
    if (req.body.amount_off) {
      couponInfo.amount_off = req.body.amount_off
      couponInfo.currency = req.body.currency
    } else {
      couponInfo.percent_off = req.body.percent_off
    }
    if (req.body.duration_in_months) {
      couponInfo.duration_in_months = req.body.duration_in_months
    }
    if (req.body.max_redemptions) {
      couponInfo.max_redemptions = req.body.max_redemptions
    }
    const coupon = await stripeCache.execute('coupons', 'create', couponInfo, req.stripeKey)
    await subscriptions.Storage.Coupon.create({
      appid: req.appid || global.appid,
      couponid: coupon.id,
      stripeObject: coupon
    })
    req.query = req.query || {}
    req.query.couponid = coupon.id
    return global.api.administrator.subscriptions.Coupon.get(req)
  }
}
