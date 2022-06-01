/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/subscriptions/tax-rate', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-taxrateid', () => {
      it('missing querystring taxrateid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/tax-rate')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-taxrateid')
      })

      it('invalid querystring taxrateid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/tax-rate?taxrateid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-taxrateid')
      })
    })

    describe('invalid-taxrate', () => {
      it('invalid querystring taxrate is not active', async () => {
        const owner = await TestHelper.createOwner()
        await TestHelper.createTaxRate(owner, {
          active: false
        })
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/subscriptions/tax-rate?taxrateid=${owner.taxRate.taxrateid}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-tax-rate')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const owner = await TestHelper.createOwner()
      await TestHelper.createTaxRate(owner, {
        active: true
      })
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/subscriptions/tax-rate?taxrateid=${owner.taxRate.taxrateid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.saveResponse = true
      const taxrateid = await req.get()
      assert.strictEqual(taxrateid.object, 'taxrate')
    })
  })
})
