
global.minimumCouponLength = parseInt(process.env.MINIMUM_COUPON_LENGTH || '1', 10)
global.maximumCouponLength = parseInt(process.env.MAXIMUM_COUPON_LENGTH || '50', 10)
global.minimumPlanIDLength = parseInt(process.env.MINIMUM_PLANID_LENGTH || '1', 10)
global.maximumPlanIDLength = parseInt(process.env.MAXIMUM_PLANID_LENGTH || '50', 10)
global.minimumProductNameLength = parseInt(process.env.MINIMUM_PRODUCT_NAME_LENGTH || '1', 10)
global.maximumProductNameLength = parseInt(process.env.MAXIMUM_PRODUCT_NAME_LENGTH || '50', 10)
global.subscriptionRefundPeriod = parseInt(process.env.SUBSCRIPTION_REFUND_PERIOD || '3600', 10)
global.maximumStripeRetries = parseInt(process.env.MAXIMUM_STRIPE_RETRIES || '0', 10)
global.overdueInvoiceThreshold = parseInt(process.env.OVERDUE_INVOICE_THRESHOLD || '1', 10)
global.startSubscriptionPath = process.env.START_SUBSCRIPTION_PATH || '/account/subscriptions/start-subscription'
global.stripeAPIVersion = '2020-08-27'
global.stripeKey = global.stripeKey || process.env.SUBSCRIPTIONS_STRIPE_KEY || process.env.STRIPE_KEY
if (!global.stripeKey) {
  throw new Error('invalid-stripe-key')
}
global.stripePublishableKey = global.stripePublishableKey || process.env.SUBSCRIPTIONS_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY
if (global.stripeJS > 0 && !global.stripePublishableKey) {
  throw new Error('invalid-stripe-publishable-key')
}
global.subscriptionWebhookEndPointSecret = global.subscriptionWebhookEndPointSecret || process.env.SUBSCRIPTIONS_WEBHOOK_ENDPOINT_SECRET
if (!global.subscriptionWebhookEndPointSecret) {
  throw new Error('invalid-subscription-webhook-endpoint-secret')
}
if (process.env.STRIPE_JS) {
  global.stripeJS = process.env.STRIPE_JS === 'false' ? false : parseInt(process.env.STRIPE_JS, 10)
} else {
  global.stripeJS = false
}
if (global.stripeJS !== false && global.stripeJS !== 2 && global.stripeJS !== 3) {
  throw new Error('invalid-stripe-js-version')
}
const packageJSON = require('./package.json')
require('stripe')({
  apiVersion: global.stripeAPIVersion,
  telemetry: false,
  maxNetworkRetries: global.maximumStripeRetries || 0,
  appInfo: {
    version: packageJSON.version,
    name: '@layeredapps/stripe-subscriptions',
    url: 'https://github.com/layeredapps/stripe-subscriptions'
  }
})

module.exports = {
  setup: async () => {
    const Storage = require('./src/storage.js')
    module.exports.Storage = await Storage()
    const countryList = require('./countries.json')
    const countryDivisions = {}
    const raw = require('./country-divisions.json')
    for (const object in raw) {
      countryDivisions[object] = []
      for (const item in raw[object].divisions) {
        countryDivisions[object].push(item.split('-').pop())
      }
      countryDivisions[object].sort((a, b) => {
        return a.toLowerCase() < b.toLowerCase() ? -1 : 1
      })
    }
    if (process.env.STRIPE_JS === 3) {
      global.packageJSON.dashboard.contentFilePaths.push(
        require.resolve('./src/content/embed-stripe-element-style.js')
      )
      global.packageJSON.dashboard.content.push(
        require('./src/content/embed-stripe-element-style.js')
      )
    }
    module.exports.countryList = countryList
    module.exports.countryDivisions = countryDivisions
  }
}
