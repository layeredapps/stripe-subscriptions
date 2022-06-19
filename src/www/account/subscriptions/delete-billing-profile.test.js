/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/delete-billing-profile', function () {
  let cachedResponses
  let cachedCustomer
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const user = await TestHelper.createUser()
    cachedCustomer = await TestHelper.createCustomer(user, {
      email: user.profile.contactEmail
    })
    const req1 = TestHelper.createRequest(`/account/subscriptions/delete-billing-profile?customerid=${user.customer.customerid}`)
    req1.account = user.account
    req1.session = user.session
    await req1.route.api.before(req1)
    cachedResponses.before = req1.data
    cachedResponses.returns = await req1.get()
    const user2 = await TestHelper.createUser()
    req1.account = user2.account
    req1.session = user2.session
    await req1.route.api.before(req1)
    cachedResponses.invalidAccount = req1.error
    const req2 = TestHelper.createRequest(`/account/subscriptions/delete-billing-profile?customerid=${user.customer.customerid}`)
    req2.account = user.account
    req2.session = user.session
    req2.filename = __filename
    req2.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/billing-profiles' },
      { click: `/account/subscriptions/billing-profile?customerid=${user.customer.customerid}` },
      { click: `/account/subscriptions/delete-billing-profile?customerid=${user.customer.customerid}` },
      { fill: '#submit-form' }
    ]
    global.pageSize = 50
    // csrf
    req2.puppeteer = false
    req2.body = {
      'csrf-token': ''
    }
    cachedResponses.csrf = await req2.post()
    delete (req2.puppeteer)
    delete (req2.body)
    // submit
    cachedResponses.submit = await req2.post()
    cachedResponses.finished = true
  }

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.customer.customerid, cachedCustomer.customerid)
    })
  })

  describe('view', () => {
    it('should present the form', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should delete billing profile (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-customerid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/subscriptions/delete-billing-profile?customerid=invalid')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-customerid')
    })

    it('invalid-account', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidAccount
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('invalid-csrf-token', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.csrf
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-csrf-token')
    })
  })
})
