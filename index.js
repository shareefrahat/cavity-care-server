const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;

const app = express();

//------------Middleware-----------\\

app.use(express.json());
app.use(cors());

//-----------Node Server API----------\\

app.get("/", (req, res) => {
  res.send("Server: Node server in running with Express");
});

app.listen(port, () => {
  console.log(`Server app listening on port ${port}`);
});
