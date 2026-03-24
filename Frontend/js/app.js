const API_BASE_URL = "http://localhost:3000";
const STORAGE_KEY = "drink_go_cart_v1";

const state = {
  products: [],
  activeCategory: "Todas",
  cart: loadCart(),
  isCartOpen: false,
};

const elements = {
  productGrid: document.getElementById("productGrid"),
  catalogEmpty: document.getElementById("catalogEmpty"),
  filters: document.getElementById("filters"),
  cartSidebar: document.getElementById("cartSidebar"),
  cartBackdrop: document.getElementById("cartBackdrop"),
  cartToggle: document.getElementById("cartToggle"),
  closeCart: document.getElementById("closeCart"),
  cartItems: document.getElementById("cartItems"),
  cartCount: document.getElementById("cartCount"),
  cartTotal: document.getElementById("cartTotal"),
  checkoutForm: document.getElementById("checkoutForm"),
  checkoutButton: document.getElementById("checkoutButton"),
  productCount: document.getElementById("productCount"),
  categoryCount: document.getElementById("categoryCount"),
  toastStack: document.getElementById("toastStack"),
  productCardTemplate: document.getElementById("productCardTemplate"),
  cartItemTemplate: document.getElementById("cartItemTemplate"),
};

initialize();

function initialize() {
  bindEvents();
  renderCart();
  fetchProducts();
}

function bindEvents() {
  elements.cartToggle.addEventListener("click", () => toggleCart(true));
  elements.closeCart.addEventListener("click", () => toggleCart(false));
  elements.cartBackdrop.addEventListener("click", () => toggleCart(false));
  elements.checkoutForm.addEventListener("submit", handleCheckout);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.isCartOpen) {
      toggleCart(false);
    }
  });
}

async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/bebidas`);

    if (!response.ok) {
      throw new Error("Nao foi possivel carregar as bebidas.");
    }

    const data = await response.json();
    state.products = Array.isArray(data) ? data : [];
    renderFilters();
    renderProducts();
    renderCart();
    updateHeroStats();
  } catch (error) {
    showToast(error.message, "error");
    elements.productGrid.innerHTML = "";
    elements.catalogEmpty.classList.remove("hidden");
    elements.catalogEmpty.innerHTML = `
      <strong>Falha ao carregar bebidas.</strong>
      <span>Verifique se a API esta ativa em ${API_BASE_URL}.</span>
    `;
  }
}

function renderFilters() {
  const categories = [
    "Todas",
    ...new Set(
      state.products
        .map((product) => sanitizeCategory(product.categoria))
        .filter(Boolean)
    ),
  ];

  elements.filters.innerHTML = "";

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip${category === state.activeCategory ? " is-active" : ""}`;
    button.textContent = category;
    button.addEventListener("click", () => {
      state.activeCategory = category;
      renderFilters();
      renderProducts();
    });
    elements.filters.appendChild(button);
  });
}

function renderProducts() {
  const products = getVisibleProducts();
  elements.productGrid.innerHTML = "";
  elements.catalogEmpty.classList.toggle("hidden", products.length > 0);

  products.forEach((product) => {
    const fragment = elements.productCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".product-card");
    const image = fragment.querySelector(".product-card__image");
    const category = sanitizeCategory(product.categoria);

    image.src = resolveImage(product);
    image.alt = product.nome;
    fragment.querySelector(".product-card__badge").textContent = getBadgeLabel(product);
    fragment.querySelector(".product-card__category").textContent = category;
    fragment.querySelector(".product-card__title").textContent = product.nome;
    fragment.querySelector(".product-card__price").textContent = formatCurrency(product.preco);

    fragment
      .querySelector(".product-card__button")
      .addEventListener("click", () => addToCart(product));

    card.dataset.productId = String(product.id);
    elements.productGrid.appendChild(fragment);
  });
}

function renderCart() {
  const cartEntries = state.cart.map((item) => {
    const product = state.products.find((entry) => String(entry.id) === String(item.id));
    return product ? { ...product, quantity: item.quantity } : null;
  }).filter(Boolean);

  elements.cartItems.innerHTML = "";

  if (cartEntries.length === 0) {
    elements.cartItems.innerHTML = `
      <div class="empty-cart">
        <strong>Seu carrinho esta vazio.</strong>
        <span>Adicione bebidas para continuar.</span>
      </div>
    `;
  } else {
    cartEntries.forEach((entry) => {
      const fragment = elements.cartItemTemplate.content.cloneNode(true);
      fragment.querySelector(".cart-item__name").textContent = entry.nome;
      fragment.querySelector(".cart-item__price").textContent = `${entry.quantity} x ${formatCurrency(entry.preco)} = ${formatCurrency(entry.quantity * Number(entry.preco || 0))}`;
      fragment.querySelector(".qty-stepper__value").textContent = entry.quantity;

      fragment.querySelector('[data-action="decrease"]').addEventListener("click", () => updateQuantity(entry.id, entry.quantity - 1));
      fragment.querySelector('[data-action="increase"]').addEventListener("click", () => updateQuantity(entry.id, entry.quantity + 1));
      fragment.querySelector('[data-action="remove"]').addEventListener("click", () => removeFromCart(entry.id));

      elements.cartItems.appendChild(fragment);
    });
  }

  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartEntries.reduce((sum, item) => sum + Number(item.preco || 0) * item.quantity, 0);

  elements.cartCount.textContent = String(totalItems);
  elements.cartTotal.textContent = formatCurrency(totalPrice);
  persistCart();
}

