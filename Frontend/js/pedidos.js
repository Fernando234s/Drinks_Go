const ordersList = document.getElementById('orders-list');
const refreshOrdersButton = document.getElementById('refresh-orders');

function normalizeStatusValue(status) {
  if (typeof status === 'number') {
    return status;
  }

  const normalized = String(status || '').trim().toLowerCase();

  if (normalized.includes('preparo')) {
    return 2;
  }

  if (normalized.includes('entrega')) {
    return 3;
  }

  if (normalized.includes('final')) {
    return 4;
  }

  return 1;
}

function orderStatusOptions(selectedValue) {
  const options = [
    { value: 1, label: 'Pendente' },
    { value: 2, label: 'Em preparo' },
    { value: 3, label: 'Saiu para entrega' },
    { value: 4, label: 'Finalizado' },
  ];

  return options.map((option) => (
    `<option value="${option.value}" ${normalizeStatusValue(selectedValue) === option.value ? 'selected' : ''}>${option.label}</option>`
  )).join('');
}

function renderOrders(orders) {
  if (!orders.length) {
    ordersList.innerHTML = '<div class="empty-state">Sem pedidos.</div>';
    return;
  }

  ordersList.innerHTML = orders.map((order) => `
    <article class="order-card">
      <div class="order-head">
        <div>
          <div class="order-title">Pedido #${order.id}</div>
          <div class="product-meta">${order.cliente_nome || 'Cliente nao informado'}</div>
        </div>
        <div class="product-meta">${new Date(order.data_pedido).toLocaleString('pt-BR')}</div>
      </div>
      <div class="order-items">
        ${(order.bebidas || []).map((item) => `
          <div class="order-item">
            <span>${item.nome}</span>
            <strong>x${item.quantidade}</strong>
          </div>
        `).join('')}
      </div>
      <div class="order-actions">
        <select data-status-order="${order.id}">
          ${orderStatusOptions(order.status)}
        </select>
        <button class="button danger" type="button" data-delete-order="${order.id}">Excluir</button>
      </div>
    </article>
  `).join('');

  document.querySelectorAll('[data-status-order]').forEach((select) => {
    select.addEventListener('change', async () => {
      try {
        await apiFetch(`/pedidos/${select.dataset.statusOrder}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status_id: Number(select.value) }),
        });
        await loadOrders();
      } catch (error) {
        alert(error.message);
      }
    });
  });

  document.querySelectorAll('[data-delete-order]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await apiFetch(`/pedidos/${button.dataset.deleteOrder}`, {
          method: 'DELETE',
        });
        await loadOrders();
      } catch (error) {
        alert(error.message);
      }
    });
  });
}

async function loadOrders() {
  ordersList.innerHTML = '<div class="empty-state">Carregando...</div>';

  try {
    const orders = await apiFetch('/pedidos');
    renderOrders(orders);
  } catch (error) {
    ordersList.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

refreshOrdersButton.addEventListener('click', loadOrders);
loadOrders();
