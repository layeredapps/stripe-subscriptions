/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/create-refund', function () {
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      amount: '1000',
      trial_period_days: '0',
      interval: 'month',
      usage_type: 'licensed'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    const req = TestHelper.createRequest(`/api/administrator/subscriptions/create-refund?chargeid=${user.charge.chargeid}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      amount: ''
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.missingAmount = error.message
    }
    req.body.amount = 'invalid'
    try {
      await req.post()
    } catch (error) {
      cachedResponses.invalidAmount = error.message
    }
    req.body.amount = '-7'
    try {
      await req.post()
    } catch (error) {
      cachedResponses.negativeAmount = error.message
    }
    req.body.amount = administrator.plan.stripeObject.amount * 2
    try {
      await req.post()
    } catch (error) {
      cachedResponses.excessiveAmount = error.message
    }
    req.body.amount = administrator.plan.stripeObject.amount
    req.filename = __filename
    req.saveResponse = true
    cachedResponses.returns = await req.post()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-chargeid', () => {
      it('missing querystring chargeid', async function () {
        await bundledData(this.test.currentRetry())
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-refund')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          amount: '1000'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-chargeid')
      })

      it('invalid querystring chargeid', async function () {
        await bundledData(this.test.currentRetry())
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-refund?chargeid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          amount: '1000'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-chargeid')
      })
    })

    describe('invalid-amount', () => {
      it('missing posted amount', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingAmount
        assert.strictEqual(errorMessage, 'invalid-amount')
      })

      it('invalid posted amount', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAmount
        assert.strictEqual(errorMessage, 'invalid-amount')
      })

      it('invalid posted amount is negative', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.negativeAmount
        assert.strictEqual(errorMessage, 'invalid-amount')
      })

      it('invalid posted amount exceeds charge', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.excessiveAmount
        assert.strictEqual(errorMessage, 'invalid-amount')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const refund = cachedResponses.returns
      assert.strictEqual(refund.object, 'refund')
    })
  })
})
