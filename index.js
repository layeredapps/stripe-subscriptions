
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
global.automaticBillingProfileDescription = process.env.AUTOMATIC_BILLING_PROFILE_DESCRIPTION === 'true'
global.automaticBillingProfileFullName = process.env.AUTOMATIC_BILLING_PROFILE_FULL_NAME === 'true'
global.automaticBillingProfileEmail = process.env.AUTOMATIC_BILLING_PROFILE_EMAIL === 'true'
global.skipConfirmSubscription = process.env.SKIP_CONFIRM_SUBSCRIPTION === 'true'
global.requireBillingProfileAddress = process.env.REQUIRE_BILLING_PROFILE_ADDRESS !== 'false'
global.viewSubscriptionPlans = process.env.VIEW_SUBSCRIPTION_PLANS !== 'false'
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
const stripe = require('stripe')({
  apiVersion: global.stripeAPIVersion,
  telemetry: false,
  maxNetworkRetries: global.maximumStripeRetries || 0,
  appInfo: {
    version: packageJSON.version,
    name: '@layeredapps/stripe-subscriptions (test suite)',
    url: 'https://github.com/layeredapps/stripe-subscriptions'
  }
})

module.exports = {
  setup: async () => {
    const Storage = require('./src/storage.js')
    module.exports.Storage = await Storage()
    // set up countries
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
    module.exports.countryList = countryList
    module.exports.countryDivisions = countryDivisions
    // set up stripe
    if (global.stripeJS === 3) {
      global.packageJSON.dashboard.contentFilePaths.push(
        require.resolve('./src/content/embed-stripe-element-style.js')
      )
      global.packageJSON.dashboard.content.push(
        require('./src/content/embed-stripe-element-style.js')
      )
    }
    // retrieve tax codes from stripe
    let offset = 0
    const stripeKey = {
      apiKey: global.subscriptionsStripeKey || global.stripeKey || process.env.SUBSCRIPTIONS_STRIPE_KEY || process.env.STRIPE_KEY
    }
    while (true) {
      const taxCodes = await stripe.taxCodes.list({ limit: 100, offset }, stripeKey)
      for (const item of taxCodes.data) {
        const taxCode = {
          taxcodeid: item.id,
          description: item.description,
          name: item.name
        }
        await module.exports.Storage.TaxCode.upsert(taxCode)
      }
      if (taxCodes.has_more) {
        offset += taxCodes.data.length
      } else {
        break
      }
    }
  }
}
