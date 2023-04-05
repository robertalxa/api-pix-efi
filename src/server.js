if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");
const express = require("express");

const cert = fs.readFileSync(
  path.resolve(__dirname, `../certs/${process.env.GN_CERT}`)
);

const agent = new https.Agent({
  pfx: cert,
  passphrase: "",
});

const credentials = Buffer.from(
  `${process.env.GN_CLIENT_ID}:${process.env.GN_CLIENT_SECRET}`
).toString("base64");

const app = express();
app.set("view engine", "ejs");
app.set("views", "src/views");

app.get("/", async (req, res) => {
  const authResponse = await axios({
    method: "POST",
    url: `${process.env.GN_ENDPOINT}/oauth/token`,
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    httpsAgent: agent,
    data: {
      grant_type: "client_credentials",
    },
  });

  const accessToken = authResponse.data?.access_token;
  const reqGN = axios.create({
    baseURL: process.env.GN_ENDPOINT,
    httpsAgent: agent,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const dataCob = {
    calendario: {
      expiracao: 3600,
    },
    valor: {
      original: "100.00",
    },
    chave: "12460f5a-63c9-41b0-905f-927f7da55cdb",
    solicitacaoPagador: "Cobrança do LinkPed",
  };

  console.log('Bateu na rota')
  const cobResponse = await reqGN.post("/v2/cob", dataCob);
  res.send(cobResponse.data);

  /*curl --request POST \
    --url https://api-pix-h.gerencianet.com.br/oauth/token \
    --header 'Authorization: Basic Q2xpZW50X0lkXzNlZDZmMDZmMzQ3ZWUxYjY1NWY2MmI2ZDI3OTdkYWFhODk1MTAzZDM6Q2xpZW50X1NlY3JldF8yMDllZTVjZWVkYWIzMDBhNzFmMzI2MTZmNjE4NzI5NzAyMmNmYWMw' \
    --header 'Content-Type: application/json' \
    --data '{
    "grant_type": "client_credentials"
  }'*/
});

app.listen(8000, () => {
  console.log("Rodando server");
});
