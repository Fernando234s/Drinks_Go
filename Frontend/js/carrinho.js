const listaCarrinho = document.getElementById("lista-carrinho");
const valorTotal = document.getElementById("valor-total");
const clienteSelect = document.getElementById("cliente-select");
const formCliente = document.getElementById("form-cliente");
const inputClienteNome = document.getElementById("cliente-nome");
const inputClienteTelefone = document.getElementById("cliente-telefone");
const inputClienteEndereco = document.getElementById("cliente-endereco");
const botaoFinalizar = document.getElementById("finalizar-pedido");
const feedbackCarrinho = document.getElementById("feedback-carrinho");
const resumoItens = document.getElementById("resumo-itens");
const resumoTipos = document.getElementById("resumo-tipos");
let clientesSalvos = [];
let ultimoClienteCriadoId = null;

function mostrarFeedbackCarrinho(message, isError = false) {
  feedbackCarrinho.textContent = message;
  feedbackCarrinho.classList.remove("hidden", "error");

  if (isError) {
    feedbackCarrinho.classList.add("error");
  }
}

function calcularTotal(carrinho) {
  return carrinho.reduce(
    (acc, item) => acc + Number(item.preco || 0) * Number(item.quantidade || 0),
    0
  );
}

function renderizarResumo(carrinho) {
  const totalItens = carrinho.reduce(
    (acc, item) => acc + Number(item.quantidade || 0),
    0
  );
  const totalCategorias = new Set(
    carrinho.map((item) => obterCategoriaNormalizada(item.categoria))
  ).size;

  resumoItens.textContent = `${totalItens} itens`;
  resumoTipos.textContent = `${totalCategorias} categorias`;
  valorTotal.textContent = formatarMoeda(calcularTotal(carrinho));
}

function ajustarQuantidade(itemId, delta) {
  const item = lerCarrinho().find((produto) => produto.id === itemId);

  if (!item) {
    return;
  }

  atualizarQuantidadeCarrinho(itemId, Number(item.quantidade || 0) + delta, {
    source: "carrinho",
  });
  renderizarCarrinho();
}

function criarItemCarrinho(item) {
  const article = document.createElement("article");
  const marca = obterMarcaFicticia(item);
  const subtotal = Number(item.preco || 0) * Number(item.quantidade || 0);

  article.className = "cart-item fade-up";
  article.innerHTML = `
    <div class="cart-thumb">
      <img src="${obterImagemBebida(item)}" alt="${item.nome}" loading="lazy" />
    </div>

    <div class="cart-copy">
      <div class="cart-item-main">
        <div>
          <strong>${item.nome}</strong>
          <p class="muted-text">${marca} · ${obterCategoriaNormalizada(item.categoria)}</p>
        </div>
        <span class="pill">${formatarMoeda(item.preco)}</span>
      </div>

      <p class="muted-text">${obterDescricaoBebida(item)}</p>

      <div class="cart-item-actions">
        <div class="quantity-stepper" aria-label="Controle de quantidade">
          <button class="stepper-btn" type="button" data-step="-1">-</button>
          <span class="stepper-value">${item.quantidade}</span>
          <button class="stepper-btn" type="button" data-step="1">+</button>
        </div>
        <strong class="cart-subtotal">${formatarMoeda(subtotal)}</strong>
      </div>
    </div>
  `;

  article.querySelectorAll("[data-step]").forEach((button) => {
    button.addEventListener("click", () => {
      ajustarQuantidade(item.id, Number(button.dataset.step));
    });
  });

  return article;
}

function renderizarCarrinho() {
  const carrinho = lerCarrinho();

  if (!carrinho.length) {
    listaCarrinho.innerHTML = criarEmptyState(
      "Seu carrinho esta vazio",
      "Adicione bebidas no catalogo para montar um novo pedido."
    );
    renderizarResumo([]);
    return;
  }

  listaCarrinho.innerHTML = "";
  carrinho.forEach((item) => {
    listaCarrinho.appendChild(criarItemCarrinho(item));
  });

  renderizarResumo(carrinho);
}

function normalizarCliente(cliente) {
  if (!cliente || typeof cliente !== "object") {
    return null;
  }

  return cliente.data && typeof cliente.data === "object" ? cliente.data : cliente;
}

function obterNomeCliente(cliente) {
  return cliente?.nome || cliente?.cliente || `Cliente ${cliente?.id ?? ""}`.trim();
}

