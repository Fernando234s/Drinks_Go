const express = require('express');
const db = require('./db');

const router = express.Router();

router.get('/clientes', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM clientes ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar clientes', detalhes: error.message });
  }
});

router.post('/clientes', async (req, res) => {
  try {
    const { nome, telefone, endereco } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'O campo nome e obrigatorio' });
    }

    const [result] = await db.query(
      'INSERT INTO clientes (nome, telefone, endereco) VALUES (?, ?, ?)',
      [nome, telefone || null, endereco || null]
    );

    res.status(201).json({
      id: result.insertId,
      nome,
      telefone: telefone || null,
      endereco: endereco || null,
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar cliente', detalhes: error.message });
  }
});

router.get('/bebidas', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bebidas ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar bebidas', detalhes: error.message });
  }
});

router.post('/bebidas', async (req, res) => {
  try {
    const { nome, categoria, preco, estoque } = req.body;

    if (!nome || preco === undefined || preco === null) {
      return res.status(400).json({ erro: 'Campos nome e preco sao obrigatorios' });
    }

    const [result] = await db.query(
      'INSERT INTO bebidas (nome, categoria, preco, estoque) VALUES (?, ?, ?, ?)',
      [nome, categoria || null, preco, estoque ?? 0]
    );

    res.status(201).json({
      id: result.insertId,
      nome,
      categoria: categoria || null,
      preco,
      estoque: estoque ?? 0,
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar bebida', detalhes: error.message });
  }
});

router.post('/pedidos', async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { cliente_id, status_id, itens } = req.body;

    if (!cliente_id || !status_id || !Array.isArray(itens) || itens.length === 0) {
      conn.release();
      return res.status(400).json({ erro: 'cliente_id, status_id e itens sao obrigatorios' });
    }

    await conn.beginTransaction();

    const [pedidoResult] = await conn.query(
      'INSERT INTO pedidos (cliente_id, status_id, data_pedido) VALUES (?, ?, NOW())',
      [cliente_id, status_id]
    );

    const pedidoId = pedidoResult.insertId;

    for (const item of itens) {
      if (!item.bebida_id || !item.quantidade || Number(item.quantidade) <= 0) {
        throw new Error('Cada item precisa de bebida_id e quantidade maior que zero');
      }

      await conn.query(
        'INSERT INTO pedido_bebidas (pedido_id, bebida_id, quantidade) VALUES (?, ?, ?)',
        [pedidoId, item.bebida_id, item.quantidade]
      );
    }

    await conn.commit();
    conn.release();

    res.status(201).json({ mensagem: 'Pedido criado com sucesso', pedido_id: pedidoId });
  } catch (error) {
    try {
      await conn.rollback();
    } catch (_) {
      // ignore rollback error
    }
    conn.release();
    res.status(500).json({ erro: 'Erro ao criar pedido', detalhes: error.message });
  }
});

router.get('/pedidos', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        p.id AS pedido_id,
        c.nome AS cliente_nome,
        p.status_id,
        p.data_pedido,
        b.id AS bebida_id,
        b.nome AS bebida_nome,
        pb.quantidade
      FROM pedidos p
      INNER JOIN clientes c ON c.id = p.cliente_id
      LEFT JOIN pedido_bebidas pb ON pb.pedido_id = p.id
      LEFT JOIN bebidas b ON b.id = pb.bebida_id
      ORDER BY p.id DESC`
    );

    const pedidosMap = new Map();

    for (const row of rows) {
      if (!pedidosMap.has(row.pedido_id)) {
        pedidosMap.set(row.pedido_id, {
          id: row.pedido_id,
          cliente: row.cliente_nome,
          status: row.status_id,
          data: row.data_pedido,
          bebidas: [],
        });
      }

      if (row.bebida_id) {
        pedidosMap.get(row.pedido_id).bebidas.push({
          id: row.bebida_id,
          nome: row.bebida_nome,
          quantidade: row.quantidade,
        });
      }
    }

    res.json(Array.from(pedidosMap.values()));
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar pedidos', detalhes: error.message });
  }
});

router.put('/pedidos/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status_id } = req.body;

    if (!status_id) {
      return res.status(400).json({ erro: 'status_id e obrigatorio' });
    }

    const [result] = await db.query('UPDATE pedidos SET status_id = ? WHERE id = ?', [status_id, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Pedido nao encontrado' });
    }

    res.json({ mensagem: 'Status atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar status do pedido', detalhes: error.message });
  }
});

router.delete('/pedidos/:id', async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id } = req.params;

    await conn.beginTransaction();
    await conn.query('DELETE FROM pedido_bebidas WHERE pedido_id = ?', [id]);
    const [result] = await conn.query('DELETE FROM pedidos WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ erro: 'Pedido nao encontrado' });
    }

    await conn.commit();
    conn.release();

    res.json({ mensagem: 'Pedido removido com sucesso' });
  } catch (error) {
    try {
      await conn.rollback();
    } catch (_) {
      // ignore rollback error
    }
    conn.release();
    res.status(500).json({ erro: 'Erro ao remover pedido', detalhes: error.message });
  }
});

module.exports = router;