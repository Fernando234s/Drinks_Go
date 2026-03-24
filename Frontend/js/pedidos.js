const listaPedidos = document.getElementById("lista-pedidos");
const feedbackPedidos = document.getElementById("feedback-pedidos");

function mostrarFeedbackPedidos(message, isError = false) {
  feedbackPedidos.textContent = message;
  feedbackPedidos.classList.remove("hidden", "error");

  if (isError) {
    feedbackPedidos.classList.add("error");
  }
}

function obterNomeCliente(pedido) {
  if (pedido.cliente?.nome) {
    return pedido.cliente.nome;
  }

  if (pedido.cliente_nome) {
    return pedido.cliente_nome;
  }

  if (pedido.cliente) {
    return pedido.cliente;
  }

  return `Cliente ${pedido.cliente_id ?? "-"}`;
}

function obterNomeStatus(pedido) {
  if (pedido.status?.nome) {
    return pedido.status.nome;
  }

  if (pedido.status_nome) {
    return pedido.status_nome;
  }

  if (pedido.status) {
    return pedido.status;
  }

  return `Status ${pedido.status_id ?? "-"}`;
}

function obterItensPedido(pedido) {
  if (Array.isArray(pedido.itens)) {
    return pedido.itens;
  }

  if (Array.isArray(pedido.bebidas)) {
    return pedido.bebidas;
  }

  return [];
}

function criarOpcoesStatus(statusIdAtual) {
  const opcoesStatus = [
    { id: 1, nome: "Pendente" },
    { id: 2, nome: "Em preparo" },
    { id: 3, nome: "Finalizado" },
    { id: 4, nome: "Entregue" },
  ];

  return opcoesStatus
    .map((status) => {
      const selected = Number(status.id) === Number(statusIdAtual) ? "selected" : "";
      return `<option value="${status.id}" ${selected}>${status.nome}</option>`;
    })
    .join("");
}

function criarCardPedido(pedido) {
  const article = document.createElement("article");
  const itens = obterItensPedido(pedido);
  const statusOriginal = obterNomeStatus(pedido);
  const statusVisual = obterRotuloStatus(statusOriginal);

  article.className = "order-card fade-up";
  article.innerHTML = `
    <div class="order-top">
      <div>
        <span class="eyebrow">Pedido #${pedido.id ?? "-"}</span>
        <h2>${obterNomeCliente(pedido)}</h2>
      </div>
      <span class="status-badge ${obterClasseStatus(statusOriginal)}">${statusVisual}</span>
    </div>

    <div class="order-metrics">
      <div class="metric-box">
        <span>Status</span>
        <strong>${statusVisual}</strong>
      </div>
      <div class="metric-box">
        <span>Itens</span>
        <strong>${itens.length} produto(s)</strong>
      </div>
    </div>

    <div class="order-summary">
      ${
        itens.length
          ? `<div class="order-items-list">${itens
              .map((item) => {
                const nome =
                  item.bebida?.nome ||
                  item.nome ||
                  item.bebida_nome ||
                  `Bebida ${item.bebida_id ?? "-"}`;
                return `
                  <div class="order-item">
                    <span>${nome}</span>
                    <strong>x${item.quantidade ?? 0}</strong>
                  </div>
                `;
              })
              .join("")}</div>`
          : ""
      }
    </div>

    <div class="order-actions">
      <select class="status-select">${criarOpcoesStatus(pedido.status_id)}</select>
      <button class="button primary atualizar-status" type="button">Atualizar status</button>
      <button class="button danger cancelar-pedido" type="button">Cancelar pedido</button>
    </div>
  `;

  article.querySelector(".atualizar-status").addEventListener("click", async () => {
    const statusId = Number(article.querySelector(".status-select").value);

    try {
      await api.atualizarStatusPedido(pedido.id, statusId);
      mostrarFeedbackPedidos(`Status do pedido #${pedido.id} atualizado.`);
      carregarPedidos();
    } catch (error) {
      mostrarFeedbackPedidos(error.message, true);
    }
  });

  article.querySelector(".cancelar-pedido").addEventListener("click", async () => {
    try {
      await api.cancelarPedido(pedido.id);
      mostrarFeedbackPedidos(`Pedido #${pedido.id} cancelado.`);
      carregarPedidos();
    } catch (error) {
      mostrarFeedbackPedidos(error.message, true);
    }
  });

  return article;
}

async function carregarPedidos() {
  try {
    const pedidos = normalizarLista(await api.listarPedidos());

    if (!pedidos.length) {
      listaPedidos.innerHTML = criarEmptyState(
        "Sem pedidos",
        " "
      );
      return;
    }

    listaPedidos.innerHTML = "";
    pedidos.forEach((pedido) => {
      listaPedidos.appendChild(criarCardPedido(pedido));
    });
  } catch (error) {
    mostrarFeedbackPedidos(error.message, true);
    listaPedidos.innerHTML = criarEmptyState(
      "Erro",
      " "
    );
  }
}

carregarPedidos();
