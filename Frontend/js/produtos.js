const API = "http://localhost:3000";

let carrinho = [];

async function carregarProdutos(){

const resposta = await fetch(API + "/bebidas");
const produtos = await resposta.json();

const lista = document.getElementById("listaProdutos");

produtos.forEach(produto => {

const div = document.createElement("div");

div.innerHTML = `
<h3>${produto.nome}</h3>
<p>Tipo: ${produto.tipo}</p>
<p>Preço: R$ ${produto.preco}</p>
<button onclick="adicionarCarrinho(${produto.id_produto}, '${produto.nome}', ${produto.preco})">
Adicionar
</button>
`;

lista.appendChild(div);

});

}

function adicionarCarrinho(id, nome, preco){

carrinho.push({
id,
nome,
preco,
quantidade:1
});

localStorage.setItem("carrinho", JSON.stringify(carrinho));

alert("Produto adicionado!");

}

carregarProdutos();