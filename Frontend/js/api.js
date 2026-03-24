const API_BASE_URL = "http://localhost:3000";
const CARRINHO_STORAGE_KEY = "drinkgo_carrinho";
const CLIENTES_OVERRIDES_KEY = "drinkgo_clientes_overrides";
const CLIENTES_REMOVIDOS_KEY = "drinkgo_clientes_removidos";
const BEBIDAS_IMAGENS_KEY = "drinkgo_bebidas_imagens";

const MARCAS_FICTICIAS = [
  "Aurora Brew Lager",
  "Polar Mist Pilsen",
  "Nebula Cola",
  "Voltz Energy Drink",
  "Crystal Spark Water",
  "Golden Barrel Whisky",
  "Nova Hop IPA",
  "Solar Citrus Soda",
];

const IMAGENS_POR_CATEGORIA = {
  cerveja:
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80",
  refrigerante:
    "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=900&q=80",
  energetico:
    "https://images.unsplash.com/photo-1543253539-0b65d6c3d4e9?auto=format&fit=crop&w=900&q=80",
  agua:
    "https://images.unsplash.com/photo-1561047029-3000c68339ca?auto=format&fit=crop&w=900&q=80",
  whisky:
    "https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=900&q=80",
  vinho:
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
  default:
    "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=900&q=80",
};

