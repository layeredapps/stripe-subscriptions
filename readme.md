# Documentation for Stripe Subscriptions

#### Shortcuts

- [Documentation website](https://layeredapps.github.io)
- [Module documentation](https://layeredapps.github.io/stripe-subscriptions-module)
- [UI screenshots](https://layeredapps.github.io/stripe-subscriptions-ui)
- [API documentation](https://layeredapps.github.io/stripe-subscriptions-api)
- [Environment configuration](https://layeredapps.github.io/stripe-subscriptions-configuration)

#### Index

- [Introduction](#introduction)
- [Import this module](#import-this-module)
- [Setting up your Stripe credentials](#setting-up-your-stripe-credentials)
- [Configuring your products and plans](#configuring-your-products-and-plans)
- [Storage engine](#storage-engine)
- [Access the API](#access-the-api)
- [Github repository](https://github.com/layeredapps/stripe-subscriptions)
- [NPM package](https://npmjs.org/layeredapps/stripe-subscriptions)

# Introduction

Dashboard bundles everything a web app needs, all the "boilerplate" like signing in and changing passwords, into a parallel server so you can write a much smaller web app.

The Stripe Subscriptions module adds a complete interface for creating and managing your Stripe products, plans, subscriptions etc and a complete interface for users to subscribe to plans.  Users can self-cancel their subscriptions at any time and you can nominate a 0+ day period allowing users to refund themselves too.  You can optionally require a subscription and/or no unpaid invoices from all users outside of the `/account/` and `/administrator/` content.  The [Stripe API documentation](https://stripe.com/docs/api) supplements this documentation.

## Import this module

Install the module with NPM:

    $ npm install @layeredapps/stripe-subscriptions

Edit your `package.json` to activate the module:

    "dashboard": {
      "modules": [
        "@layeredapps/stripe-subscriptions"
      ]
    }

## Setting up your Stripe credentials

You will need to retrieve various keys from [Stripe](https://stripe.com).  During development your webhook will be created automatically, but in production with multiple dashboard server instances they share a configured webhook:

    - create your Stripe account and find your API keys
    - create a webhook for https://your_domain/webhooks/subscriptions/index-subscription-data 
    - environment STRIPE_JS=3|2|false
    - environment STRIPE_KEY=sk_test_xxxxxxx
    - environment STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxx
    - environment SUBSCRIPTIONS_WEBHOOK_ENDPOINT_SECRET=whsec_xxxxxxxx

## Requiring subscriptions

Environment variables are documented in Dashboard and each module's `/start-dev.sh`.

You can require subscriptions and no overdue invoices through environment variables:

    REQUIRE_SUBSCRIPTION=true
    REQUIRE_PAYMENT=true

### Configuring your products and plans

This module adds a complete interface for creating products and plans.  Stripe's nomenclature and structure is used directly so for more information refer to the <a href="https://stripe.com/docs">Stripe documentation</a> and <a href="https://stripe.com/docs/api">Stripe API documentation</a>.

Users subscribe to plans and plans must be built from products.  Additionally, this module imposes a 'publish' status on products and plans that controls access to them by users.

1.  Administrator creates product
2.  Administrator publishes product
3.  Administrator creates plan
4.  Administrator publishes plan
5.  User selects plan from published plans
6.  User creates subscription optionally with payment

You can use links for users to create a subscription to a specific plan:

    /account/subscriptions/start-subscription?planid=X

## Storage engine

By default this module will share whatever storage you use for Dashboard.  You can specify nothing, specify an alternate storage backend, or specify the same type with a separate database.

    SUBSCRIPTIONS_STORAGE=mysql
    SUBSCRIPTIONS_MARIADB_HOST=localhost
    SUBSCRIPTIONS_MARIADB_PORT=1234
    SUBSCRIPTIONS_MARIADB_DATABASE=connect
    SUBSCRIPTIONS_MARIADB_USERNAME=user
    SUBSCRIPTIONS_MARIADB_PASSWORD=password

### Access the API

Dashboard and official modules are completely API-driven and you can access the same APIs on behalf of the user making requests.  You perform `GET`, `POST`, `PATCH`, and `DELETE` HTTP requests against the API endpoints to fetch or modify data.  This example fetches the user's subscriptions using NodeJS, you can do this with any language:

You can view API documentation within the NodeJS modules' `api.txt` files, or on the [documentation site](https://layeredapps.github.io/stripe-subscriptions-api).

    const subscriptions = await proxy(`/api/user/subscriptions/subscriptions?accountid=${accountid}&all=true`, accountid, sessionid)

    const proxy = util.promisify((path, accountid, sessionid, callback) => {
        const requestOptions = {
            host: 'dashboard.example.com',
            path: path,
            port: '443',
            method: 'GET',
            headers: {
                'x-application-server': 'application.example.com',
                'x-application-server-token': process.env.APPLICATION_SERVER_TOKEN,
                'x-accountid': accountid,
                'x-sessionid': sessionid
            }
        }
        const proxyRequest = require('https').request(requestOptions, (proxyResponse) => {
            let body = ''
            proxyResponse.on('data', (chunk) => {
                body += chunk
            })
            return proxyResponse.on('end', () => {
                return callback(null, JSON.parse(body))
            })
        })
        proxyRequest.on('error', (error) => {
            return callback(error)
        })
        return proxyRequest.end()
      })
    }
