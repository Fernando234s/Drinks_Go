const pedidosAdminDom = {
  lista: document.getElementById("lista-pedidos-admin"),
  feedback: document.getElementById("feedback-pedidos"),
  filtro: document.getElementById("filtro-status-admin"),
  modal: document.getElementById("modal-pedido-admin"),
  detalhe: document.getElementById("pedido-admin-detalhe"),
};

const pedidosAdminState = {
  pedidos: [],
  clientes: [],
  bebidas: [],
  pedidoAtualId: null,
};

function mostrarFeedbackPedidosAdmin(message, isError = false) {
  if (!pedidosAdminDom.feedback) {
    return;
  }

  pedidosAdminDom.feedback.textContent = message;
  pedidosAdminDom.feedback.classList.remove("hidden", "error");
  pedidosAdminDom.feedback.classList.toggle("error", Boolean(isError));
}

function normalizarDataPedido(valor) {
  if (!valor) {
    return "-";
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return String(valor);
  }

  return data.toLocaleString("pt-BR");
}

function obterDataPedido(valor) {
  return valor?.created_at || valor?.data || valor?.data_pedido || valor?.updated_at || "";
}

function obterClientePedidoAdmin(pedido) {
  const nomeDireto =
    pedido.cliente?.nome || pedido.cliente_nome || (typeof pedido.cliente === "string" ? pedido.cliente : "");

  const clientePorId = pedidosAdminState.clientes.find(
    (cliente) => Number(cliente.id) === Number(pedido.cliente_id)
  );

  if (clientePorId) {
    return clientePorId;
  }

  const clientePorNome = pedidosAdminState.clientes.find(
    (cliente) =>
      String(cliente.nome || "").trim().toLowerCase() === String(nomeDireto || "").trim().toLowerCase()
  );

  if (clientePorNome) {
    return clientePorNome;
  }

  return {
    id: pedido.cliente_id || "",
    nome: nomeDireto || `Cliente ${pedido.cliente_id ?? "-"}`,
    telefone: pedido.cliente?.telefone || "",
    endereco: pedido.cliente?.endereco || "",
  };
}

function obterItensPedidoDetalhadosAdmin(pedido) {
  const itens = Array.isArray(pedido.itens)
    ? pedido.itens
    : Array.isArray(pedido.bebidas)
      ? pedido.bebidas
      : [];

  return itens.map((item) => {
    const bebidaId = item.bebida_id || item.id || item.bebida?.id;
    const bebida =
      pedidosAdminState.bebidas.find((atual) => Number(atual.id) === Number(bebidaId)) ||
      pedidosAdminState.bebidas.find(
        (atual) =>
          String(atual.nome || "").trim().toLowerCase() ===
          String(item.bebida?.nome || item.bebida_nome || item.nome || "").trim().toLowerCase()
      );

    const nome = bebida?.nome || item.bebida?.nome || item.bebida_nome || item.nome || `Bebida ${bebidaId ?? "-"}`;
    const quantidade = Number(item.quantidade || 0);
    const precoUnitario = Number(bebida?.preco || item.preco || item.valor || 0);

    return {
      nome,
      quantidade,
      precoUnitario,
      subtotal: precoUnitario * quantidade,
    };
  });
}

function calcularTotalPedidoAdmin(pedido) {
  return obterItensPedidoDetalhadosAdmin(pedido).reduce((acc, item) => acc + item.subtotal, 0);
}

function criarOpcoesStatusPedidoAdmin(statusAtual) {
  return [1, 2, 3, 4]
    .map((statusId) => {
      const label = obterRotuloStatus(
        {
          1: "Pendente",
          2: "Em preparo",
          3: "Finalizado",
          4: "Entregue",
        }[statusId]
      );
      const selected = Number(statusAtual) === statusId ? "selected" : "";
      return `<option value="${statusId}" ${selected}>${label}</option>`;
    })
    .join("");
}

async function cancelarPedidoAdmin(pedidoId) {
  try {
    await api.cancelarPedido(pedidoId);
    mostrarFeedbackPedidosAdmin(`Pedido #${pedidoId} cancelado`);
    await carregarPedidosAdmin();
    renderizarDetalhePedidoAdmin(pedidoId);
    window.dispatchEvent(new CustomEvent("admin:data-updated"));
  } catch (error) {
    mostrarFeedbackPedidosAdmin(error.message, true);
  }
}

