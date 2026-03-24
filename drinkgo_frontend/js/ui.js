const THEME_STORAGE_KEY = "drinkgo_theme";

// UI compartilhada entre paginas abertas diretamente no navegador, sem bundler.
function contarItensCarrinho(itens = lerCarrinho()) {
  return itens.reduce((acc, item) => acc + Number(item.quantidade || 0), 0);
}

function aplicarTema(tema) {
  document.documentElement.setAttribute("data-theme", tema);
  localStorage.setItem(THEME_STORAGE_KEY, tema);
}

function alternarTema() {
  const atual = document.documentElement.getAttribute("data-theme") || "light";
  aplicarTema(atual === "dark" ? "light" : "dark");
}

function inicializarTema() {
  const salvo = localStorage.getItem(THEME_STORAGE_KEY);
  const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  aplicarTema(salvo || (prefereEscuro ? "dark" : "light"));
}

function atualizarBadgeCarrinho(itens = lerCarrinho()) {
  const total = contarItensCarrinho(itens);

  document.querySelectorAll("[data-cart-count]").forEach((elemento) => {
    elemento.textContent = total;
    elemento.classList.remove("pulse");
    if (total > 0) {
      void elemento.offsetWidth;
      elemento.classList.add("pulse");
    }
  });
}

function vibrarCarrinho() {
  document.querySelectorAll(".nav-link-cart .nav-icon").forEach((elemento) => {
    elemento.classList.remove("shake");
    void elemento.offsetWidth;
    elemento.classList.add("shake");
  });
}

function abrirModalPedido(resumo) {
  const modal = document.getElementById("modal-pedido");

  if (!modal) {
    return;
  }

  const texto = document.getElementById("modal-pedido-texto");
  const containerResumo = document.getElementById("modal-pedido-resumo");

  if (texto) {
    texto.textContent = "Seu pedido foi enviado para a API com sucesso.";
  }

  if (containerResumo) {
    containerResumo.innerHTML = `
      <strong>${resumo.cliente}</strong>
      <ul class="summary-list">
        <li>${resumo.itens} item(ns) no pedido</li>
        <li>Total ${resumo.total}</li>
      </ul>
    `;
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function fecharModalPedido() {
  const modal = document.getElementById("modal-pedido");

  if (!modal) {
    return;
  }

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function inicializarModal() {
  document.querySelectorAll("[data-modal-close]").forEach((botao) => {
    botao.addEventListener("click", fecharModalPedido);
  });

  const modal = document.getElementById("modal-pedido");
  if (!modal) {
    return;
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      fecharModalPedido();
    }
  });
}

function inicializarUI() {
  inicializarTema();
  atualizarBadgeCarrinho();
  inicializarModal();

  document.querySelectorAll("[data-theme-toggle]").forEach((botao) => {
    botao.addEventListener("click", alternarTema);
  });

  window.addEventListener("storage", (event) => {
    if (event.key === CARRINHO_STORAGE_KEY) {
      atualizarBadgeCarrinho();
    }
  });

  window.addEventListener("cart:updated", (event) => {
    atualizarBadgeCarrinho(event.detail?.itens || lerCarrinho());

    if (event.detail?.action === "add") {
      vibrarCarrinho();
    }
  });
}

inicializarUI();
