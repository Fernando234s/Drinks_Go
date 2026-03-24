const THEME_STORAGE_KEY = "drinkgo_theme";

const PUBLIC_PRODUCT_IMAGES = {
  "coca-cola 2l":
    "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=900&q=80",
  "guarana antarctica 2l":
    "https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=900&q=80",
  "pepsi 2l":
    "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=900&q=80",
  "sprite 2l":
    "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?auto=format&fit=crop&w=900&q=80",
  "fanta laranja 2l":
    "https://images.unsplash.com/photo-1624517452433-1f2c8c79fba5?auto=format&fit=crop&w=900&q=80",
  "schweppes citrus 1l":
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80",
  "heineken 600ml":
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80",
  "budweiser 600ml":
    "https://images.unsplash.com/photo-1571767454098-246b94fbcf70?auto=format&fit=crop&w=900&q=80",
  "skol 350ml":
    "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=900&q=80",
  "stella artois 600ml":
    "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=900&q=80",
  "corona long neck":
    "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=900&q=80",
  "brahma duplo malte 350ml":
    "https://images.unsplash.com/photo-1516458464372-ee7eae24b460?auto=format&fit=crop&w=900&q=80",
  "red bull 250ml":
    "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=900&q=80",
  "monster energy 473ml":
    "https://images.unsplash.com/photo-1605548230624-8d2d0419c517?auto=format&fit=crop&w=900&q=80",
  "tnt energy 269ml":
    "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?auto=format&fit=crop&w=900&q=80",
  caipirinha:
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80",
  mojito:
    "https://images.unsplash.com/photo-1578664182520-0b39c1f1a93b?auto=format&fit=crop&w=900&q=80",
  "gin tonica":
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80",
  "moscow mule":
    "https://images.unsplash.com/photo-1563223771-375783ee91ad?auto=format&fit=crop&w=900&q=80",
  "agua mineral 500ml":
    "https://images.unsplash.com/photo-1561047029-3000c68339ca?auto=format&fit=crop&w=900&q=80",
  "suco natural laranja 500ml":
    "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=900&q=80",
  "whisky jack daniel's 1l":
    "https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=900&q=80",
  "vodka smirnoff 998ml":
    "https://images.unsplash.com/photo-1582819509237-df5b1dbf9f24?auto=format&fit=crop&w=900&q=80",
};

const publicDom = {
  listaProdutos: document.getElementById("lista-produtos"),
  feedbackProdutos: document.getElementById("feedback-produtos"),
  catalogoCount: document.getElementById("catalogo-count"),
  listaCarrinho: document.getElementById("lista-carrinho"),
  feedbackCarrinho: document.getElementById("feedback-carrinho"),
  valorTotal: document.getElementById("valor-total"),
  resumoItens: document.getElementById("resumo-itens"),
  resumoItensTotal: document.getElementById("resumo-itens-total"),
  resumoTipos: document.getElementById("resumo-tipos"),
  formCliente: document.getElementById("form-cliente"),
  inputClienteNome: document.getElementById("cliente-nome"),
  inputClienteTelefone: document.getElementById("cliente-telefone"),
  inputClienteEndereco: document.getElementById("cliente-endereco"),
  clienteSelect: document.getElementById("cliente-select"),
  botaoFinalizar: document.getElementById("finalizar-pedido"),
  modalPedido: document.getElementById("modal-confirmacao-pedido"),
  modalPedidoTexto: document.getElementById("modal-pedido-texto"),
  modalPedidoResumo: document.getElementById("modal-pedido-resumo"),
};

const publicState = {
  clientes: [],
  ultimoClienteCriadoId: null,
};

function aplicarTemaPublico(tema) {
  document.documentElement.setAttribute("data-theme", tema);
  localStorage.setItem(THEME_STORAGE_KEY, tema);
}

function inicializarTemaPublico() {
  const salvo = localStorage.getItem(THEME_STORAGE_KEY);
  const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  aplicarTemaPublico(salvo || (prefereEscuro ? "dark" : "light"));
}

