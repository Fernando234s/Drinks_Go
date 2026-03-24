const USER_STORAGE_KEY = "user";
const ADMIN_STORAGE_KEY = "admin";

function getUserSession() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || null;
  } catch (error) {
    return null;
  }
}

function isAdminLogged() {
  return localStorage.getItem(ADMIN_STORAGE_KEY) === "true";
}

function redirectTo(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (location.pathname !== normalized) {
    location.href = normalized;
  }
}

function protegerRotas() {
  const modo = document.body.dataset.auth;

  if (modo === "user" && !getUserSession()) {
    redirectTo("login.html");
    return;
  }

  if (modo === "admin" && !isAdminLogged()) {
    redirectTo("admin-login.html");
    return;
  }

  if (modo === "guest-user" && getUserSession()) {
    redirectTo("index.html");
    return;
  }

  if (modo === "guest-admin" && isAdminLogged()) {
    redirectTo("admin.html");
  }
}

function preencherUsuario() {
  const user = getUserSession();
  document.querySelectorAll("[data-user-name]").forEach((elemento) => {
    elemento.textContent = user?.nome || "Usuario";
  });
}

function inicializarLoginGoogle() {
  document.querySelectorAll("[data-login-google]").forEach((botao) => {
    botao.addEventListener("click", () => {
      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify({
          nome: "Usuario",
          email: "usuario@email.com",
        })
      );
      redirectTo("index.html");
    });
  });
}

function inicializarLoginAdmin() {
  const form = document.getElementById("admin-login-form");
  const feedback = document.getElementById("admin-login-feedback");

  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const login = document.getElementById("admin-login")?.value.trim();
    const senha = document.getElementById("admin-senha")?.value.trim();

    if (login === "adm" && senha === "admin") {
      localStorage.setItem(ADMIN_STORAGE_KEY, "true");
      redirectTo("admin.html");
      return;
    }

    if (feedback) {
      feedback.textContent = "Credenciais invalidas";
      feedback.classList.remove("hidden");
      feedback.classList.add("error");
    }
  });
}

function inicializarLogout() {
  document.querySelectorAll("[data-logout-user]").forEach((botao) => {
    botao.addEventListener("click", () => {
      localStorage.removeItem(USER_STORAGE_KEY);
      redirectTo("login.html");
    });
  });

  document.querySelectorAll("[data-logout-admin]").forEach((botao) => {
    botao.addEventListener("click", () => {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      window.location.href = "/admin-login.html";
    });
  });
}

protegerRotas();
preencherUsuario();
inicializarLoginGoogle();
inicializarLoginAdmin();
inicializarLogout();
