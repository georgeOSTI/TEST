document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");

  if (toggle && links) {
    var closeMenu = function () {
      links.classList.remove("open");
      toggle.classList.remove("active");
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("open");
      toggle.classList.toggle("active", isOpen);
      document.body.classList.toggle("nav-open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    links.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.body.addEventListener("click", function (e) {
      if (e.target === document.body && document.body.classList.contains("nav-open")) {
        closeMenu();
      }
    });
  }

  var form = document.querySelector(".quote-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form-status");
      if (status) {
        status.textContent =
          form.getAttribute("data-lang") === "es"
            ? "¡Gracias! Hemos recibido su solicitud y le contactaremos pronto."
            : "Thanks! Your request has been received — we'll be in touch shortly.";
        status.hidden = false;
      }
      form.reset();
      if (window.OAQuote) window.OAQuote.clearItems();
    });
  }
});

/* ---- Quote list (Add to Quote) ---- */
(function () {
  var STORAGE_KEY = "oa_quote_items";
  var lang = document.documentElement.lang === "es" ? "es" : "en";
  var contactUrl = lang === "es" ? "/es/contacto.html" : "/contact.html";
  var strings = {
    en: {
      add: "Add to Quote",
      added: "✓ Added — Remove",
      trayOne: "item selected",
      trayMany: "items selected",
      getQuote: "Get Quote",
      empty: "No items selected yet. Browse our services and click “Add to Quote” on anything you need.",
      remove: "Remove"
    },
    es: {
      add: "Agregar a Cotización",
      added: "✓ Agregado — Quitar",
      trayOne: "artículo seleccionado",
      trayMany: "artículos seleccionados",
      getQuote: "Cotizar",
      empty: "Aún no ha seleccionado artículos. Explore nuestros servicios y haga clic en “Agregar a Cotización”.",
      remove: "Quitar"
    }
  }[lang];

  function getItems() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  function hasItem(items, id) {
    return items.some(function (i) { return i.id === id; });
  }
  function addItem(item) {
    var items = getItems();
    if (!hasItem(items, item.id)) {
      items.push(item);
      saveItems(items);
    }
    renderAll();
  }
  function removeItem(id) {
    saveItems(getItems().filter(function (i) { return i.id !== id; }));
    renderAll();
  }
  function clearItems() {
    saveItems([]);
    renderAll();
  }

  var tray;
  function ensureTray() {
    if (tray) return tray;
    tray = document.createElement("a");
    tray.className = "quote-tray";
    tray.href = contactUrl;
    document.body.appendChild(tray);
    return tray;
  }
  function renderTray() {
    if (document.querySelector(".quote-list-box")) return;
    var items = getItems();
    var el = ensureTray();
    if (items.length === 0) {
      el.classList.remove("visible");
      return;
    }
    el.classList.add("visible");
    var label = items.length === 1 ? strings.trayOne : strings.trayMany;
    el.innerHTML =
      '<span class="quote-tray-count">' + items.length + "</span> " +
      label + ' <span class="quote-tray-cta">' + strings.getQuote + " →</span>";
  }

  function initCardButtons() {
    var buttons = document.querySelectorAll(".equip-card .btn-block");
    buttons.forEach(function (btn) {
      var card = btn.closest(".equip-card");
      var h3 = card && card.querySelector("h3");
      if (!h3) return;
      var priceEl = card.querySelector(".equip-price");
      var name = h3.textContent.trim();
      var price = priceEl ? priceEl.textContent.trim().replace(/\s+/g, " ") : "";
      var id = slugify(name);

      function refresh() {
        var active = hasItem(getItems(), id);
        btn.classList.toggle("is-added", active);
        btn.textContent = active ? strings.added : strings.add;
      }
      refresh();
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (hasItem(getItems(), id)) {
          removeItem(id);
        } else {
          addItem({ id: id, name: name, price: price });
        }
        refresh();
      });
    });
  }

  function initContactList() {
    var container = document.querySelector(".quote-list-box");
    if (!container) return;
    function render() {
      var items = getItems();
      var hiddenField = document.getElementById("selected-items-field");
      if (items.length === 0) {
        container.innerHTML = '<p class="quote-list-empty">' + strings.empty + "</p>";
        if (hiddenField) hiddenField.value = "";
        return;
      }
      var html = '<ul class="quote-list">';
      items.forEach(function (item) {
        html +=
          "<li><span>" + item.name +
          (item.price ? " <em>(" + item.price + ")</em>" : "") +
          '</span><button type="button" class="quote-list-remove" data-id="' + item.id +
          '" aria-label="' + strings.remove + '">×</button></li>';
      });
      html += "</ul>";
      container.innerHTML = html;
      container.querySelectorAll(".quote-list-remove").forEach(function (b) {
        b.addEventListener("click", function () {
          removeItem(b.getAttribute("data-id"));
          render();
        });
      });
      if (hiddenField) {
        hiddenField.value = items
          .map(function (i) { return i.name + (i.price ? " (" + i.price + ")" : ""); })
          .join(", ");
      }
    }
    render();
    window._renderQuoteContactList = render;
  }

  function renderAll() {
    renderTray();
    if (window._renderQuoteContactList) window._renderQuoteContactList();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initCardButtons();
    initContactList();
    renderTray();
  });

  window.OAQuote = { clearItems: clearItems };
})();