function alternarTemaPublico() {
  const atual = document.documentElement.getAttribute("data-theme") || "light";
  aplicarTemaPublico(atual === "dark" ? "light" : "dark");
}

function mostrarFeedbackPublico(elemento, mensagem, isError = false) {
  if (!elemento) {
    return;
  }

  elemento.textContent = mensagem;
  elemento.classList.remove("hidden", "error");
  elemento.classList.toggle("error", Boolean(isError));
}

function animarCliquePublico(botao) {
  if (!botao) {
    return;
  }

  botao.classList.remove("is-pressed");
  void botao.offsetWidth;
  botao.classList.add("is-pressed");
}

function contarItensCarrinhoPublico(itens = lerCarrinho()) {
  return itens.reduce((acc, item) => acc + Number(item.quantidade || 0), 0);
}

function atualizarBadgeCarrinhoPublico(itens = lerCarrinho()) {
  const total = contarItensCarrinhoPublico(itens);

  document.querySelectorAll("[data-cart-count]").forEach((elemento) => {
    elemento.textContent = total;
    elemento.classList.remove("pulse");
    if (total > 0) {
      void elemento.offsetWidth;
      elemento.classList.add("pulse");
    }
  });
}

function vibrarCarrinhoPublico() {
  document.querySelectorAll(".nav-cart-button").forEach((elemento) => {
    elemento.classList.remove("shake");
    void elemento.offsetWidth;
    elemento.classList.add("shake");
  });
}

