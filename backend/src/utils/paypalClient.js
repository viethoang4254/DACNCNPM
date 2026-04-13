import * as paypal from "@paypal/paypal-server-sdk";

const { Client, Environment } = paypal;

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID,
    oAuthClientSecret: process.env.PAYPAL_SECRET,
  },
  environment: Environment.Sandbox,
});

export default client;