// Requisicoes HTTP continuam centralizadas aqui para preservar o contrato atual da API.
async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = "Nao foi possivel concluir a requisicao.";

    try {
      const errorData = await response.json();
      message = errorData.message || errorData.erro || JSON.stringify(errorData);
    } catch (error) {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

const api = {
  listarClientes() {
    return request("/clientes");
  },

  criarCliente(payload) {
    return request("/clientes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  atualizarCliente(id, payload) {
    return request(`/clientes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  removerCliente(id) {
    return request(`/clientes/${id}`, {
      method: "DELETE",
    });
  },

  listarBebidas() {
    return request("/bebidas");
  },

  criarBebida(payload) {
    return request("/bebidas", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  atualizarBebida(id, payload) {
    return request(`/bebidas/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  removerBebida(id) {
    return request(`/bebidas/${id}`, {
      method: "DELETE",
    });
  },

  listarPedidos() {
    return request("/pedidos");
  },

  async obterPedido(id) {
    try {
      return await request(`/pedidos/${id}`);
    } catch (error) {
      const pedidos = normalizarLista(await request("/pedidos"));
      const pedido = pedidos.find((item) => Number(item.id) === Number(id));

      if (!pedido) {
        throw error;
      }

      return pedido;
    }
  },

  criarPedido(payload) {
    return request("/pedidos", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  atualizarStatusPedido(id, status_id) {
    return request(`/pedidos/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status_id }),
    });
  },

  cancelarPedido(id) {
    return request(`/pedidos/${id}/cancelar`, {
      method: "PUT",
    });
  },

  removerPedido(id) {
    return request(`/pedidos/${id}`, {
      method: "DELETE",
    });
  },
};

function normalizarLista(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function lerJsonStorage(chave, fallback) {
  try {
    return JSON.parse(localStorage.getItem(chave)) ?? fallback;
  } catch (error) {
    return fallback;
  }
}

function salvarJsonStorage(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

function lerOverridesClientes() {
  return lerJsonStorage(CLIENTES_OVERRIDES_KEY, {});
}

function salvarOverrideCliente(cliente) {
  const overrides = lerOverridesClientes();
  overrides[String(cliente.id)] = cliente;
  salvarJsonStorage(CLIENTES_OVERRIDES_KEY, overrides);
}

function limparOverrideCliente(id) {
  const overrides = lerOverridesClientes();
  delete overrides[String(id)];
  salvarJsonStorage(CLIENTES_OVERRIDES_KEY, overrides);
}

function lerClientesRemovidos() {
  return lerJsonStorage(CLIENTES_REMOVIDOS_KEY, []);
}

function marcarClienteRemovido(id) {
  const removidos = new Set(lerClientesRemovidos().map(String));
  removidos.add(String(id));
  salvarJsonStorage(CLIENTES_REMOVIDOS_KEY, Array.from(removidos));
}

function desmarcarClienteRemovido(id) {
  const removidos = new Set(lerClientesRemovidos().map(String));
  removidos.delete(String(id));
  salvarJsonStorage(CLIENTES_REMOVIDOS_KEY, Array.from(removidos));
}

function mesclarClientesComEstadoLocal(clientes) {
  const overrides = lerOverridesClientes();
  const removidos = new Set(lerClientesRemovidos().map(String));

  return clientes
    .filter((cliente) => !removidos.has(String(cliente.id)))
    .map((cliente) => overrides[String(cliente.id)] || cliente);
}

function lerImagensBebidas() {
  return lerJsonStorage(BEBIDAS_IMAGENS_KEY, {});
}

function salvarImagemBebida(id, imageUrl) {
  const imagens = lerImagensBebidas();

  if (!imageUrl) {
    delete imagens[String(id)];
  } else {
    imagens[String(id)] = imageUrl;
  }

  salvarJsonStorage(BEBIDAS_IMAGENS_KEY, imagens);
}

function obterImagemBebidaSalva(id) {
  return lerImagensBebidas()[String(id)] || "";
}

// O carrinho fica em localStorage e dispara eventos para sincronizar o contador global.
function lerCarrinho() {
  try {
    return JSON.parse(localStorage.getItem(CARRINHO_STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function notificarCarrinhoAtualizado(contexto = {}) {
  window.dispatchEvent(
    new CustomEvent("cart:updated", {
      detail: {
        itens: lerCarrinho(),
        ...contexto,
      },
    })
  );
}

function salvarCarrinho(itens, contexto = {}) {
  localStorage.setItem(CARRINHO_STORAGE_KEY, JSON.stringify(itens));
  notificarCarrinhoAtualizado(contexto);
}

function adicionarAoCarrinho(bebida, contexto = {}) {
  const carrinho = lerCarrinho();
  const itemExistente = carrinho.find((item) => item.id === bebida.id);

  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    carrinho.push({ ...bebida, quantidade: 1 });
  }

  salvarCarrinho(carrinho, {
    action: "add",
    bebidaId: bebida.id,
    ...contexto,
  });
}

function atualizarQuantidadeCarrinho(bebidaId, quantidade, contexto = {}) {
  const carrinho = lerCarrinho()
    .map((item) => {
      if (item.id !== bebidaId) {
        return item;
      }

      return { ...item, quantidade };
    })
    .filter((item) => item.quantidade > 0);

  salvarCarrinho(carrinho, {
    action: "update",
    bebidaId,
    quantidade,
    ...contexto,
  });
}

function limparCarrinho(contexto = {}) {
  localStorage.removeItem(CARRINHO_STORAGE_KEY);
  notificarCarrinhoAtualizado({
    action: "clear",
    itens: [],
    ...contexto,
  });
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function obterCategoriaNormalizada(categoria) {
  return String(categoria || "Sem categoria").trim() || "Sem categoria";
}

function obterChaveCategoria(categoria) {
  return obterCategoriaNormalizada(categoria)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obterMarcaFicticia(bebida) {
  const chave = obterChaveCategoria(bebida?.categoria);

  if (chave.includes("cerveja")) {
    return "Aurora Brew Lager";
  }

  if (chave.includes("pilsen")) {
    return "Polar Mist Pilsen";
  }

  if (chave.includes("ipa")) {
    return "Nova Hop IPA";
  }

  if (chave.includes("refrigerante") || chave.includes("cola")) {
    return chave.includes("citrus") || chave.includes("soda")
      ? "Solar Citrus Soda"
      : "Nebula Cola";
  }

  if (chave.includes("ener")) {
    return "Voltz Energy Drink";
  }

  if (chave.includes("agua")) {
    return "Crystal Spark Water";
  }

  if (chave.includes("whisky") || chave.includes("destil")) {
    return "Golden Barrel Whisky";
  }

  const indice = Number(bebida?.id || 0) % MARCAS_FICTICIAS.length;
  return MARCAS_FICTICIAS[indice];
}

function obterImagemBebida(bebida) {
  const chave = obterChaveCategoria(bebida?.categoria);

  if (chave.includes("cerveja")) {
    return IMAGENS_POR_CATEGORIA.cerveja;
  }

  if (chave.includes("refrigerante") || chave.includes("cola")) {
    return IMAGENS_POR_CATEGORIA.refrigerante;
  }

  if (chave.includes("ener")) {
    return IMAGENS_POR_CATEGORIA.energetico;
  }

  if (chave.includes("agua")) {
    return IMAGENS_POR_CATEGORIA.agua;
  }

  if (chave.includes("whisky") || chave.includes("destil")) {
    return IMAGENS_POR_CATEGORIA.whisky;
  }

  if (chave.includes("vinho")) {
    return IMAGENS_POR_CATEGORIA.vinho;
  }

  return IMAGENS_POR_CATEGORIA.default;
}

function obterDescricaoBebida(bebida) {
  const marca = obterMarcaFicticia(bebida);
  const categoria = obterCategoriaNormalizada(bebida?.categoria);

  return `${marca} em ${categoria.toLowerCase()}, pronta para entrega rapida e experiencia premium.`;
}

function criarEmptyState(titulo, descricao) {
  return `
    <div class="empty-state">
      <span class="empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M12 2 4 7v10l8 5 8-5V7l-8-5Zm0 2.3 5.8 3.63L12 11.56 6.2 7.93 12 4.3Zm-6 5.42 5 3.13v6.8l-5-3.12V9.72Zm7 9.93v-6.8l5-3.13v6.81l-5 3.12Z" /></svg>
      </span>
      <strong>${titulo}</strong>
      <span>${descricao}</span>
    </div>
  `;
}

function obterRotuloStatus(status) {
  const valor = String(status || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (valor.includes("recebido") || valor.includes("pendente")) {
    return "Pendente";
  }

  if (valor.includes("preparo") || valor.includes("preparando")) {
    return "Em preparo";
  }

  if (valor.includes("finalizado")) {
    return "Finalizado";
  }

  if (valor.includes("entregue")) {
    return "Entregue";
  }

  if (valor.includes("cancelado")) {
    return "Cancelado";
  }

  return status || "Status";
}

function obterClasseStatus(status) {
  const rotulo = obterRotuloStatus(status).toLowerCase();

  if (rotulo === "pendente") {
    return "status-pendente";
  }

  if (rotulo === "em preparo") {
    return "status-preparando";
  }

  if (rotulo === "finalizado") {
    return "status-finalizado";
  }

  if (rotulo === "entregue") {
    return "status-entregue";
  }

  if (rotulo === "cancelado") {
    return "status-cancelado";
  }

  return "status-default";
}