function obterImagemPublica(produto) {
  const chave = String(produto.nome || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return (
    obterImagemBebidaSalva(produto.id) ||
    PUBLIC_PRODUCT_IMAGES[chave] ||
    obterImagemBebida(produto)
  );
}

function calcularTotalPublico(carrinho) {
  return carrinho.reduce(
    (acc, item) => acc + Number(item.preco || 0) * Number(item.quantidade || 0),
    0
  );
}

function renderizarResumoPublico(carrinho) {
  const totalItens = contarItensCarrinhoPublico(carrinho);
  const totalCategorias = new Set(
    carrinho.map((item) => obterCategoriaNormalizada(item.categoria))
  ).size;

  if (publicDom.resumoItens) {
    publicDom.resumoItens.textContent = `${totalItens} itens`;
  }

  if (publicDom.resumoItensTotal) {
    publicDom.resumoItensTotal.textContent = String(totalItens);
  }

  if (publicDom.resumoTipos) {
    publicDom.resumoTipos.textContent = String(totalCategorias);
  }

  if (publicDom.valorTotal) {
    publicDom.valorTotal.textContent = formatarMoeda(calcularTotalPublico(carrinho));
  }
}

function criarCardProdutoPublico(produto) {
  const article = document.createElement("article");
  const imagem = obterImagemPublica(produto);

  article.className = "product-card fade-up";
  article.innerHTML = `
    <div class="product-media">
      <div class="product-overlay">
        <span class="tag">${obterCategoriaNormalizada(produto.categoria)}</span>
      </div>
      <img src="${imagem}" alt="${produto.nome}" loading="lazy" />
    </div>
    <div class="product-body">
      <h3 class="product-name">${produto.nome}</h3>
      <div class="product-footer">
        <div class="price-block">
          <span class="product-category">${obterCategoriaNormalizada(produto.categoria)}</span>
          <div class="price">${formatarMoeda(produto.preco)}</div>
        </div>
        <button class="button button-primary" type="button">Adicionar</button>
      </div>
    </div>
  `;

  const img = article.querySelector("img");
  img.addEventListener(
    "error",
    () => {
      img.src = obterImagemBebida(produto);
    },
    { once: true }
  );

  const botao = article.querySelector("button");
  botao.addEventListener("click", () => {
    animarCliquePublico(botao);
    article.classList.remove("is-adding");
    void article.offsetWidth;
    article.classList.add("is-adding");

    adicionarAoCarrinho(
      {
        id: produto.id,
        nome: produto.nome,
        categoria: produto.categoria,
        preco: produto.preco,
        imagem,
      },
      { action: "add", source: "cliente" }
    );

    mostrarFeedbackPublico(publicDom.feedbackProdutos, `${produto.nome} adicionado`);
  });

  return article;
}

async function carregarProdutosPublicos() {
  if (!publicDom.listaProdutos) {
    return;
  }

  try {
    const produtos = normalizarLista(await api.listarBebidas());

    if (publicDom.catalogoCount) {
      publicDom.catalogoCount.textContent = `${produtos.length} itens`;
    }

    if (!produtos.length) {
      publicDom.listaProdutos.innerHTML = criarEmptyState("Sem produtos", " ");
      return;
    }

    publicDom.listaProdutos.innerHTML = "";
    produtos.forEach((produto) => {
      publicDom.listaProdutos.appendChild(criarCardProdutoPublico(produto));
    });
  } catch (error) {
    mostrarFeedbackPublico(publicDom.feedbackProdutos, error.message, true);
    publicDom.listaProdutos.innerHTML = criarEmptyState("Erro", " ");
  }
}

function criarItemCarrinhoPublico(item) {
  const article = document.createElement("article");
  const subtotal = Number(item.preco || 0) * Number(item.quantidade || 0);

  article.className = "cart-item";
  article.innerHTML = `
    <div class="cart-item-header">
      <div>
        <strong>${item.nome}</strong>
        <div class="cart-item-category">${obterCategoriaNormalizada(item.categoria)}</div>
      </div>
      <button class="icon-button-soft remover-item" type="button">x</button>
    </div>
    <div class="cart-item-footer">
      <div class="cart-controls">
        <button class="qty-button diminuir" type="button">-</button>
        <span class="qty-value">${item.quantidade}</span>
        <button class="qty-button aumentar" type="button">+</button>
      </div>
      <div class="cart-totals">
        <div class="cart-item-price">${formatarMoeda(item.preco)}</div>
        <div class="cart-item-subtotal">${formatarMoeda(subtotal)}</div>
      </div>
    </div>
  `;

  article.querySelector(".aumentar").addEventListener("click", () => {
    atualizarQuantidadeCarrinho(item.id, Number(item.quantidade || 0) + 1, {
      source: "cliente",
      action: "update",
    });
  });

  article.querySelector(".diminuir").addEventListener("click", () => {
    atualizarQuantidadeCarrinho(item.id, Number(item.quantidade || 0) - 1, {
      source: "cliente",
      action: "update",
    });
  });

  article.querySelector(".remover-item").addEventListener("click", () => {
    atualizarQuantidadeCarrinho(item.id, 0, {
      source: "cliente",
      action: "remove",
    });
  });

  return article;
}

function renderizarCarrinhoPublico() {
  if (!publicDom.listaCarrinho) {
    return;
  }

  const carrinho = lerCarrinho();

  if (!carrinho.length) {
    publicDom.listaCarrinho.innerHTML = criarEmptyState("Carrinho vazio", " ");
    renderizarResumoPublico([]);
    return;
  }

  publicDom.listaCarrinho.innerHTML = "";
  carrinho.forEach((item) => {
    publicDom.listaCarrinho.appendChild(criarItemCarrinhoPublico(item));
  });

  renderizarResumoPublico(carrinho);
}

function normalizarClientePublico(cliente) {
  if (!cliente || typeof cliente !== "object") {
    return null;
  }

  return cliente.data && typeof cliente.data === "object" ? cliente.data : cliente;
}

function obterNomeClientePublico(cliente) {
  return cliente?.nome || cliente?.cliente || `Cliente ${cliente?.id ?? ""}`.trim();
}

function marcarErroCampoPublico(campo, hasError) {
  if (!campo) {
    return;
  }

  campo.classList.toggle("field-error", Boolean(hasError));
}

function validarClientePublico() {
  const nomeVazio = !publicDom.inputClienteNome?.value.trim();
  const telefoneVazio = !publicDom.inputClienteTelefone?.value.trim();
  const enderecoVazio = !publicDom.inputClienteEndereco?.value.trim();

  marcarErroCampoPublico(publicDom.inputClienteNome, nomeVazio);
  marcarErroCampoPublico(publicDom.inputClienteTelefone, telefoneVazio);
  marcarErroCampoPublico(publicDom.inputClienteEndereco, enderecoVazio);

  return !(nomeVazio || telefoneVazio || enderecoVazio);
}

function limparCamposClientePublico() {
  [publicDom.inputClienteNome, publicDom.inputClienteTelefone, publicDom.inputClienteEndereco].forEach((campo) => {
    if (campo) {
      campo.value = "";
      campo.classList.remove("field-error");
    }
  });
}

function preencherCamposClientePublico(cliente) {
  if (publicDom.inputClienteNome) {
    publicDom.inputClienteNome.value = cliente?.nome || "";
  }
  if (publicDom.inputClienteTelefone) {
    publicDom.inputClienteTelefone.value = cliente?.telefone || "";
  }
  if (publicDom.inputClienteEndereco) {
    publicDom.inputClienteEndereco.value = cliente?.endereco || "";
  }
}

function preencherSelectClientesPublico(selectedId = "") {
  if (!publicDom.clienteSelect) {
    return;
  }

  publicDom.clienteSelect.innerHTML = [
    '<option value="">Cliente salvo</option>',
    ...publicState.clientes.map((cliente) => {
      const selected = String(selectedId) === String(cliente.id) ? "selected" : "";
      return `<option value="${cliente.id}" ${selected}>${obterNomeClientePublico(cliente)}</option>`;
    }),
  ].join("");
}

async function carregarClientesPublico(selectedId = "") {
  if (!publicDom.clienteSelect) {
    return;
  }

  try {
    const clientes = normalizarLista(await api.listarClientes());
    publicState.clientes = mesclarClientesComEstadoLocal(clientes).filter(Boolean);
    preencherSelectClientesPublico(selectedId);
  } catch (error) {
    mostrarFeedbackPublico(publicDom.feedbackCarrinho, error.message, true);
  }
}

async function salvarClientePublico() {
  if (!validarClientePublico()) {
    mostrarFeedbackPublico(publicDom.feedbackCarrinho, "Preencha os campos", true);
    return;
  }

  const payload = {
    nome: publicDom.inputClienteNome.value.trim(),
    telefone: publicDom.inputClienteTelefone.value.trim(),
    endereco: publicDom.inputClienteEndereco.value.trim(),
  };

  try {
    const clienteCriado = normalizarClientePublico(await api.criarCliente(payload));
    if (clienteCriado?.id) {
      desmarcarClienteRemovido(clienteCriado.id);
      limparOverrideCliente(clienteCriado.id);
      publicState.ultimoClienteCriadoId = clienteCriado.id;
    }
    limparCamposClientePublico();
    await carregarClientesPublico(publicState.ultimoClienteCriadoId || "");
    window.dispatchEvent(new CustomEvent("clientes:updated"));
    mostrarFeedbackPublico(publicDom.feedbackCarrinho, "Cliente salvo");
  } catch (error) {
    mostrarFeedbackPublico(publicDom.feedbackCarrinho, error.message, true);
  }
}

function selecionarClientePublico() {
  const cliente = publicState.clientes.find(
    (item) => String(item.id) === String(publicDom.clienteSelect.value || "")
  );

  if (!cliente) {
    limparCamposClientePublico();
    return;
  }

  preencherCamposClientePublico(cliente);
  publicState.ultimoClienteCriadoId = cliente.id;
}

function abrirModalPedidoPublico(resumo) {
  if (!publicDom.modalPedido) {
    return;
  }

  publicDom.modalPedidoTexto.textContent = "Pedido enviado";
  publicDom.modalPedidoResumo.innerHTML = `
    <strong>${resumo.cliente}</strong>
    <ul class="summary-list">
      <li>${resumo.itens} item(ns)</li>
      <li>${resumo.total}</li>
    </ul>
  `;

  publicDom.modalPedido.classList.add("is-open");
  publicDom.modalPedido.setAttribute("aria-hidden", "false");
}

function fecharModalPedidoPublico() {
  if (!publicDom.modalPedido) {
    return;
  }

  publicDom.modalPedido.classList.remove("is-open");
  publicDom.modalPedido.setAttribute("aria-hidden", "true");
}

async function finalizarPedidoPublico() {
  const carrinho = lerCarrinho();
  const clienteId =
    Number(publicDom.clienteSelect?.value) || Number(publicState.ultimoClienteCriadoId);

  if (!carrinho.length) {
    mostrarFeedbackPublico(publicDom.feedbackCarrinho, "Carrinho vazio", true);
    return;
  }

  if (!clienteId) {
    mostrarFeedbackPublico(publicDom.feedbackCarrinho, "Selecione um cliente", true);
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

  const clienteSelecionado = publicState.clientes.find(
    (cliente) => Number(cliente.id) === Number(clienteId)
  );

  try {
    publicDom.botaoFinalizar.disabled = true;
    publicDom.botaoFinalizar.innerHTML =
      '<span class="checkout-loading" aria-hidden="true"></span> Enviando';
    const pedidoCriado = await api.criarPedido(payload);
    const pedidoFinal = pedidoCriado?.data || pedidoCriado || {};

    abrirModalPedidoPublico({
      cliente: obterNomeClientePublico(clienteSelecionado) || "Cliente",
      itens: contarItensCarrinhoPublico(carrinho),
      total: formatarMoeda(calcularTotalPublico(carrinho)),
    });
    limparCarrinho({ source: "cliente", action: "clear" });
    renderizarCarrinhoPublico();
    mostrarFeedbackPublico(publicDom.feedbackCarrinho, "Pedido enviado");
  } catch (error) {
    mostrarFeedbackPublico(publicDom.feedbackCarrinho, error.message, true);
  } finally {
    publicDom.botaoFinalizar.disabled = false;
    publicDom.botaoFinalizar.textContent = "Finalizar pedido";
  }
}

function inicializarModalPublico() {
  if (!publicDom.modalPedido) {
    return;
  }

  document.querySelectorAll("[data-modal-close]").forEach((botao) => {
    botao.addEventListener("click", fecharModalPedidoPublico);
  });

  publicDom.modalPedido.addEventListener("click", (event) => {
    if (event.target === publicDom.modalPedido) {
      fecharModalPedidoPublico();
    }
  });
}

function inicializarEventosPublicos() {
  inicializarTemaPublico();
  atualizarBadgeCarrinhoPublico();
  renderizarCarrinhoPublico();
  inicializarModalPublico();
  carregarProdutosPublicos();
  carregarClientesPublico();

  document.querySelectorAll("[data-theme-toggle]").forEach((botao) => {
    botao.addEventListener("click", alternarTemaPublico);
  });

  publicDom.formCliente?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await salvarClientePublico();
  });

  publicDom.clienteSelect?.addEventListener("change", selecionarClientePublico);
  publicDom.botaoFinalizar?.addEventListener("click", finalizarPedidoPublico);

  [publicDom.inputClienteNome, publicDom.inputClienteTelefone, publicDom.inputClienteEndereco].forEach((campo) => {
    campo?.addEventListener("input", () => campo.classList.remove("field-error"));
  });

  window.addEventListener("cart:updated", (event) => {
    const itens = event.detail?.itens || lerCarrinho();
    atualizarBadgeCarrinhoPublico(itens);
    renderizarCarrinhoPublico();
    if (event.detail?.action === "add") {
      vibrarCarrinhoPublico();
    }
  });

  window.addEventListener("clientes:updated", () => {
    carregarClientesPublico(publicDom.clienteSelect?.value || "");
  });
}

inicializarEventosPublicos();
