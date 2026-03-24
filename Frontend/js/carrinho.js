const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const clienteSelect = document.getElementById('cliente-select');
const clienteForm = document.getElementById('cliente-form');
const finishOrderButton = document.getElementById('finish-order');
const cartFeedback = document.getElementById('cart-feedback');
const statusSelect = document.getElementById('status-id');

function updateItemQuantity(productId, delta) {
  const cart = getCart()
    .map((item) => item.id === productId ? { ...item, quantidade: item.quantidade + delta } : item)
    .filter((item) => item.quantidade > 0);

  saveCart(cart);
  renderCart();
}

function renderCart() {
  const cart = getCart();

  if (!cart.length) {
    cartItemsContainer.innerHTML = '<div class="empty-state">Carrinho vazio.</div>';
    cartTotalElement.textContent = money(0);
    return;
  }

  cartItemsContainer.innerHTML = cart.map((item) => `
    <article class="cart-item">
      <div>
        <div class="product-name">${item.nome}</div>
        <div class="product-meta">${money(item.preco)}</div>
      </div>
      <div class="qty-box">
        <button class="qty-button" type="button" data-qty="${item.id}" data-delta="-1">-</button>
        <strong>${item.quantidade}</strong>
        <button class="qty-button" type="button" data-qty="${item.id}" data-delta="1">+</button>
      </div>
    </article>
  `).join('');

  const total = cart.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
  cartTotalElement.textContent = money(total);

  document.querySelectorAll('[data-qty]').forEach((button) => {
    button.addEventListener('click', () => {
      updateItemQuantity(Number(button.dataset.qty), Number(button.dataset.delta));
    });
  });
}

async function loadClientes(selectedId = '') {
  try {
    const clientes = await apiFetch('/clientes');
    clienteSelect.innerHTML = '<option value="">Selecione</option>' + clientes.map((cliente) => (
      `<option value="${cliente.id}" ${String(selectedId) === String(cliente.id) ? 'selected' : ''}>${cliente.nome}</option>`
    )).join('');
  } catch (error) {
    setFeedback(cartFeedback, error.message, 'error');
  }
}

clienteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setFeedback(cartFeedback, '');

  const formData = new FormData(clienteForm);
  const payload = {
    nome: formData.get('nome'),
    telefone: formData.get('telefone'),
    endereco: formData.get('endereco'),
  };

  try {
    const cliente = await apiFetch('/clientes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    clienteForm.reset();
    await loadClientes(cliente.id);
    setFeedback(cartFeedback, 'Cliente cadastrado.', 'success');
  } catch (error) {
    setFeedback(cartFeedback, error.message, 'error');
  }
});

finishOrderButton.addEventListener('click', async () => {
  const cart = getCart();

  if (!cart.length) {
    setFeedback(cartFeedback, 'Carrinho vazio.', 'error');
    return;
  }

  if (!clienteSelect.value) {
    setFeedback(cartFeedback, 'Selecione um cliente.', 'error');
    return;
  }

  const payload = {
    cliente_id: Number(clienteSelect.value),
    status_id: Number(statusSelect.value),
    itens: cart.map((item) => ({
      bebida_id: item.id,
      quantidade: item.quantidade,
    })),
  };

  try {
    await apiFetch('/pedidos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    saveCart([]);
    renderCart();
    setFeedback(cartFeedback, 'Pedido enviado.', 'success');
  } catch (error) {
    setFeedback(cartFeedback, error.message, 'error');
  }
});

renderCart();
loadClientes();
