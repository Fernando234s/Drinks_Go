const API = "http://localhost:3000";

async function login(){

const nome = document.getElementById("nome").value;
const telefone = document.getElementById("telefone").value;
const endereco = document.getElementById("endereco").value;

const resposta = await fetch(API + "/clientes", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
nome,
telefone,
endereco
})
});

const dados = await resposta.json();

localStorage.setItem("cliente", JSON.stringify(dados));

window.location.href = "produtos.html";

}