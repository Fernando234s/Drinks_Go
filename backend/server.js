const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/', routes);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await db.query('SELECT 1');
    app.listen(PORT, () => {
      console.log(`?? Drink_Go API rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao conectar no banco de dados:', error.message);
    process.exit(1);
  }
}

startServer();
