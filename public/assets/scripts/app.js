// =====================================================
// script.js — Home Page (index.html)
// Busca produtos do JSON Server via Fetch API
// =====================================================

const API_URL = "http://localhost:3000";

// --------------------------------------------------
// Utilitários
// --------------------------------------------------

function formatarPreco(preco) {
  return preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function renderEstrelas(avaliacao) {
  const cheias = Math.floor(avaliacao);
  const meia   = avaliacao % 1 >= 0.5 ? 1 : 0;
  const vazias  = 5 - cheias - meia;
  return "★".repeat(cheias) + (meia ? "½" : "") + "☆".repeat(vazias);
}

// --------------------------------------------------
// 1. Fetch — busca todos os produtos
// --------------------------------------------------

async function fetchProdutos() {
  const response = await fetch(`${API_URL}/produtos`);
  if (!response.ok) throw new Error(`Erro ao buscar produtos: ${response.status}`);
  return response.json();
}

async function fetchCategorias() {
  const response = await fetch(`${API_URL}/categorias`);
  if (!response.ok) throw new Error(`Erro ao buscar categorias: ${response.status}`);
  return response.json();
}

// --------------------------------------------------
// 2. Cria um card de produto
// --------------------------------------------------

function createCard(produto) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.setAttribute("data-id", produto.id);

  card.innerHTML = `
    <div class="card-emoji">${produto.imagem}</div>
    <div class="card-body">
      <span class="card-categoria">${produto.categoria}</span>
      <strong class="card-nome">${produto.nome}</strong>
      <div class="card-avaliacao" title="${produto.avaliacao}/5">
        ${renderEstrelas(produto.avaliacao)}
        <span class="nota">${produto.avaliacao}</span>
      </div>
      <p class="card-preco">${formatarPreco(produto.preco)}</p>
      <p class="card-estoque ${produto.emEstoque ? "ok" : "esgotado"}">
        ${produto.emEstoque ? "✔ Em estoque" : "✘ Esgotado"}
      </p>
    </div>
    <div class="card-footer">
      <a class="btn-detalhes" href="detalhes.html?id=${produto.id}">Ver detalhes</a>
      <button class="btn-destacar" title="Destacar">⭐</button>
    </div>
  `;

  card.querySelector(".btn-destacar").addEventListener("click", () => {
    card.classList.toggle("destaque");
  });

  return card;
}

// --------------------------------------------------
// 3. Renderiza lista de cards
// --------------------------------------------------

function renderCards(produtos) {
  const listaEl = document.getElementById("product-list");
  listaEl.innerHTML = "";

  if (produtos.length === 0) {
    listaEl.innerHTML = `<p class="sem-resultado">Nenhum produto encontrado.</p>`;
    return;
  }

  produtos.forEach((produto, i) => {
    const card = createCard(produto);
    card.style.animationDelay = `${i * 60}ms`;
    listaEl.appendChild(card);
  });
}

// --------------------------------------------------
// 4. Exibe estado de loading / erro
// --------------------------------------------------

function showLoading(listaEl) {
  listaEl.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Carregando produtos...</p>
    </div>
  `;
}

function showError(listaEl, mensagem) {
  listaEl.innerHTML = `
    <div class="erro">
      <p>⚠️ ${mensagem}</p>
      <p class="erro-dica">Verifique se o JSON Server está rodando: <code>npx json-server db.json</code></p>
    </div>
  `;
}

// --------------------------------------------------
// 5. Inicializa a Home Page
// --------------------------------------------------

async function init() {
  const listaEl         = document.getElementById("product-list");
  const searchInput     = document.getElementById("search");
  const categorySelect  = document.getElementById("category");
  const btnRender       = document.getElementById("btnRender");

  if (!listaEl) return; // não está na home

  showLoading(listaEl);

  let todosOsProdutos = [];

  try {
    // Busca em paralelo para economizar tempo
    const [produtos, categorias] = await Promise.all([
      fetchProdutos(),
      fetchCategorias()
    ]);

    todosOsProdutos = produtos;

    // Preenche o <select> de categorias vindas da API
    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat.nome;
      option.textContent = `${cat.icone} ${cat.nome}`;
      categorySelect.appendChild(option);
    });

    renderCards(todosOsProdutos);

  } catch (err) {
    console.error(err);
    showError(listaEl, "Não foi possível conectar ao servidor.");
    return;
  }

  // ------ Filtros ------

  function filtrarProdutos() {
    const texto = searchInput.value.toLowerCase().trim();
    const cat   = categorySelect.value;

    return todosOsProdutos.filter(p =>
      p.nome.toLowerCase().includes(texto) &&
      (cat === "" || p.categoria === cat)
    );
  }

  searchInput.addEventListener("input",    () => renderCards(filtrarProdutos()));
  categorySelect.addEventListener("change", () => renderCards(filtrarProdutos()));

  btnRender.addEventListener("click", () => {
    searchInput.value    = "";
    categorySelect.value = "";
    renderCards(todosOsProdutos);
  });
}

// --------------------------------------------------
// Ponto de entrada
// --------------------------------------------------
document.addEventListener("DOMContentLoaded", init);