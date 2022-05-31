/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/subscriptions/create-tax-id', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-customerid', () => {
      it('missing querystring customerid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/create-tax-id')
        req.account = user.account
        req.session = user.session
        req.body = {
          type: 'au_abn',
          value: 'abcdefg'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })

      it('invalid querystring customerid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/create-tax-id?customerid=invalid')
        req.account = user.account
        req.session = user.session
        req.body = {
          type: 'au_abn',
          value: 'abcdefg'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const user = await TestHelper.createUser()
        const user2 = await TestHelper.createUser()
        await TestHelper.createCustomer(user2, {
          email: user2.profile.contactEmail
        })
        const req = TestHelper.createRequest(`/api/user/subscriptions/create-tax-id?customerid=${user2.customer.customerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          type: 'au_abn',
          value: 'abcdefg'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-type', () => {
      it('missing posted type', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createCustomer(user, {
          email: user.profile.contactEmail
        })
        const req = TestHelper.createRequest(`/api/user/subscriptions/create-tax-id?customerid=${user.customer.customerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          type: '',
          value: 'abcdefg'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-type')
      })

      it('invalid posted type', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createCustomer(user, {
          email: user.profile.contactEmail
        })
        const req = TestHelper.createRequest(`/api/user/subscriptions/create-tax-id?customerid=${user.customer.customerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          type: 'invalid',
          value: 'abcdefg'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-type')
      })
    })

    describe('invalid-value', () => {
      it('invalid posted value', async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createCustomer(user, {
          email: user.profile.contactEmail
        })
        const req = TestHelper.createRequest(`/api/user/subscriptions/create-tax-id?customerid=${user.customer.customerid}`)
        req.account = user.account
        req.session = user.session
        req.body = {
          type: 'au_abn',
          value: 'abcdefg'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-value')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/api/user/subscriptions/create-tax-id?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      req.body = {
        type: 'eu_vat',
        value: 'DE123456789'
      }
      req.filename = __filename
      req.saveResponse = true
      const taxid = await req.post()
      assert.strictEqual(taxid.object, 'taxid')
    })
  })
})
