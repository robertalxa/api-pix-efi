if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const bodyParser = require('body-parser');
const GNRequest = require('./apis/gerencianet');
const app = express();

app.use(bodyParser.json());
app.set("view engine", "ejs");
app.set("views", "src/views");
const reqGNAlready = GNRequest({
  clientID: process.env.GN_CLIENT_ID,
  clientSecret: process.env.GN_CLIENT_SECRET
});

app.get("/", async (req, res) => {
  const reqGN = await reqGNAlready;
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

  const cobResponse = await reqGN.post("/v2/cob", dataCob);
  const qrcodeResponse = await reqGN.get(
    `/v2/loc/${cobResponse.data.loc.id}/qrcode`
  );
  res.render("qrcode", { qrcodeImage: qrcodeResponse.data.imagemQrcode });
});

app.get('/cobrancas', async (req, res) => {
  const reqGN = await reqGNAlready;
  const dataHoje = new Date();
  const dataOntem = new Date(dataHoje.getTime() - 86400000);
  const cobrancasResponse = await reqGN.get(`/v2/cob?inicio=${dataOntem.toJSON()}&fim=${dataHoje.toJSON()}`);
  res.send(cobrancasResponse.data);
});

app.post('/webhook(/pix)?', (req, res) => {
  console.log(req.body);
  res.send('200');
});

app.listen(8000, () => {
  console.log("Rodando server");
});
