const API_BASE_URL = 'http://localhost:3000';
const CART_KEY = 'drinkgo_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (_) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const totalItems = getCart().reduce((sum, item) => sum + item.quantidade, 0);
  document.querySelectorAll('#cart-count').forEach((element) => {
    element.textContent = totalItems;
  });
}

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = 'Erro na requisicao';

    try {
      const data = await response.json();
      errorMessage = data.erro || data.detalhes || errorMessage;
    } catch (_) {
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function setFeedback(element, message, type = '') {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = `feedback ${type}`.trim();
}

updateCartCount();
