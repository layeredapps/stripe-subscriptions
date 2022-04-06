const Log = require('@layeredapps/dashboard/src/log.js')('stripe-subscriptions')
const packageJSON = require('../package.json')
const stripe = require('stripe')({
  apiVersion: global.stripeAPIVersion,
  telemetry: false,
  maxNetworkRetries: global.maximumStripeRetries || 0,
  appInfo: {
    version: packageJSON.version,
    name: '@layeredapps/stripe-subscriptions',
    url: 'https://github.com/layeredapps/stripe-subscriptions'
  }
})
const util = require('util')

function retriableError (error) {
  if (global.testEnded) {
    return false
  }
  if (error.type === 'StripeConnectionError') {
    return true
  }
  if (error.type === 'StripeAPIError') {
    return true
  }
  if (error.message === 'An error occurred with our connection to Stripe.') {
    return true
  }
  if (!error.raw || !error.raw.code) {
    return false
  }
  if (error.raw.code === 'lock_timeout') {
    return true
  }
  if (error.raw.code === 'rate_limit') {
    return true
  }
  if (error.raw.code === 'idempotency_key_in_use') {
    return true
  }
  return false
}

function formatError (error, group) {
  Log.error('stripe cache error', error)
  if (error.raw && error.raw.param) {
    const property = error.raw.param.replace('[', '.').replace(']', '').replace('.', '_')
    switch (property) {
      case 'id':
        return `invalid-${group.substring(0, group.length - 1)}${property}`
      case 'coupon':
        return 'invalid-couponid'
      case 'plan':
        return 'invalid-planid'
      case 'subscription':
        return 'invalid-subscriptionid'
      case 'charge':
        return 'invalid-chargeid'
      case 'invoice':
        return 'invalid-invoiceid'
    }
  }
  if (error.raw && error.raw.code) {
    switch (error.raw.code) {
      case 'invoice_upcoming_none':
        return 'invalid-subscription'
    }
  }
  return 'unknown-error'
}

function execute (group, method, p1, p2, p3, p4, p5, callback) {
  if (!callback) {
    if (p5) {
      callback = p5
      p5 = null
    } else if (p4) {
      callback = p4
      p4 = null
    } else if (p3) {
      callback = p3
      p3 = null
    } else if (p2) {
      callback = p2
      p2 = null
    } else if (p1) {
      callback = p1
      p1 = null
    }
  }
  if (p5) {
    return stripe[group][method](p1, p2, p3, p4, p5, (error, result) => {
      if (!error) {
        return callback(null, result)
      }
      const retry = retriableError(error)
      if (retry) {
        return execute(group, method, p1, p2, p3, p4, p5, callback)
      }
      return callback(new Error(formatError(error, group)))
    })
  } else if (p4) {
    return stripe[group][method](p1, p2, p3, p4, (error, result) => {
      if (!error) {
        return callback(null, result)
      }
      const retry = retriableError(error)
      if (retry) {
        return execute(group, method, p1, p2, p3, p4, callback)
      }
      return callback(new Error(formatError(error, group)))
    })
  } else if (p3) {
    return stripe[group][method](p1, p2, p3, (error, result) => {
      if (!error) {
        return callback(null, result)
      }
      const retry = retriableError(error)
      if (retry) {
        return execute(group, method, p1, p2, p3, callback)
      }
      return callback(new Error(formatError(error, group)))
    })
  } else if (p2) {
    return stripe[group][method](p1, p2, (error, result) => {
      if (!error) {
        return callback(null, result)
      }
      const retry = retriableError(error)
      if (retry) {
        return execute(group, method, p1, p2, callback)
      }
      return callback(new Error(formatError(error, group)))
    })
  } else if (p1) {
    return stripe[group][method](p1, (error, result) => {
      if (!error) {
        return callback(null, result)
      }
      const retry = retriableError(error)
      if (retry) {
        return execute(group, method, p1, callback)
      }
      return callback(new Error(formatError(error, group)))
    })
  }
}

const stripeCache = module.exports = {
  execute: util.promisify(execute),
  retrieve: async (id, group, stripeKey) => {
    const object = await stripeCache.execute(group, 'retrieve', id, stripeKey)
    return object
  }
}
