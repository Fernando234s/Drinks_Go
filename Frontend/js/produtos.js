const produtosDom = {
  lista: document.getElementById("lista-produtos-admin"),
  feedback: document.getElementById("feedback-produtos"),
  botaoNovo: document.getElementById("nova-bebida"),
  modal: document.getElementById("modal-bebida"),
  tituloModal: document.getElementById("modal-bebida-titulo"),
  form: document.getElementById("form-bebida"),
  id: document.getElementById("bebida-id"),
  nome: document.getElementById("bebida-nome"),
  categoria: document.getElementById("bebida-categoria"),
  preco: document.getElementById("bebida-preco"),
  estoque: document.getElementById("bebida-estoque"),
  imagemUrl: document.getElementById("bebida-imagem-url"),
};

function mostrarFeedbackProdutosAdmin(message, isError = false) {
  if (!produtosDom.feedback) {
    return;
  }

  produtosDom.feedback.textContent = message;
  produtosDom.feedback.classList.remove("hidden", "error");
  produtosDom.feedback.classList.toggle("error", Boolean(isError));
}

function obterImagemAdminProduto(produto) {
  return obterImagemBebidaSalva(produto.id) || produto.imagem || obterImagemBebida(produto);
}

function abrirModalCrudBebida(bebida = null) {
  if (!produtosDom.modal) {
    return;
  }

  produtosDom.tituloModal.textContent = bebida ? "Editar bebida" : "Nova bebida";
  produtosDom.id.value = bebida?.id || "";
  produtosDom.nome.value = bebida?.nome || "";
  produtosDom.categoria.value = bebida?.categoria || "";
  produtosDom.preco.value = bebida?.preco ?? "";
  produtosDom.estoque.value = bebida?.estoque ?? "";
  produtosDom.imagemUrl.value = bebida ? obterImagemAdminProduto(bebida) : "";

  produtosDom.modal.classList.add("is-open");
  produtosDom.modal.setAttribute("aria-hidden", "false");
}

function fecharModalCrudBebida() {
  if (!produtosDom.modal) {
    return;
  }

  produtosDom.modal.classList.remove("is-open");
  produtosDom.modal.setAttribute("aria-hidden", "true");
  produtosDom.form?.reset();
}

function validarFormBebida() {
  const campos = [produtosDom.nome, produtosDom.categoria, produtosDom.preco, produtosDom.estoque];
  let invalido = false;

  campos.forEach((campo) => {
    const vazio = !String(campo.value || "").trim();
    campo.classList.toggle("field-error", vazio);
    if (vazio) {
      invalido = true;
    }
  });

  return !invalido;
}

function criarLinhaProdutoAdmin(produto) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${produto.nome}</td>
    <td>${obterCategoriaNormalizada(produto.categoria)}</td>
    <td>${formatarMoeda(produto.preco)}</td>
    <td>${produto.estoque ?? 0}</td>
    <td class="table-actions">
      <button class="button button-ghost editar-produto" type="button">Editar</button>
      <button class="button button-danger excluir-produto" type="button">Excluir</button>
    </td>
  `;

  tr.querySelector(".editar-produto").addEventListener("click", () => {
    abrirModalCrudBebida(produto);
  });

  tr.querySelector(".excluir-produto").addEventListener("click", async () => {
    if (!window.confirm(`Excluir ${produto.nome}?`)) {
      return;
    }

    try {
      await api.removerBebida(produto.id);
      salvarImagemBebida(produto.id, "");
      tr.remove();
      window.dispatchEvent(new CustomEvent("admin:data-updated"));
      mostrarFeedbackProdutosAdmin("Bebida removida");
    } catch (error) {
      mostrarFeedbackProdutosAdmin(error.message, true);
    }
  });

  return tr;
}

async function renderizarProdutosCrud() {
  if (!produtosDom.lista) {
    return;
  }

  try {
    const bebidas = normalizarLista(await api.listarBebidas());

    if (!bebidas.length) {
      produtosDom.lista.innerHTML = '<tr><td colspan="5">Sem bebidas</td></tr>';
      return;
    }

    produtosDom.lista.innerHTML = "";
    bebidas.forEach((bebida) => {
      produtosDom.lista.appendChild(criarLinhaProdutoAdmin(bebida));
    });
  } catch (error) {
    mostrarFeedbackProdutosAdmin(error.message, true);
    produtosDom.lista.innerHTML = '<tr><td colspan="5">Erro</td></tr>';
  }
}

async function salvarBebidaCrud(event) {
  event.preventDefault();

  if (!validarFormBebida()) {
    mostrarFeedbackProdutosAdmin("Preencha os campos", true);
    return;
  }

  const bebidaId = produtosDom.id.value.trim();
  const payload = {
    nome: produtosDom.nome.value.trim(),
    categoria: produtosDom.categoria.value.trim(),
    preco: Number(produtosDom.preco.value),
    estoque: Number(produtosDom.estoque.value),
  };

  try {
    const bebida = bebidaId
      ? await api.atualizarBebida(bebidaId, payload)
      : await api.criarBebida(payload);

    const bebidaNormalizada = bebida?.data || bebida;
    salvarImagemBebida(bebidaNormalizada.id, produtosDom.imagemUrl.value.trim());
    fecharModalCrudBebida();
    await renderizarProdutosCrud();
    window.dispatchEvent(new CustomEvent("admin:data-updated"));
    mostrarFeedbackProdutosAdmin(bebidaId ? "Bebida atualizada" : "Bebida criada");
  } catch (error) {
    mostrarFeedbackProdutosAdmin(error.message, true);
  }
}

function inicializarProdutosCrud() {
  if (!produtosDom.lista) {
    return;
  }

  renderizarProdutosCrud();
  produtosDom.botaoNovo?.addEventListener("click", () => abrirModalCrudBebida());
  produtosDom.form?.addEventListener("submit", salvarBebidaCrud);

  document.querySelectorAll("[data-modal-close-parent='modal-bebida']").forEach((botao) => {
    botao.addEventListener("click", fecharModalCrudBebida);
  });

  produtosDom.modal?.addEventListener("click", (event) => {
    if (event.target === produtosDom.modal) {
      fecharModalCrudBebida();
    }
  });

  [produtosDom.nome, produtosDom.categoria, produtosDom.preco, produtosDom.estoque].forEach((campo) => {
    campo?.addEventListener("input", () => campo.classList.remove("field-error"));
  });

  window.addEventListener("produtos:updated", renderizarProdutosCrud);
  window.addEventListener("admin:data-updated", renderizarProdutosCrud);
}

inicializarProdutosCrud();