function preencherCamposCliente(cliente) {
  inputClienteNome.value = cliente?.nome || "";
  inputClienteTelefone.value = cliente?.telefone || "";
  inputClienteEndereco.value = cliente?.endereco || "";
}

function limparCamposCliente() {
  inputClienteNome.value = "";
  inputClienteTelefone.value = "";
  inputClienteEndereco.value = "";
}

function preencherSelectClientes(selectedId = "") {
  const clienteSelecionadoId = String(selectedId || "");

  if (!clientesSalvos.length) {
    clienteSelect.innerHTML =
      '<option value="">Nenhum cliente cadastrado</option>';
    return;
  }

  const opcoes = clientesSalvos.map((cliente) => {
    const nome = obterNomeCliente(cliente);
    const telefone = cliente.telefone ? ` - ${cliente.telefone}` : "";
    const selected =
      clienteSelecionadoId && String(cliente.id) === clienteSelecionadoId ? "selected" : "";

    return `<option value="${cliente.id}" ${selected}>${nome}${telefone}</option>`;
  });

  clienteSelect.innerHTML = [
    '<option value="">Selecione um cliente</option>',
    ...opcoes,
  ].join("");
}

function selecionarCliente() {
  const clienteId = String(clienteSelect.value || "");

  if (!clienteId) {
    limparCamposCliente();
    return;
  }

  const cliente = clientesSalvos.find((item) => String(item.id) === clienteId);
  if (!cliente) {
    return;
  }

  preencherCamposCliente(cliente);
  ultimoClienteCriadoId = Number(cliente.id) || ultimoClienteCriadoId;
}

async function carregarClientes(selectedId) {
  try {
    clientesSalvos = normalizarLista(await api.listarClientes()).filter(Boolean);
    preencherSelectClientes(selectedId);
  } catch (error) {
    clientesSalvos = [];
    clienteSelect.innerHTML = '<option value="">Erro ao carregar clientes</option>';
    mostrarFeedbackCarrinho(error.message, true);
  }
}

async function salvarCliente() {
  const nome = inputClienteNome.value.trim();
  const telefone = inputClienteTelefone.value.trim();
  const endereco = inputClienteEndereco.value.trim();

  if (!nome || !telefone || !endereco) {
    mostrarFeedbackCarrinho("Preencha nome, telefone e endereco do cliente.", true);
    return;
  }

  try {
    const clienteCriado = normalizarCliente(
      await api.criarCliente({ nome, telefone, endereco })
    );

    ultimoClienteCriadoId = Number(clienteCriado?.id) || ultimoClienteCriadoId;
    limparCamposCliente();
    clienteSelect.value = "";
    await carregarClientes();
    mostrarFeedbackCarrinho("Cliente salvo com sucesso");
  } catch (error) {
    mostrarFeedbackCarrinho(error.message, true);
  }
}

formCliente.addEventListener("submit", async (event) => {
  event.preventDefault();
  await salvarCliente();
});

clienteSelect.addEventListener("change", selecionarCliente);

botaoFinalizar.addEventListener("click", async () => {
  const carrinho = lerCarrinho();
  const clienteId = Number(clienteSelect.value) || Number(ultimoClienteCriadoId);
  const clienteSelecionado = clientesSalvos.find((cliente) => Number(cliente.id) === clienteId);
  const nomeCliente = obterNomeCliente(clienteSelecionado) || "Cliente selecionado";

  if (!carrinho.length) {
    mostrarFeedbackCarrinho("Adicione itens ao carrinho antes de finalizar.", true);
    return;
  }

  if (!clienteId) {
    mostrarFeedbackCarrinho("Selecione um cliente para criar o pedido.", true);
    return;
  }

  const payload = {
    cliente_id: clienteId,
    status_id: 1,
    itens: carrinho.map((item) => ({
      bebida_id: item.id,
      quantidade: item.quantidade,
    })),
  };

  try {
    await api.criarPedido(payload);

    abrirModalPedido({
      cliente: nomeCliente,
      itens: carrinho.reduce((acc, item) => acc + Number(item.quantidade || 0), 0),
      total: formatarMoeda(calcularTotal(carrinho)),
    });

    limparCarrinho({ source: "carrinho" });
    renderizarCarrinho();
    mostrarFeedbackCarrinho("Pedido enviado com sucesso.");
  } catch (error) {
    mostrarFeedbackCarrinho(error.message, true);
  }
});

window.addEventListener("cart:updated", () => {
  renderizarCarrinho();
});

renderizarCarrinho();
carregarClientes();
