/**
 * NexusTech E-Commerce - Script Principal (ES6+)
 * Gerencia: Roteamento SPA, Carrossel Hero, Catálogo/Ofertas, Carrinho, Formulários e Modais.
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ========================================================================
     1. ESTADO DA APLICAÇÃO & FORMATAÇÃO
     ======================================================================== */
  const state = {
    cart: [],
    currentSlide: 0,
    slideInterval: null,
    activeFilter: 'all',
  };

  const formatBRL = (value) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const showToast = (message) => {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
  };

  /* ========================================================================
     2. ROTEAMENTO SPA & MENU ANIMADO
     ======================================================================== */
  const views = document.querySelectorAll('.view');
  const navLinks = document.querySelectorAll('.nav__link');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mainNav = document.getElementById('mainNav');

  const navigateTo = (routeName, options = {}) => {
    const targetView = document.getElementById(`view-${routeName}`);
    if (!targetView) return;

    // Alterna visibilidade das views
    views.forEach((view) => view.classList.remove('active'));
    targetView.classList.add('active');

    // Atualiza link ativo no menu
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.dataset.route === routeName);
    });

    // Fecha menu mobile se estiver aberto
    mainNav.classList.remove('is-open');
    hamburgerBtn.classList.remove('is-active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');

    // Aplica filtro pré-selecionado caso venha de um link de categoria
    if (routeName === 'produtos' && options.filter) {
      applyCatalogFilter(options.filter);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delegação de eventos para todos os links com data-route ou data-scroll
  document.addEventListener('click', (e) => {
    const routeEl = e.target.closest('[data-route]');
    if (routeEl) {
      e.preventDefault();
      const route = routeEl.dataset.route;
      const filter = routeEl.dataset.filter || null;
      navigateTo(route, { filter });
      return;
    }

    const scrollEl = e.target.closest('[data-scroll]');
    if (scrollEl) {
      e.preventDefault();
      const targetId = scrollEl.dataset.scroll;
      navigateTo('inicio');
      setTimeout(() => {
        const section = document.getElementById(targetId);
        if (section) {
          const offset = section.getBoundingClientRect().top + window.scrollY - 85;
          window.scrollTo({ top: offset, behavior: 'smooth' });
        }
      }, 60);
    }
  });

  // Toggle Menu Hambúrguer Mobile
  hamburgerBtn.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    hamburgerBtn.classList.toggle('is-active', isOpen);
    hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
  });

  /* ========================================================================
     3. CARROSSEL HERO ANIMADO
     ======================================================================== */
  const slides = document.querySelectorAll('.carousel__slide');
  const dots = document.querySelectorAll('.carousel__dot');
  const carouselEl = document.getElementById('heroCarousel');

  const goToSlide = (index) => {
    state.currentSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('active', i === state.currentSlide));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === state.currentSlide));
  };

  const startCarouselAutoplay = () => {
    stopCarouselAutoplay();
    state.slideInterval = setInterval(() => goToSlide(state.currentSlide + 1), 5500);
  };

  const stopCarouselAutoplay = () => {
    if (state.slideInterval) clearInterval(state.slideInterval);
  };

  document.getElementById('prevSlide').addEventListener('click', () => {
    goToSlide(state.currentSlide - 1);
    startCarouselAutoplay();
  });

  document.getElementById('nextSlide').addEventListener('click', () => {
    goToSlide(state.currentSlide + 1);
    startCarouselAutoplay();
  });

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      goToSlide(Number(dot.dataset.slide));
      startCarouselAutoplay();
    });
  });

  carouselEl.addEventListener('mouseenter', stopCarouselAutoplay);
  carouselEl.addEventListener('mouseleave', startCarouselAutoplay);
  startCarouselAutoplay();

  /* ========================================================================
     4. CATÁLOGO & OFERTAS (ESPELHANDO OS CARDS DO INDEX.HTML)
     ======================================================================== */
  const catalogGrid = document.getElementById('catalogGrid');
  const offersGrid = document.getElementById('offersGrid');
  const catalogSearch = document.getElementById('catalogSearch');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Clona os cards originais das 3 seções da Home para manter as tags <img> do index.html
  const baseProductCards = Array.from(document.querySelectorAll('#view-inicio .product-card'));

  const populateCatalogAndOffers = () => {
    baseProductCards.forEach((card) => {
      catalogGrid.appendChild(card.cloneNode(true));
      if (card.dataset.offer === 'true') {
        offersGrid.appendChild(card.cloneNode(true));
      }
    });
  };

  const applyCatalogFilter = (category) => {
    state.activeFilter = category;
    filterBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.filter === category));
    filterCatalogItems();
  };

  const filterCatalogItems = () => {
    const query = catalogSearch.value.trim().toLowerCase();
    const cards = catalogGrid.querySelectorAll('.product-card');

    cards.forEach((card) => {
      const matchesCat = state.activeFilter === 'all' || card.dataset.category === state.activeFilter;
      const text = card.textContent.toLowerCase();
      const matchesSearch = text.includes(query);
      card.style.display = matchesCat && matchesSearch ? 'flex' : 'none';
    });
  };

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => applyCatalogFilter(btn.dataset.filter));
  });

  catalogSearch.addEventListener('input', filterCatalogItems);
  populateCatalogAndOffers();

  /* ========================================================================
     5. CARRINHO DE COMPRAS INTERATIVO
     ======================================================================== */
  const cartDrawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('overlay');
  const cartBadge = document.getElementById('cartBadge');
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const checkoutMsg = document.getElementById('checkoutMsg');

  const openCart = () => {
    cartDrawer.classList.add('active');
    cartDrawer.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');
  };

  const closeAllOverlays = () => {
    cartDrawer.classList.remove('active');
    cartDrawer.setAttribute('aria-hidden', 'true');
    infoModal.classList.remove('active');
    infoModal.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('active');
  };

  document.getElementById('openCartBtn').addEventListener('click', openCart);
  document.getElementById('closeCartBtn').addEventListener('click', closeAllOverlays);
  overlay.addEventListener('click', closeAllOverlays);

  const renderCart = () => {
    const totalQty = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    cartBadge.textContent = totalQty;
    cartBadge.classList.remove('bump');
    void cartBadge.offsetWidth; // Reinicia animação CSS
    cartBadge.classList.add('bump');

    cartSubtotal.textContent = formatBRL(totalPrice);

    if (state.cart.length === 0) {
      cartItemsContainer.innerHTML = '<p class="cart-empty-msg">Seu carrinho está vazio no momento.</p>';
      return;
    }

    cartItemsContainer.innerHTML = state.cart
      .map(
        (item) => `
        <div class="cart-item" data-id="${item.id}">
          <img src="${item.imgSrc}" alt="${item.title}" class="cart-item__img" />
          <div class="cart-item__info">
            <h4 class="cart-item__title">${item.title}</h4>
            <span class="cart-item__price">${formatBRL(item.price)}</span>
            <div class="cart-item__controls">
              <button class="qty-btn" data-action="dec" aria-label="Diminuir quantidade">-</button>
              <span>${item.qty}</span>
              <button class="qty-btn" data-action="inc" aria-label="Aumentar quantidade">+</button>
              <button class="remove-item-btn" data-action="remove">Remover</button>
            </div>
          </div>
        </div>
      `
      )
      .join('');
  };

  // Adicionar produto ao carrinho a partir de qualquer card (Home, Catálogo ou Ofertas)
  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-to-cart-btn');
    if (!addBtn) return;

    const card = addBtn.closest('.product-card');
    const id = card.dataset.id;
    const title = card.querySelector('.product-card__title').textContent;
    const price = parseFloat(card.querySelector('.product-card__price').dataset.price);
    const imgSrc = card.querySelector('.product-card__img').src;

    const existing = state.cart.find((item) => item.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      state.cart.push({ id, title, price, imgSrc, qty: 1 });
    }

    // Animação visual de confirmação no botão
    const originalText = addBtn.textContent;
    addBtn.textContent = '✓ Adicionado!';
    addBtn.classList.add('added');
    setTimeout(() => {
      addBtn.textContent = originalText;
      addBtn.classList.remove('added');
    }, 1100);

    checkoutMsg.textContent = '';
    renderCart();
    showToast(`"${title}" adicionado ao carrinho!`);
  });

  // Controles de quantidade e remoção dentro do carrinho
  cartItemsContainer.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) return;

    const itemEl = actionBtn.closest('.cart-item');
    const id = itemEl.dataset.id;
    const action = actionBtn.dataset.action;
    const itemIndex = state.cart.findIndex((i) => i.id === id);

    if (itemIndex === -1) return;

    if (action === 'inc') {
      state.cart[itemIndex].qty += 1;
    } else if (action === 'dec') {
      state.cart[itemIndex].qty -= 1;
      if (state.cart[itemIndex].qty <= 0) state.cart.splice(itemIndex, 1);
    } else if (action === 'remove') {
      state.cart.splice(itemIndex, 1);
    }

    renderCart();
  });

  document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (state.cart.length === 0) {
      showToast('Adicione produtos antes de finalizar a compra.');
      return;
    }
    state.cart = [];
    renderCart();
    checkoutMsg.textContent = 'Pedido simulado com sucesso! Obrigado por comprar na NexusTech.';
  });

  /* ========================================================================
     6. FORMULÁRIO DE CONTATO & NEWSLETTER (VALIDAÇÃO)
     ======================================================================== */
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const contactForm = document.getElementById('contactForm');
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;

    const name = document.getElementById('contactName');
    const email = document.getElementById('contactEmail');
    const subject = document.getElementById('contactSubject');
    const message = document.getElementById('contactMessage');
    const feedback = document.getElementById('contactFeedback');

    document.getElementById('errorName').textContent = '';
    document.getElementById('errorEmail').textContent = '';
    document.getElementById('errorSubject').textContent = '';
    document.getElementById('errorMessage').textContent = '';
    feedback.textContent = '';

    if (name.value.trim().length < 3) {
      document.getElementById('errorName').textContent = 'Informe seu nome completo (mínimo 3 caracteres).';
      isValid = false;
    }

    if (!isValidEmail(email.value.trim())) {
      document.getElementById('errorEmail').textContent = 'Informe um endereço de e-mail válido.';
      isValid = false;
    }

    if (!subject.value) {
      document.getElementById('errorSubject').textContent = 'Selecione o assunto do atendimento.';
      isValid = false;
    }

    if (message.value.trim().length < 10) {
      document.getElementById('errorMessage').textContent = 'Escreva uma mensagem com pelo menos 10 caracteres.';
      isValid = false;
    }

    if (isValid) {
      feedback.textContent = 'Mensagem enviada com sucesso! Nossa equipe responderá em até 2 horas úteis.';
      feedback.className = 'form-feedback success';
      contactForm.reset();
      showToast('Solicitação de contato enviada!');
    }
  });

  const newsletterForm = document.getElementById('newsletterForm');
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('newsletterEmail');
    const feedback = document.getElementById('newsletterFeedback');

    if (!isValidEmail(emailInput.value.trim())) {
      feedback.textContent = 'Digite um e-mail válido.';
      feedback.style.color = 'var(--danger)';
      return;
    }

    feedback.textContent = 'Inscrito com sucesso! Use o cupom NEXUS10 na primeira compra.';
    feedback.style.color = 'var(--success)';
    newsletterForm.reset();
  });

  /* ========================================================================
     7. MODAIS INSTITUCIONAIS DO FOOTER
     ======================================================================== */
  const infoModal = document.getElementById('infoModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  const modalContents = {
    'modal-privacidade': {
      title: 'Política de Privacidade (LGPD)',
      html: `
        <p>A <strong>NexusTech</strong> respeita integralmente a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Seus dados cadastrais são utilizados exclusivamente para processamento de pedidos, emissão de nota fiscal e comunicação autorizada.</p>
        <p>Não comercializamos informações pessoais com terceiros e utilizamos criptografia TLS de ponta a ponta em toda navegação.</p>
      `,
    },
    'modal-termos': {
      title: 'Termos de Uso',
      html: `
        <p>Ao navegar e realizar pedidos na plataforma NexusTech, o usuário concorda com nossas condições comerciais, prazos de envio e políticas de garantia.</p>
        <p>As imagens dos produtos são ilustrativas e as especificações técnicas seguem rigorosamente os manuais oficiais dos fabricantes.</p>
      `,
    },
    'modal-trocas': {
      title: 'Trocas, Devoluções e Garantia',
      html: `
        <p><strong>Direito de Arrependimento:</strong> Você tem até 7 dias corridos após o recebimento para solicitar devolução integral, desde que o produto esteja lacrado ou sem sinais de mau uso e com embalagem original.</p>
        <p><strong>Garantia Técnica:</strong> Todos os itens possuem garantia legal de 90 dias acrescida da garantia contratual do fabricante (12 a 36 meses conforme o componente).</p>
      `,
    },
    'modal-rastreio': {
      title: 'Rastrear Pedido',
      html: `
        <p>Digite o código do seu pedido (ex: <strong>NX-2026</strong>) para consultar o status logístico em tempo real:</p>
        <form id="trackingForm" style="display:flex; gap:0.5rem; margin-bottom:1rem;">
          <input type="text" id="trackingCode" class="form-input" placeholder="Ex: NX-2026" required />
          <button type="submit" class="btn btn--primary">Consultar</button>
        </form>
        <div id="trackingResult" style="color: var(--accent-primary); font-weight:600;"></div>
      `,
    },
    'modal-social': {
      title: 'Comunidade Oficial NexusTech',
      html: `
        <p>Acompanhe nossos benchmarks, reviews de hardware, lives de montagem de PCs e sorteios semanais nos canais oficiais <strong>@NexusTechBR</strong>.</p>
      `,
    },
  };

  document.addEventListener('click', (e) => {
    const modalTrigger = e.target.closest('[data-modal]');
    if (!modalTrigger) return;

    e.preventDefault();
    const key = modalTrigger.dataset.modal;
    const data = modalContents[key];
    if (!data) return;

    modalTitle.textContent = data.title;
    modalBody.innerHTML = data.html;
    infoModal.classList.add('active');
    infoModal.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');

    // Handler interno se for o modal de rastreio
    const trackingForm = document.getElementById('trackingForm');
    if (trackingForm) {
      trackingForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const code = document.getElementById('trackingCode').value.trim().toUpperCase();
        const resultEl = document.getElementById('trackingResult');
        resultEl.textContent = `Pedido ${code}: Objeto em trânsito — Saiu do Centro de Distribuição SP rumo ao destino.`;
      });
    }
  });

  document.getElementById('closeModalBtn').addEventListener('click', closeAllOverlays);

  // Fechar modais/carrinho com a tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllOverlays();
  });
});