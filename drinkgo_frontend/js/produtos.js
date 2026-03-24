const formBebida = document.getElementById("form-bebida");
const inputId = document.getElementById("bebida-id");
const inputNome = document.getElementById("nome");
const inputCategoria = document.getElementById("categoria");
const inputPreco = document.getElementById("preco");
const inputEstoque = document.getElementById("estoque");
const listaProdutos = document.getElementById("lista-produtos");
const botaoCancelar = document.getElementById("botao-cancelar");
const botaoRecarregar = document.getElementById("botao-recarregar");

function obterPayloadFormulario() {
  return {
    nome: inputNome.value.trim(),
    categoria: inputCategoria.value.trim(),
    preco: Number(inputPreco.value),
    estoque: Number(inputEstoque.value),
  };
}

function limparFormulario() {
  inputId.value = "";
  formBebida.reset();
  botaoCancelar.classList.add("hidden");
}

function preencherFormulario(bebida) {
  inputId.value = bebida.id ?? "";
  inputNome.value = bebida.nome || "";
  inputCategoria.value = bebida.categoria || "";
  inputPreco.value = bebida.preco ?? 0;
  inputEstoque.value = bebida.estoque ?? 0;
  botaoCancelar.classList.remove("hidden");
  inputNome.focus();
}

function criarLinhaProduto(bebida) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${bebida.nome || "-"}</td>
    <td>${bebida.categoria || "-"}</td>
    <td>${formatarMoeda(bebida.preco)}</td>
    <td>${Number(bebida.estoque || 0)}</td>
    <td>
      <div class="table-actions">
        <button class="button secondary" type="button" data-acao="editar">Editar</button>
        <button class="button danger" type="button" data-acao="excluir">Excluir</button>
      </div>
    </td>
  `;

  tr.querySelector('[data-acao="editar"]').addEventListener("click", () => {
    editarBebida(bebida.id);
  });

  tr.querySelector('[data-acao="excluir"]').addEventListener("click", () => {
    excluirBebida(bebida.id);
  });

  return tr;
}

async function carregarProdutos() {
  try {
    const bebidas = normalizarLista(await api.listarBebidas());

    if (!bebidas.length) {
      listaProdutos.innerHTML = `
        <tr>
          <td colspan="5">${criarEmptyState("Nenhuma bebida cadastrada", "Use o formulario acima para criar a primeira bebida.")}</td>
        </tr>
      `;
      return;
    }

    listaProdutos.innerHTML = "";
    bebidas.forEach((bebida) => {
      listaProdutos.appendChild(criarLinhaProduto(bebida));
    });
  } catch (error) {
    alert(`erro: ${error.message}`);
    listaProdutos.innerHTML = `
      <tr>
        <td colspan="5">${criarEmptyState("Falha ao carregar", "Verifique a API em http://localhost:3000.")}</td>
      </tr>
    `;
  }
}

async function criarBebida() {
  const payload = obterPayloadFormulario();
  await api.criarBebida(payload);
  alert("sucesso");
  limparFormulario();
  await carregarProdutos();
}

async function atualizarBebida(id) {
  const payload = obterPayloadFormulario();
  await api.atualizarBebida(id, payload);
  alert("sucesso");
  limparFormulario();
  await carregarProdutos();
}

async function editarBebida(id) {
  try {
    const bebidas = normalizarLista(await api.listarBebidas());
    const bebida = bebidas.find((item) => Number(item.id) === Number(id));

    if (!bebida) {
      alert("erro");
      return;
    }

    preencherFormulario(bebida);
  } catch (error) {
    alert(`erro: ${error.message}`);
  }
}

async function excluirBebida(id) {
  const confirmado = window.confirm("Deseja excluir esta bebida?");

  if (!confirmado) {
    return;
  }

  try {
    await api.excluirBebida(id);
    alert("sucesso");
    if (Number(inputId.value) === Number(id)) {
      limparFormulario();
    }
    await carregarProdutos();
  } catch (error) {
    alert(`erro: ${error.message}`);
  }
}

formBebida.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    if (!inputNome.value.trim() || inputPreco.value === "") {
      alert("erro: nome e preco sao obrigatorios");
      return;
    }

    if (inputId.value) {
      await atualizarBebida(inputId.value);
      return;
    }

    await criarBebida();
  } catch (error) {
    alert(`erro: ${error.message}`);
  }
});

botaoCancelar.addEventListener("click", () => {
  limparFormulario();
});

botaoRecarregar.addEventListener("click", () => {
  carregarProdutos();
});

carregarProdutos();