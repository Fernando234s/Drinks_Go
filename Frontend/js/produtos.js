const productsGrid = document.getElementById('products-grid');
const refreshProductsButton = document.getElementById('refresh-products');
const addProductToggleButton = document.getElementById('add-product-toggle');
const productForm = document.getElementById('product-form');
const productIdInput = document.getElementById('product-id');
const productNameInput = document.getElementById('product-name');
const productCategoryInput = document.getElementById('product-category');
const productPriceInput = document.getElementById('product-price');
const productStockInput = document.getElementById('product-stock');
const cancelProductButton = document.getElementById('cancel-product');

let produtos = [];

function limparFormulario() {
  productForm.reset();
  productIdInput.value = '';
  productNameInput.focus();
}

function preencherFormulario(produto) {
  productIdInput.value = produto.id;
  productNameInput.value = produto.nome || '';
  productCategoryInput.value = produto.categoria || '';
  productPriceInput.value = Number(produto.preco || 0);
  productStockInput.value = Number(produto.estoque || 0);
  productNameInput.focus();
}

function renderizarProdutos(lista) {
  if (!lista.length) {
    productsGrid.innerHTML = '<div class="empty-state">Sem bebidas cadastradas.</div>';
    return;
  }

  productsGrid.innerHTML = lista.map((produto) => `
    <div class="product-row">
      <div>
        <div class="product-name">${produto.nome}</div>
        <div class="product-meta">${produto.categoria || 'Sem categoria'}</div>
      </div>
      <div>${money(produto.preco)}</div>
      <div>Estoque: ${produto.estoque ?? 0}</div>
      <div class="product-actions">
        <button class="button secondary small" type="button" data-edit-id="${produto.id}">Editar</button>
        <button class="button danger small" type="button" data-delete-id="${produto.id}">Excluir</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('[data-edit-id]').forEach((button) => {
    button.addEventListener('click', () => editarBebida(Number(button.dataset.editId)));
  });

  document.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => excluirBebida(Number(button.dataset.deleteId)));
  });
}

async function carregarProdutos() {
  productsGrid.innerHTML = '<div class="empty-state">Carregando...</div>';

  try {
    produtos = await apiFetch('/bebidas');
    renderizarProdutos(produtos);
  } catch (error) {
    productsGrid.innerHTML = `<div class="empty-state">${error.message}</div>`;
    alert(`Erro: ${error.message}`);
  }
}

async function criarBebida(payload) {
  try {
    await apiFetch('/bebidas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    alert('Bebida cadastrada com sucesso.');
    limparFormulario();
    await carregarProdutos();
  } catch (error) {
    alert(`Erro: ${error.message}`);
  }
}

function editarBebida(id) {
  const produto = produtos.find((item) => item.id === id);

  if (!produto) {
    alert('Erro: bebida nao encontrada.');
    return;
  }

  preencherFormulario(produto);
}

async function atualizarBebida(id, payload) {
  try {
    await apiFetch(`/bebidas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    alert('Bebida atualizada com sucesso.');
    limparFormulario();
    await carregarProdutos();
  } catch (error) {
    alert(`Erro: ${error.message}`);
  }
}

async function excluirBebida(id) {
  const produto = produtos.find((item) => item.id === id);

  if (!produto) {
    alert('Erro: bebida nao encontrada.');
    return;
  }

  if (!window.confirm(`Excluir "${produto.nome}"?`)) {
    return;
  }

  try {
    await apiFetch(`/bebidas/${id}`, {
      method: 'DELETE',
    });

    alert('Bebida excluida com sucesso.');
    await carregarProdutos();
  } catch (error) {
    alert(`Erro: ${error.message}`);
  }
}

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    nome: productNameInput.value.trim(),
    categoria: productCategoryInput.value.trim(),
    preco: Number(productPriceInput.value),
    estoque: Number(productStockInput.value),
  };

  if (productIdInput.value) {
    await atualizarBebida(Number(productIdInput.value), payload);
    return;
  }

  await criarBebida(payload);
});

cancelProductButton.addEventListener('click', limparFormulario);
addProductToggleButton.addEventListener('click', limparFormulario);
refreshProductsButton.addEventListener('click', carregarProdutos);

carregarProdutos();