async function excluirPedidoAdmin(pedidoId) {
  if (!window.confirm(`Excluir pedido #${pedidoId}?`)) {
    return;
  }

  try {
    await api.removerPedido(pedidoId);
    mostrarFeedbackPedidosAdmin(`Pedido #${pedidoId} excluido`);
    fecharModalPedidoAdmin();
    pedidosAdminState.pedidoAtualId = null;
    await carregarPedidosAdmin();
    window.dispatchEvent(new CustomEvent("admin:data-updated"));
  } catch (error) {
    mostrarFeedbackPedidosAdmin(error.message, true);
  }
}

function abrirModalPedidoAdmin() {
  if (!pedidosAdminDom.modal) {
    return;
  }

  pedidosAdminDom.modal.classList.add("is-open");
  pedidosAdminDom.modal.setAttribute("aria-hidden", "false");
}

function fecharModalPedidoAdmin() {
  if (!pedidosAdminDom.modal) {
    return;
  }

  pedidosAdminDom.modal.classList.remove("is-open");
  pedidosAdminDom.modal.setAttribute("aria-hidden", "true");
}

async function atualizarStatusDetalheAdmin(pedidoId, statusId) {
  try {
    await api.atualizarStatusPedido(pedidoId, Number(statusId));
    mostrarFeedbackPedidosAdmin(`Pedido #${pedidoId} atualizado`);
    await carregarPedidosAdmin();
    renderizarDetalhePedidoAdmin(pedidoId);
    window.dispatchEvent(new CustomEvent("admin:data-updated"));
  } catch (error) {
    mostrarFeedbackPedidosAdmin(error.message, true);
  }
}

function renderizarDetalhePedidoAdmin(pedidoId) {
  if (!pedidosAdminDom.detalhe) {
    return;
  }

  const pedido = pedidosAdminState.pedidos.find((item) => Number(item.id) === Number(pedidoId));

  if (!pedido) {
    pedidosAdminDom.detalhe.innerHTML = criarEmptyState("Pedido nao encontrado", " ");
    return;
  }

  pedidosAdminState.pedidoAtualId = pedido.id;

  const cliente = obterClientePedidoAdmin(pedido);
  const statusNome = obterRotuloStatus(pedido.status?.nome || pedido.status_nome || pedido.status);
  const itens = obterItensPedidoDetalhadosAdmin(pedido);
  const total = calcularTotalPedidoAdmin(pedido);

  pedidosAdminDom.detalhe.innerHTML = `
    <div class="pedido-detail-head">
      <div>
        <span class="eyebrow">Pedido #${pedido.id}</span>
        <h3 class="section-heading">${cliente.nome}</h3>
      </div>
      <span class="status-badge ${obterClasseStatus(statusNome)}">${statusNome}</span>
    </div>
    <div class="pedido-detail-grid">
      <div class="metric-box">
        <span>Telefone</span>
        <strong>${cliente.telefone || "-"}</strong>
      </div>
      <div class="metric-box">
        <span>Data</span>
        <strong>${normalizarDataPedido(obterDataPedido(pedido))}</strong>
      </div>
      <div class="metric-box pedido-span-full">
        <span>Endereco</span>
        <strong>${cliente.endereco || "-"}</strong>
      </div>
    </div>
    <div class="pedido-detail-items">
      ${itens
        .map(
          (item) => `
            <div class="order-item">
              <div>
                <span>${item.nome}</span>
                <strong>${formatarMoeda(item.precoUnitario)}</strong>
              </div>
              <strong>${item.quantidade}x</strong>
            </div>
          `
        )
        .join("")}
    </div>
    <div class="pedido-detail-footer">
      <div class="checkout-total">
        <span>Total</span>
        <strong>${formatarMoeda(total)}</strong>
      </div>
      <div class="order-actions">
        <select id="pedido-admin-status-select">${criarOpcoesStatusPedidoAdmin(pedido.status_id)}</select>
        <button class="button button-primary" id="pedido-admin-status-save" type="button">Salvar status</button>
        <button class="button button-soft" id="pedido-admin-cancel" type="button">Cancelar</button>
        <button class="button button-danger" id="pedido-admin-delete" type="button">Excluir</button>
      </div>
    </div>
  `;

  pedidosAdminDom.detalhe
    .querySelector("#pedido-admin-status-save")
    ?.addEventListener("click", () => {
      const select = pedidosAdminDom.detalhe.querySelector("#pedido-admin-status-select");
      atualizarStatusDetalheAdmin(pedido.id, select?.value || pedido.status_id);
    });

  pedidosAdminDom.detalhe
    .querySelector("#pedido-admin-cancel")
    ?.addEventListener("click", () => cancelarPedidoAdmin(pedido.id));

  pedidosAdminDom.detalhe
    .querySelector("#pedido-admin-delete")
    ?.addEventListener("click", () => excluirPedidoAdmin(pedido.id));
}