function updateHeroStats() {
  const categories = new Set(state.products.map((product) => sanitizeCategory(product.categoria)));
  elements.productCount.textContent = String(state.products.length);
  elements.categoryCount.textContent = String(categories.size);
}

function getVisibleProducts() {
  if (state.activeCategory === "Todas") {
    return state.products;
  }

  return state.products.filter(
    (product) => sanitizeCategory(product.categoria) === state.activeCategory
  );
}

function addToCart(product) {
  const currentItem = state.cart.find((item) => String(item.id) === String(product.id));

  if (currentItem) {
    currentItem.quantity += 1;
  } else {
    state.cart.push({ id: product.id, quantity: 1 });
  }

  renderCart();
  pulseCard(product.id);
  showToast(`${product.nome} adicionado ao carrinho.`, "success");
}

function updateQuantity(productId, nextQuantity) {
  if (nextQuantity <= 0) {
    removeFromCart(productId);
    return;
  }

  state.cart = state.cart.map((item) =>
    String(item.id) === String(productId) ? { ...item, quantity: nextQuantity } : item
  );

  renderCart();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((item) => String(item.id) !== String(productId));
  renderCart();
}

async function handleCheckout(event) {
  event.preventDefault();

  if (state.cart.length === 0) {
    showToast("Adicione pelo menos uma bebida ao carrinho.", "error");
    return;
  }

  const formData = new FormData(elements.checkoutForm);
  const cliente = {
    nome: String(formData.get("nome") || "").trim(),
    telefone: String(formData.get("telefone") || "").trim(),
    endereco: String(formData.get("endereco") || "").trim(),
  };

  if (!cliente.nome || !cliente.telefone || !cliente.endereco) {
    showToast("Preencha nome, telefone e endereco.", "error");
    return;
  }

  setCheckoutLoading(true);

  try {
    const clienteCriado = await request("/clientes", {
      method: "POST",
      body: JSON.stringify(cliente),
    });

    await request("/pedidos", {
      method: "POST",
      body: JSON.stringify({
        cliente_id: clienteCriado.id,
        status_id: 1,
        itens: state.cart.map((item) => ({
          bebida_id: item.id,
          quantidade: item.quantity,
        })),
      }),
    });

    state.cart = [];
    renderCart();
    elements.checkoutForm.reset();
    toggleCart(false);
    showToast("Pedido finalizado com sucesso.", "success");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setCheckoutLoading(false);
  }
}

function toggleCart(forceState) {
  state.isCartOpen = typeof forceState === "boolean" ? forceState : !state.isCartOpen;
  elements.cartSidebar.classList.toggle("is-open", state.isCartOpen);
  elements.cartBackdrop.classList.toggle("hidden", !state.isCartOpen);
  document.body.style.overflow = state.isCartOpen ? "hidden" : "";
}

function setCheckoutLoading(isLoading) {
  elements.checkoutButton.disabled = isLoading;
  elements.checkoutButton.textContent = isLoading ? "Enviando..." : "Finalizar Pedido";
}

function request(path, options = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  }).then(async (response) => {
    if (!response.ok) {
      let message = "Nao foi possivel concluir a operacao.";

      try {
        const errorData = await response.json();
        message = errorData.erro || errorData.message || message;
      } catch (error) {
        message = response.statusText || message;
      }

      throw new Error(message);
    }

    return response.json();
  });
}

function loadCart() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function persistCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
}

function pulseCard(productId) {
  const card = document.querySelector(`[data-product-id="${productId}"]`);

  if (!card) {
    return;
  }

  card.animate(
    [
      { transform: "translateY(0) scale(1)" },
      { transform: "translateY(-6px) scale(1.01)" },
      { transform: "translateY(0) scale(1)" },
    ],
    {
      duration: 320,
      easing: "ease-out",
    }
  );
}

function showToast(message, type = "default") {
  const toast = document.createElement("div");
  toast.className = `toast${type !== "default" ? ` toast--${type}` : ""}`;
  toast.textContent = message;
  elements.toastStack.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 2600);
}

function sanitizeCategory(category) {
  return String(category || "Sem categoria").trim() || "Sem categoria";
}

function getBadgeLabel(product) {
  const estoque = Number(product.estoque || 0);

  if (estoque > 0) {
    return `Estoque ${estoque}`;
  }

  return "Disponivel";
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function resolveImage(product) {
  if (product.imagem) {
    return product.imagem;
  }

  const label = encodeURIComponent(product.nome || "Drink Go");
  const category = encodeURIComponent(sanitizeCategory(product.categoria));

  return `data:image/svg+xml;charset=UTF-8,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 420'>
    <defs>
      <linearGradient id='bg' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0%' stop-color='%23ff8a50'/>
        <stop offset='100%' stop-color='%2319a56f'/>
      </linearGradient>
    </defs>
    <rect width='640' height='420' fill='url(%23bg)'/>
    <circle cx='500' cy='94' r='82' fill='rgba(255,255,255,0.16)'/>
    <circle cx='144' cy='336' r='112' fill='rgba(255,255,255,0.14)'/>
    <rect x='188' y='96' width='128' height='182' rx='36' fill='rgba(255,255,255,0.84)'/>
    <rect x='226' y='58' width='52' height='54' rx='18' fill='rgba(255,255,255,0.84)'/>
    <rect x='208' y='154' width='88' height='74' rx='22' fill='rgba(255,107,44,0.28)'/>
    <text x='48' y='340' fill='white' font-family='Arial, sans-serif' font-size='40' font-weight='700'>${label}</text>
    <text x='48' y='382' fill='rgba(255,255,255,0.9)' font-family='Arial, sans-serif' font-size='22'>${category}</text>
  </svg>`.replace(/\s+/g, " ");
}
