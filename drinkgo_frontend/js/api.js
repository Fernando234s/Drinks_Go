const API_BASE_URL = "http://localhost:3000";
const CARRINHO_STORAGE_KEY = "drinkgo_carrinho";

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

  excluirBebida(id) {
    return request(`/bebidas/${id}`, {
      method: "DELETE",
    });
  },

  listarPedidos() {
    return request("/pedidos");
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

function lerCarrinho() {
  try {
    return JSON.parse(localStorage.getItem(CARRINHO_STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function criarEmptyState(titulo, descricao) {
  return `
    <div class="empty-state">
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
    return "Preparando";
  }

  if (valor.includes("finalizado")) {
    return "Finalizado";
  }

  if (valor.includes("entregue")) {
    return "Entregue";
  }

  return status || "Status";
}

function obterClasseStatus(status) {
  const rotulo = obterRotuloStatus(status).toLowerCase();

  if (rotulo === "pendente") {
    return "status-pendente";
  }

  if (rotulo === "preparando") {
    return "status-preparando";
  }

  if (rotulo === "finalizado" || rotulo === "entregue") {
    return "status-entregue";
  }

  return "status-default";
}