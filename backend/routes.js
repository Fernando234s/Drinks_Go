const express = require('express');
const db = require('./db');

const router = express.Router();

function formatPedidos(rows) {
  const pedidosMap = new Map();

  for (const row of rows) {
    if (!pedidosMap.has(row.pedido_id)) {
      pedidosMap.set(row.pedido_id, {
        id: row.pedido_id,
        cliente_id: row.cliente_id,
        cliente_nome: row.cliente_nome,
        cliente: {
          id: row.cliente_id,
          nome: row.cliente_nome,
          telefone: row.cliente_telefone,
          endereco: row.cliente_endereco,
        },
        status_id: row.status_id,
        status: row.status_descricao,
        data_pedido: row.data_pedido,
        bebidas: [],
      });
    }

    if (row.bebida_id) {
      pedidosMap.get(row.pedido_id).bebidas.push({
        id: row.bebida_id,
        nome: row.bebida_nome,
        quantidade: row.quantidade,
        preco: row.bebida_preco,
      });
    }
  }

  return Array.from(pedidosMap.values());
}

async function getPedidosRows(whereClause = '', params = []) {
  const [rows] = await db.query(
    `SELECT
      p.id AS pedido_id,
      p.cliente_id,
      p.status_id,
      c.nome AS cliente_nome,
      c.telefone AS cliente_telefone,
      c.endereco AS cliente_endereco,
      s.descricao AS status_descricao,
      p.data_pedido,
      b.id AS bebida_id,
      b.nome AS bebida_nome,
      b.preco AS bebida_preco,
      pb.quantidade
    FROM pedidos p
    LEFT JOIN clientes c ON c.id = p.cliente_id
    LEFT JOIN status s ON s.id = p.status_id
    LEFT JOIN pedido_bebidas pb ON pb.pedido_id = p.id
    LEFT JOIN bebidas b ON b.id = pb.bebida_id
    ${whereClause}
    ORDER BY p.id DESC, pb.id ASC`,
    params
  );

  return rows;
}

async function getPedidoById(pedidoId) {
  const rows = await getPedidosRows('WHERE p.id = ?', [pedidoId]);
  const pedidos = formatPedidos(rows);
  return pedidos[0] || null;
}

async function getOrCreateStatusId(descricao) {
  const [rows] = await db.query('SELECT id FROM status WHERE LOWER(descricao) = LOWER(?) LIMIT 1', [descricao]);

  if (rows.length) {
    return rows[0].id;
  }

  const [result] = await db.query('INSERT INTO status (descricao) VALUES (?)', [descricao]);
  return result.insertId;
}

function extractPedidoItems(body) {
  if (Array.isArray(body.itens)) {
    return body.itens;
  }

  if (Array.isArray(body.bebidas)) {
    return body.bebidas;
  }

  return null;
}

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

    if (!nome || !telefone || !endereco) {
      return res.status(400).json({ erro: 'nome, telefone e endereco sao obrigatorios' });
    }

    const [result] = await db.query(
      'INSERT INTO clientes (nome, telefone, endereco) VALUES (?, ?, ?)',
      [nome, telefone, endereco]
    );

    res.status(201).json({
      id: result.insertId,
      nome,
      telefone,
      endereco,
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

router.put('/bebidas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, categoria, preco, estoque } = req.body;

    if (!nome || preco === undefined || preco === null) {
      return res.status(400).json({ erro: 'Campos nome e preco sao obrigatorios' });
    }

    const [result] = await db.query(
      'UPDATE bebidas SET nome = ?, categoria = ?, preco = ?, estoque = ? WHERE id = ?',
      [nome, categoria || null, preco, estoque ?? 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Bebida nao encontrada' });
    }

    res.json({
      id: Number(id),
      nome,
      categoria: categoria || null,
      preco,
      estoque: estoque ?? 0,
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar bebida', detalhes: error.message });
  }
});

router.delete('/bebidas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM bebidas WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Bebida nao encontrada' });
    }

    res.json({ mensagem: 'Bebida removida com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover bebida', detalhes: error.message });
  }
});

router.post('/pedidos', async (req, res) => {
  try {
    const { cliente_id, status_id } = req.body;
    const itens = extractPedidoItems(req.body);

    if (!cliente_id || !status_id || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ erro: 'cliente_id, status_id e itens (ou bebidas) sao obrigatorios' });
    }

    const [pedidoResult] = await db.query(
      'INSERT INTO pedidos (cliente_id, status_id, data_pedido) VALUES (?, ?, NOW())',
      [cliente_id, status_id]
    );

    const pedidoId = pedidoResult.insertId;

    for (const item of itens) {
      if (!item.bebida_id || !item.quantidade || Number(item.quantidade) <= 0) {
        throw new Error('Cada item precisa de bebida_id e quantidade maior que zero');
      }

      await db.query(
        'INSERT INTO pedido_bebidas (pedido_id, bebida_id, quantidade) VALUES (?, ?, ?)',
        [pedidoId, item.bebida_id, item.quantidade]
      );
    }

    const pedidoCriado = await getPedidoById(pedidoId);
    res.status(201).json(pedidoCriado);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar pedido', detalhes: error.message });
  }
});

router.get('/pedidos', async (req, res) => {
  try {
    const rows = await getPedidosRows();
    res.json(formatPedidos(rows));
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar pedidos', detalhes: error.message });
  }
});

router.get('/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await getPedidoById(id);

    if (!pedido) {
      return res.status(404).json({ erro: 'Pedido nao encontrado' });
    }

    res.json(pedido);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar pedido', detalhes: error.message });
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

    const pedidoAtualizado = await getPedidoById(id);
    res.json(pedidoAtualizado);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar status do pedido', detalhes: error.message });
  }
});

router.put('/pedidos/:id/cancelar', async (req, res) => {
  try {
    const { id } = req.params;
    const canceladoStatusId = await getOrCreateStatusId('Cancelado');
    const [result] = await db.query('UPDATE pedidos SET status_id = ? WHERE id = ?', [canceladoStatusId, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Pedido nao encontrado' });
    }

    const pedidoAtualizado = await getPedidoById(id);
    res.json(pedidoAtualizado);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao cancelar pedido', detalhes: error.message });
  }
});

router.delete('/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM pedido_bebidas WHERE pedido_id = ?', [id]);
    const [result] = await db.query('DELETE FROM pedidos WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Pedido nao encontrado' });
    }

    res.json({ mensagem: 'Pedido removido com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover pedido', detalhes: error.message });
  }
});

module.exports = router;
