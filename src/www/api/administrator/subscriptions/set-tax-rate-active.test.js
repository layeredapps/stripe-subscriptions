/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/subscriptions/set-tax-rate-active', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-taxrateid', () => {
      it('missing querystring taxrateid', async function () {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/set-tax-rate-active')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-taxrateid')
      })

      it('invalid querystring taxrateid', async function () {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/set-tax-rate-active?taxrateid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-taxrateid')
      })
    })

    describe('invalid-taxrate', () => {
      it('invalid taxrate is already active', async function () {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createTaxRate(administrator, {
          active: true
        })
        const req = TestHelper.createRequest(`/api/administrator/subscriptions/set-tax-rate-active?taxrateid=${administrator.taxRate.taxrateid}`)
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-taxrate')
      })
    })
  })

  describe('returns', () => {
    it('object', async function () {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator, {
        active: false
      })
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/set-tax-rate-active?taxrateid=${administrator.taxRate.taxrateid}`)
      req.account = administrator.account
      req.session = administrator.session
      const taxRateNow = await req.patch()
      assert.strictEqual(taxRateNow.stripeObject.active, true)
    })
  })
})
