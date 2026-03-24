const adminDom = {
  statProdutos: document.getElementById("stat-produtos"),
  statClientes: document.getElementById("stat-clientes"),
  statPedidos: document.getElementById("stat-pedidos"),
  navButtons: Array.from(document.querySelectorAll("[data-admin-nav]")),
  sections: Array.from(document.querySelectorAll("[data-admin-section]")),
  themeButtons: Array.from(document.querySelectorAll("[data-theme-toggle]")),
};

async function carregarDashboardAdmin() {
  if (!adminDom.statProdutos && !adminDom.statClientes && !adminDom.statPedidos) {
    return;
  }

  try {
    const [produtos, clientes, pedidos] = await Promise.all([
      api.listarBebidas(),
      api.listarClientes(),
      api.listarPedidos(),
    ]);

    if (adminDom.statProdutos) {
      adminDom.statProdutos.textContent = normalizarLista(produtos).length;
    }

    if (adminDom.statClientes) {
      adminDom.statClientes.textContent = mesclarClientesComEstadoLocal(normalizarLista(clientes)).length;
    }

    if (adminDom.statPedidos) {
      adminDom.statPedidos.textContent = normalizarLista(pedidos).length;
    }
  } catch (error) {
    const feedback = document.getElementById("feedback-pedidos");
    if (feedback) {
      feedback.textContent = error.message;
      feedback.classList.remove("hidden");
      feedback.classList.add("error");
    }
  }
}

async function recarregarAdmin() {
  await carregarDashboardAdmin();
}

function inicializarTemaAdmin() {
  const salvo = localStorage.getItem("drinkgo_theme");
  const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", salvo || (prefereEscuro ? "dark" : "light"));

  adminDom.themeButtons.forEach((botao) => {
    botao.addEventListener("click", () => {
      const atual = document.documentElement.getAttribute("data-theme") || "light";
      const proximo = atual === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", proximo);
      localStorage.setItem("drinkgo_theme", proximo);
    });
  });
}

function mostrarSecaoAdmin(secao) {
  adminDom.navButtons.forEach((botao) => {
    botao.classList.toggle("active", botao.dataset.adminNav === secao);
  });

  adminDom.sections.forEach((section) => {
    section.classList.toggle("hidden", section.dataset.adminSection !== secao);
  });
}

function inicializarNavegacaoAdmin() {
  if (!adminDom.navButtons.length) {
    return;
  }

  adminDom.navButtons.forEach((botao) => {
    botao.addEventListener("click", () => {
      mostrarSecaoAdmin(botao.dataset.adminNav);
    });
  });

  mostrarSecaoAdmin("dashboard");
}

function inicializarAdmin() {
  if (!document.body.matches("[data-page='admin']")) {
    return;
  }

  inicializarTemaAdmin();
  inicializarNavegacaoAdmin();
  recarregarAdmin();
  window.addEventListener("admin:data-updated", recarregarAdmin);
}

inicializarAdmin();
