const clientesDom = {
  lista: document.getElementById("lista-clientes-admin"),
  feedback: document.getElementById("feedback-clientes"),
  botaoNovo: document.getElementById("novo-cliente"),
  modal: document.getElementById("modal-cliente"),
  tituloModal: document.getElementById("modal-cliente-titulo"),
  form: document.getElementById("form-cliente-crud"),
  id: document.getElementById("cliente-crud-id"),
  nome: document.getElementById("cliente-crud-nome"),
  telefone: document.getElementById("cliente-crud-telefone"),
  endereco: document.getElementById("cliente-crud-endereco"),
};

function mostrarFeedbackClientesAdmin(message, isError = false) {
  if (!clientesDom.feedback) {
    return;
  }

  clientesDom.feedback.textContent = message;
  clientesDom.feedback.classList.remove("hidden", "error");
  clientesDom.feedback.classList.toggle("error", Boolean(isError));
}

function abrirModalCrudCliente(cliente = null) {
  if (!clientesDom.modal) {
    return;
  }

  clientesDom.tituloModal.textContent = cliente ? "Editar cliente" : "Novo cliente";
  clientesDom.id.value = cliente?.id || "";
  clientesDom.nome.value = cliente?.nome || "";
  clientesDom.telefone.value = cliente?.telefone || "";
  clientesDom.endereco.value = cliente?.endereco || "";

  clientesDom.modal.classList.add("is-open");
  clientesDom.modal.setAttribute("aria-hidden", "false");
}

function fecharModalCrudCliente() {
  if (!clientesDom.modal) {
    return;
  }

  clientesDom.modal.classList.remove("is-open");
  clientesDom.modal.setAttribute("aria-hidden", "true");
  clientesDom.form?.reset();
}

function validarClienteCrud() {
  const campos = [clientesDom.nome, clientesDom.telefone, clientesDom.endereco];
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

function criarLinhaClienteAdmin(cliente) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${cliente.nome}</td>
    <td>${cliente.telefone || ""}</td>
    <td>${cliente.endereco || ""}</td>
    <td class="table-actions">
      <button class="button button-ghost editar-cliente" type="button">Editar</button>
      <button class="button button-danger excluir-cliente" type="button">Excluir</button>
    </td>
  `;

  tr.querySelector(".editar-cliente").addEventListener("click", () => {
    abrirModalCrudCliente(cliente);
  });

  tr.querySelector(".excluir-cliente").addEventListener("click", async () => {
    if (!window.confirm(`Excluir ${cliente.nome}?`)) {
      return;
    }

    try {
      try {
        await api.removerCliente(cliente.id);
      } catch (error) {
        marcarClienteRemovido(cliente.id);
      }

      tr.remove();
      window.dispatchEvent(new CustomEvent("clientes:updated"));
      window.dispatchEvent(new CustomEvent("admin:data-updated"));
      mostrarFeedbackClientesAdmin("Cliente removido");
    } catch (error) {
      mostrarFeedbackClientesAdmin(error.message, true);
    }
  });

  return tr;
}

async function renderizarClientesCrud() {
  if (!clientesDom.lista) {
    return;
  }

  try {
    const clientes = mesclarClientesComEstadoLocal(normalizarLista(await api.listarClientes()));

    if (!clientes.length) {
      clientesDom.lista.innerHTML = '<tr><td colspan="4">Sem clientes</td></tr>';
      return;
    }

    clientesDom.lista.innerHTML = "";
    clientes.forEach((cliente) => {
      clientesDom.lista.appendChild(criarLinhaClienteAdmin(cliente));
    });
  } catch (error) {
    mostrarFeedbackClientesAdmin(error.message, true);
    clientesDom.lista.innerHTML = '<tr><td colspan="4">Erro</td></tr>';
  }
}

async function salvarClienteCrud(event) {
  event.preventDefault();

  if (!validarClienteCrud()) {
    mostrarFeedbackClientesAdmin("Preencha os campos", true);
    return;
  }

  const clienteId = clientesDom.id.value.trim();
  const payload = {
    nome: clientesDom.nome.value.trim(),
    telefone: clientesDom.telefone.value.trim(),
    endereco: clientesDom.endereco.value.trim(),
  };

  try {
    if (clienteId) {
      try {
        await api.atualizarCliente(clienteId, payload);
        limparOverrideCliente(clienteId);
      } catch (error) {
        salvarOverrideCliente({ id: Number(clienteId), ...payload });
      }
    } else {
      const clienteCriado = await api.criarCliente(payload);
      const clienteFinal = clienteCriado?.data || clienteCriado || payload;
      if (clienteFinal.id) {
        desmarcarClienteRemovido(clienteFinal.id);
        limparOverrideCliente(clienteFinal.id);
      }
    }

    fecharModalCrudCliente();
    await renderizarClientesCrud();
    window.dispatchEvent(new CustomEvent("clientes:updated"));
    window.dispatchEvent(new CustomEvent("admin:data-updated"));
    mostrarFeedbackClientesAdmin(clienteId ? "Cliente atualizado" : "Cliente criado");
  } catch (error) {
    mostrarFeedbackClientesAdmin(error.message, true);
  }
}

function inicializarClientesCrud() {
  if (!clientesDom.lista) {
    return;
  }

  renderizarClientesCrud();
  clientesDom.botaoNovo?.addEventListener("click", () => abrirModalCrudCliente());
  clientesDom.form?.addEventListener("submit", salvarClienteCrud);

  document.querySelectorAll("[data-modal-close-parent='modal-cliente']").forEach((botao) => {
    botao.addEventListener("click", fecharModalCrudCliente);
  });

  clientesDom.modal?.addEventListener("click", (event) => {
    if (event.target === clientesDom.modal) {
      fecharModalCrudCliente();
    }
  });

  [clientesDom.nome, clientesDom.telefone, clientesDom.endereco].forEach((campo) => {
    campo?.addEventListener("input", () => campo.classList.remove("field-error"));
  });

  window.addEventListener("clientes:updated", renderizarClientesCrud);
  window.addEventListener("admin:data-updated", renderizarClientesCrud);
}

inicializarClientesCrud();
