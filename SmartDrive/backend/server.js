const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

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
        const usuario = result[0];

        const accessToken = jwt.sign(
          { id: usuario.id, tipo: usuario.tipo },
          JWT_SECRET,
          { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
          { id: usuario.id },
          JWT_REFRESH_SECRET,
          { expiresIn: '7d' }
        );

        res.send({
          success: true,
          accessToken: accessToken,
          refreshToken: refreshToken,
          user: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            cpf: usuario.cpf,
            telefone: usuario.telefone,
            tipo: usuario.tipo
          }
        });
      } else {
        res.send({ success: false, message: "Usuário ou senha incorretos" });
      }
    }
  );
});

//update usuario
app.put("/usuarios/:id", (req, res) => {
  const { id } = req.params;
  const { nome, cpf, telefone, email } = req.body;

  db.query(
    "UPDATE usuarios SET nome = ?, cpf = ?, telefone = ?, email = ? WHERE id = ?",
    [nome, cpf, telefone, email, id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ success: true, message: "Atualizado com sucesso" });
    }
  );
});

//busca da pagina usuarios
app.get("/usuarios", (req, res) => {
  const query = `
    SELECT u.id, u.nome, u.email, u.telefone, u.cpf, u.tipo, 
           COUNT(i.id) AS infracoes 
    FROM usuarios u
    LEFT JOIN infracoes i ON u.id = i.usuario_id
    GROUP BY u.id
    ORDER BY u.nome ASC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

//novo usuário
app.post("/usuarios", (req, res) => {
  const { nome, email, senha, cpf, telefone, tipo } = req.body;

  db.query(
    "INSERT INTO usuarios (nome, email, senha, cpf, telefone, tipo) VALUES (?, ?, ?, ?, ?, ?)",
    [nome, email, senha, cpf, telefone, tipo || 'usuario'],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ success: true, message: "Usuário cadastrado com sucesso" });
    }
  );
});

//token
app.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).send({ error: "Refresh token não fornecido" });
  }

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).send({ error: "Refresh token inválido ou expirado" });

    //novo Token de 15 minutos
    const newAccessToken = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.send({ accessToken: newAccessToken });
  });
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
  const query = `
    SELECT i.id, i.usuario_id, v.placa, i.velocidade, i.status, i.data_hora 
    FROM infracoes i
    LEFT JOIN veiculos v ON i.veiculo_id = v.id
    ORDER BY i.data_hora DESC
  `;
  
  db.query("SELECT * FROM infracoes", (err, result) => {
    if (err) return res.status(500).send(err);

    res.send(result);
  });
});

app.listen(3000, '0.0.0.0', () => {
  console.log("Servidor rodando na porta 3000");
});