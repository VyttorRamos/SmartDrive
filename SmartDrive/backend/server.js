const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

//conexão mySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.connect(err => {
  if (err) {
    console.log("Erro ao conectar:", err);
  } else {
    console.log("MySQL conectado");
  }
});


//login
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  db.query(
    "SELECT * FROM usuarios WHERE email = ? AND senha = ?",
    [email, senha],
    (err, result) => {
      if (err) return res.status(500).send(err);

      if (result.length > 0) {
        res.send({ success: true });
      } else {
        res.send({ success: false });
      }
    }
  );
});


//Salva infração
app.post("/infracao", (req, res) => {
  const { placa, velocidade } = req.body;

  db.query(
    "INSERT INTO infracoes (placa, velocidade) VALUES (?, ?)",
    [placa, velocidade],
    (err, result) => {
      if (err) return res.status(500).send(err);

      res.send({ success: true });
    }
  );
});


//Lista infrações
app.get("/infracoes", (req, res) => {
  db.query("SELECT * FROM infracoes", (err, result) => {
    if (err) return res.status(500).send(err);

    res.send(result);
  });
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});