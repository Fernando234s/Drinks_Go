const API = "http://localhost:3000";

const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
const cliente = JSON.parse(localStorage.getItem("cliente"));

const lista = document.getElementById("listaCarrinho");

carrinho.forEach(item => {

const div = document.createElement("div");

div.innerHTML = `
<h3>${item.nome}</h3>
<p>Preço: R$ ${item.preco}</p>
`;

lista.appendChild(div);

});

async function finalizarPedido(){

const pedido = {
id_cliente: cliente.id_cliente,
itens: carrinho
};

const resposta = await fetch(API + "/pedidos", {

method: "POST",
headers:{
"Content-Type":"application/json"
},
body: JSON.stringify(pedido)

});

alert("Pedido realizado!");

localStorage.removeItem("carrinho");

window.location.href = "produtos.html";

}