function criarCardPedidoResumoAdmin(pedido) {
  const article = document.createElement("article");
  const cliente = obterClientePedidoAdmin(pedido);
  const statusNome = obterRotuloStatus(pedido.status?.nome || pedido.status_nome || pedido.status);

  article.className = "order-card order-card-admin fade-up";
  article.innerHTML = `
    <div class="order-top">
      <div>
        <span class="eyebrow">Pedido #${pedido.id}</span>
        <h2>${cliente.nome}</h2>
      </div>
      <span class="status-badge ${obterClasseStatus(statusNome)}">${statusNome}</span>
    </div>
    <div class="order-metrics">
      <div class="metric-box">
        <span>Status</span>
        <strong>${statusNome}</strong>
      </div>
      <div class="metric-box">
        <span>Data</span>
        <strong>${normalizarDataPedido(obterDataPedido(pedido))}</strong>
      </div>
    </div>
    <div class="order-actions">
      <button class="button button-ghost" type="button">Detalhes</button>
      <button class="button button-soft quick-cancel" type="button">Cancelar</button>
      <button class="button button-danger quick-delete" type="button">Excluir</button>
    </div>
  `;

  article.querySelector(".button-ghost")?.addEventListener("click", () => {
    renderizarDetalhePedidoAdmin(pedido.id);
    abrirModalPedidoAdmin();
  });

  article.querySelector(".quick-cancel")?.addEventListener("click", (event) => {
    event.stopPropagation();
    cancelarPedidoAdmin(pedido.id);
  });

  article.querySelector(".quick-delete")?.addEventListener("click", (event) => {
    event.stopPropagation();
    excluirPedidoAdmin(pedido.id);
  });

  return article;
}

function filtrarPedidosAdmin() {
  const filtro = pedidosAdminDom.filtro?.value || "todos";

  if (filtro === "todos") {
    return pedidosAdminState.pedidos;
  }

  return pedidosAdminState.pedidos.filter((pedido) => {
    const statusNome = obterRotuloStatus(pedido.status?.nome || pedido.status_nome || pedido.status);
    return statusNome === filtro;
  });
}

async function carregarPedidosAdmin() {
  if (!pedidosAdminDom.lista) {
    return;
  }

  try {
    const [pedidos, clientes, bebidas] = await Promise.all([
      api.listarPedidos(),
      api.listarClientes(),
      api.listarBebidas(),
    ]);

    pedidosAdminState.pedidos = normalizarLista(pedidos);
    pedidosAdminState.clientes = mesclarClientesComEstadoLocal(normalizarLista(clientes));
    pedidosAdminState.bebidas = normalizarLista(bebidas);

    const pedidosFiltrados = filtrarPedidosAdmin();

    if (!pedidosFiltrados.length) {
      pedidosAdminDom.lista.innerHTML = criarEmptyState("Sem pedidos", " ");
      return;
    }

    pedidosAdminDom.lista.innerHTML = "";
    pedidosFiltrados.forEach((pedido) => {
      pedidosAdminDom.lista.appendChild(criarCardPedidoResumoAdmin(pedido));
    });

    if (pedidosAdminState.pedidoAtualId) {
      renderizarDetalhePedidoAdmin(pedidosAdminState.pedidoAtualId);
    }
  } catch (error) {
    mostrarFeedbackPedidosAdmin(error.message, true);
    pedidosAdminDom.lista.innerHTML = criarEmptyState("Erro", " ");
  }
}

function inicializarPedidosAdmin() {
  if (!document.body.matches("[data-page='admin']") || !pedidosAdminDom.lista) {
    return;
  }

  carregarPedidosAdmin();
  pedidosAdminDom.filtro?.addEventListener("change", carregarPedidosAdmin);

  document.querySelectorAll("[data-modal-close-parent='modal-pedido-admin']").forEach((botao) => {
    botao.addEventListener("click", fecharModalPedidoAdmin);
  });

  pedidosAdminDom.modal?.addEventListener("click", (event) => {
    if (event.target === pedidosAdminDom.modal) {
      fecharModalPedidoAdmin();
    }
  });

  window.addEventListener("admin:data-updated", carregarPedidosAdmin);
}

inicializarPedidosAdmin();
