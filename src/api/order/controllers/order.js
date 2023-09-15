"use strict";
const stripe = require("stripe")(process.env.VITE_STRIPE_KEY);
/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async create(ctx) {
    const { data } = ctx.request.body;
    const { products } = data;
    try {
      const lineItems = await Promise.all(
        products.map(async (product) => {
          const item = await strapi.entityService.findOne(
            "api::product.product",
            product.id
          );
          strapi.log.info("let's see what we just found");
          // const totalQuantity = product.cartQuantity.reduce(
          //   (acc, obj) => acc + obj.quantity,
          //   0
          // );
          return {
            price_data: {
              currency: "usd",
              product_data: {
                name: item.title,
              },
              unit_amount: Math.round(item.price * 100), // unit_amount takes price in cents
            },
            // quantity: totalQuantity,
            quantity: 1,
          };
        })
      );

      strapi.log.info("products vs lineItems");
      const session = await stripe.checkout.sessions.create({
        shipping_address_collection: { allowed_countries: ["US"] },
        payment_method_types: ["card"],
        mode: "payment",
        customer_creation: "always",
        success_url:
          `${process.env.REACT_APP_CLIENT_URL || "http://localhost:5173"}` +
          "/checkout",
        cancel_url:
          `${process.env.REACT_APP_CLIENT_URL || "http://localhost:5173"}` +
          "/",
        line_items: lineItems,
        phone_number_collection: {
          enabled: true,
        },
        invoice_creation: {
          enabled: true,
        },
      });

      console.dir(session);
      // console.dir(session.id);
      await strapi.entityService.create("api::order.order", {
        data: {
          products,
          stripeId: session.id,
          publishedAt: new Date().getTime(),
        },
      });

      for (const product of products) {
        const selectedSize = product.selectedSize;

        // Fetch the current product from the database
        try {
          const existingProduct = await strapi.entityService.findOne(
            "api::product.product",
            product.id
          );

          if (existingProduct) {
            const quantityAvailable = { ...existingProduct.quantityAvailable };

            // Update the quantityAvailable based on cartQuantity
            if (quantityAvailable.hasOwnProperty(selectedSize)) {
              quantityAvailable[selectedSize] -= 1;
            }

            // Update the product in the database with the updated quantityAvailable

            const updatedEntry = await strapi.entityService.update(
              "api::product.product",
              product.id,
              {
                data: {
                  quantityAvailable,
                },
              }
            );

            console.log(`Product ${product.id} updated successfully.`);
            console.log(updatedEntry);
          } else {
            console.log(`Product ${product.id} not found.`);
          }
        } catch (error) {
          console.error(`Error updating product ${product.id}:`, error);
        }
      }

      return { stripeSession: session };
    } catch (error) {
      ctx.response.status = 500;
      return { error };
    }
  },
  async findOne(ctx) {
    const { id } = ctx.params;

    try {
      const session = await stripe.checkout.sessions.retrieve(id);
      return { session };
    } catch (error) {
      ctx.response.status = 404;
      return { error: "Session not found" };
    }
  },

  async find(ctx) {
    try {
      const sessions = await stripe.checkout.sessions.list({
        limit: 100,
      });
      return { sessions };
    } catch (error) {
      ctx.response.status = 500;
      return { error };
    }
  },
}));
