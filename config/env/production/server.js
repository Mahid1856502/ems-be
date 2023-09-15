module.exports = ({ env }) => ({
  proxy: true,
  // url: env('https://sea-turtle-app-28qpu.ondigitalocean.app'), // Sets the public URL of the application.
  url: "http://localhost:1337",
  app: {
    keys: env.array("APP_KEYS"),
  },
});
