/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/add-subscription-item-tax-rate', function () {
  describe('before', () => {
    it('should bind data to req', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
      const req = TestHelper.createRequest(`/administrator/subscriptions/add-subscription-item-tax-rate?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.subscriptionItem.id, user.subscription.stripeObject.items.data[0].id)
    })
  })

  describe('view', () => {
    it('should present the form', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
      const req = TestHelper.createRequest(`/administrator/subscriptions/add-subscription-item-tax-rate?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should add tax rate (screenshots)', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      await TestHelper.createTaxRate(administrator)
      const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
      const req = TestHelper.createRequest(`/administrator/subscriptions/add-subscription-item-tax-rate?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        taxrateid: administrator.taxRate.taxrateid
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/subscriptions' },
        { click: `/administrator/subscriptions/subscription?subscriptionid=${user.subscription.subscriptionid}` },
        { click: `/administrator/subscriptions/subscription-item?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}` },
        { click: `/administrator/subscriptions/add-subscription-item-tax-rate?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}` },
        { fill: '#submit-form' }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorSubscriptions)
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-subscriptionitemid', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator)
      const req = TestHelper.createRequest('/administrator/subscriptions/add-subscription-item-tax-rate?subscriptionitemid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-subscriptionitemid')
    })

    // it('invalid-subscription-item', async () => {
    //   const administrator = await TestStripeAccounts.createOwnerWithPrice()
    //   const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    //   const req = TestHelper.createRequest(`/administrator/subscriptions/add-subscription-item-tax-rate?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
    //   req.account = administrator.account
    //   req.session = administrator.session
    //   req.body = {
    //     couponid: administrator.coupon.couponid
    //   }
    //   await req.route.api.before(req)
    //   assert.strictEqual(req.error, 'invalid-subscription-item')
    // })

    it('invalid-csrf-token', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      await TestHelper.createTaxRate(administrator)
      const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
      const req = TestHelper.createRequest(`/administrator/subscriptions/add-subscription-item-tax-rate?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
      req.puppeteer = false
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        taxrateid: administrator.taxRate.taxrateid,
        'csrf-token': ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-csrf-token')
    })
  })
})
