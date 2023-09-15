'use strict';
const { default: createStrapi } = require('strapi');
const stripe = require('../../extensions/stripe');

module.exports = {
  async find(ctx) {
    try {
      const { id } = ctx.query;
      const session = await stripe.getStripe().checkout.sessions.retrieve(id);
      return session;
    } catch (error) {
      ctx.badRequest('Error retrieving checkout session');
    }
  },
};
