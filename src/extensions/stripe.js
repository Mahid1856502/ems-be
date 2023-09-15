"use strict";
const stripe = require("stripe")(process.env.VITE_STRIPE_KEY);

module.exports = {
  getStripe() {
    return stripe;
  },
};
