/* =============================================================
   Emporium — vanilla JavaScript (no jQuery)
   One function per feature · guard clauses · IntersectionObserver
   ============================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var money = function (n) { return "$" + n.toFixed(2); };

  /* ---------- Sticky header shadow ---------- */
  function initStickyHeader() {
    var header = document.getElementById("site-header");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  function initMobileMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var menu = document.getElementById("mobileMenu");
    if (!toggle || !menu) return;

    var open = function () {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add("is-open"); });
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("menu-open");
    };
    var close = function () {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
      window.setTimeout(function () { menu.hidden = true; }, 300);
    };

    toggle.addEventListener("click", function () {
      if (toggle.getAttribute("aria-expanded") === "true") close(); else open();
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") close();
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Product filtering ---------- */
  function initFilters() {
    var buttons = document.querySelectorAll(".filter");
    var cards = document.querySelectorAll("[data-products] .pcard");
    var empty = document.querySelector("[data-empty]");
    if (!buttons.length || !cards.length) return;

    function apply(cat) {
      var visible = 0;
      cards.forEach(function (card) {
        var match = cat === "all" || card.getAttribute("data-category") === cat;
        card.classList.toggle("is-hidden", !match);
        if (match) visible++;
      });
      if (empty) empty.hidden = visible !== 0;
      buttons.forEach(function (b) {
        var active = b.getAttribute("data-filter") === cat;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () { apply(btn.getAttribute("data-filter")); });
    });

    // Category deep-links (nav / footer / tiles)
    document.querySelectorAll("[data-filter-link]").forEach(function (link) {
      link.addEventListener("click", function () {
        var cat = link.getAttribute("data-filter-link");
        apply(cat);
      });
    });
  }

  /* ---------- Wishlist toggles ---------- */
  function initWishlist() {
    document.querySelectorAll(".pcard__wish, .pdp__wish").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var on = btn.getAttribute("aria-pressed") === "true";
        btn.setAttribute("aria-pressed", on ? "false" : "true");
        toast(on ? "Removed from wishlist" : "Added to wishlist");
      });
    });
  }

  /* ---------- Countdown ---------- */
  function initCountdown() {
    var root = document.querySelector("[data-countdown]");
    if (!root) return;
    var out = {
      hours: root.querySelector('[data-cd="hours"]'),
      minutes: root.querySelector('[data-cd="minutes"]'),
      seconds: root.querySelector('[data-cd="seconds"]')
    };
    // Deal ends at next local midnight
    function target() {
      var t = new Date();
      t.setHours(24, 0, 0, 0);
      return t;
    }
    var end = target();
    var pad = function (n) { return String(n).padStart(2, "0"); };

    function tick() {
      var diff = end - new Date();
      if (diff <= 0) { end = target(); diff = end - new Date(); }
      var h = Math.floor(diff / 3.6e6);
      var m = Math.floor((diff % 3.6e6) / 6e4);
      var s = Math.floor((diff % 6e4) / 1000);
      if (out.hours) out.hours.textContent = pad(h);
      if (out.minutes) out.minutes.textContent = pad(m);
      if (out.seconds) out.seconds.textContent = pad(s);
    }
    tick();
    window.setInterval(tick, 1000);
  }

  /* ---------- Best sellers scroller ---------- */
  function initScroller() {
    var scroller = document.querySelector("[data-scroller]");
    if (!scroller) return;
    document.querySelectorAll("[data-scroll]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var amount = Math.round(scroller.clientWidth * 0.8);
        scroller.scrollBy({
          left: btn.getAttribute("data-scroll") === "next" ? amount : -amount,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      });
    });
  }

  /* ---------- Cart ---------- */
  var Cart = (function () {
    var items = [];
    var FREE_SHIP = 49;

    var els = {};
    function q(sel) { return document.querySelector(sel); }

    function cache() {
      els.drawer = document.getElementById("cartDrawer");
      els.overlay = q("[data-cart-overlay]");
      els.list = q("[data-cart-items]");
      els.empty = q("[data-cart-empty]");
      els.foot = q("[data-cart-foot]");
      els.subtotal = q("[data-cart-subtotal]");
      els.shipMsg = q("[data-ship-msg]");
      els.shipBar = q("[data-ship-bar]");
      els.counts = document.querySelectorAll("[data-cart-count]");
      els.countText = q("[data-cart-count-text]");
    }

    function count() { return items.reduce(function (n, it) { return n + it.qty; }, 0); }
    function subtotal() { return items.reduce(function (s, it) { return s + it.price * it.qty; }, 0); }

    function render() {
      var n = count();
      els.counts.forEach(function (c) {
        c.textContent = n;
        if (n > 0) { c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); }
      });
      if (els.countText) els.countText.textContent = "(" + n + ")";

      var isEmpty = items.length === 0;
      if (els.empty) els.empty.style.display = isEmpty ? "" : "none";
      if (els.foot) els.foot.hidden = isEmpty;
      if (els.list) els.list.style.display = isEmpty ? "none" : "";

      if (els.list) {
        els.list.innerHTML = items.map(function (it) {
          return '<li class="citem">' +
            '<img class="citem__img" src="' + it.img + '" width="64" height="64" alt="" loading="lazy">' +
            '<div class="citem__mid">' +
              '<span class="citem__name">' + it.name + '</span>' +
              '<span class="citem__price">' + money(it.price) + ' each</span>' +
              '<div class="citem__ctrls">' +
                '<button type="button" class="citem__qtybtn" data-dec="' + it.id + '" aria-label="Decrease quantity of ' + it.name + '">−</button>' +
                '<span class="citem__qty">' + it.qty + '</span>' +
                '<button type="button" class="citem__qtybtn" data-inc="' + it.id + '" aria-label="Increase quantity of ' + it.name + '">+</button>' +
              '</div>' +
            '</div>' +
            '<div class="citem__right">' +
              '<span class="citem__line">' + money(it.price * it.qty) + '</span>' +
              '<button type="button" class="citem__remove" data-remove="' + it.id + '">Remove</button>' +
            '</div>' +
          '</li>';
        }).join("");
      }

      if (els.subtotal) els.subtotal.textContent = money(subtotal());

      // Free shipping progress
      var sub = subtotal();
      var pct = Math.min(100, Math.round((sub / FREE_SHIP) * 100));
      if (els.shipBar) els.shipBar.style.width = pct + "%";
      if (els.shipMsg) {
        if (sub >= FREE_SHIP) {
          els.shipMsg.innerHTML = "🎉 You've unlocked <strong>free shipping</strong>!";
          els.shipMsg.classList.add("is-free");
        } else {
          els.shipMsg.innerHTML = "Add <strong>" + money(FREE_SHIP - sub) + "</strong> more for free shipping";
          els.shipMsg.classList.remove("is-free");
        }
      }
    }

    function add(product, qty) {
      qty = qty || 1;
      var existing = items.filter(function (it) { return it.id === product.id; })[0];
      if (existing) existing.qty += qty;
      else items.push({ id: product.id, name: product.name, price: product.price, img: product.img, qty: qty });
      render();
      toast(product.name + " added to cart");
    }

    var lastFocus = null;
    function open() {
      if (!els.drawer) return;
      lastFocus = document.activeElement;
      els.overlay.hidden = false;
      requestAnimationFrame(function () {
        els.overlay.classList.add("is-open");
        els.drawer.classList.add("is-open");
      });
      els.drawer.setAttribute("aria-hidden", "false");
      document.body.classList.add("menu-open");
      var closeBtn = els.drawer.querySelector("[data-cart-close]");
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      if (!els.drawer) return;
      els.overlay.classList.remove("is-open");
      els.drawer.classList.remove("is-open");
      els.drawer.setAttribute("aria-hidden", "true");
      document.body.classList.remove("menu-open");
      window.setTimeout(function () { if (els.overlay) els.overlay.hidden = true; }, 320);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function trapFocus(e) {
      if (e.key !== "Tab" || !els.drawer.classList.contains("is-open")) return;
      var f = els.drawer.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
      f = Array.prototype.filter.call(f, function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function init() {
      cache();
      if (!els.drawer) return;

      document.querySelectorAll("[data-cart-open]").forEach(function (b) {
        b.addEventListener("click", open);
      });
      document.querySelectorAll("[data-cart-close]").forEach(function (b) {
        b.addEventListener("click", close);
      });
      if (els.overlay) els.overlay.addEventListener("click", close);

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && els.drawer.classList.contains("is-open")) close();
        trapFocus(e);
      });

      // Add-to-cart buttons
      document.querySelectorAll("[data-add-to-cart]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var qty = 1;
          if (btn.hasAttribute("data-qty-source")) {
            var qEl = document.querySelector("[data-qty]");
            if (qEl) qty = Math.max(1, parseInt(qEl.value, 10) || 1);
          }
          add({
            id: btn.getAttribute("data-id"),
            name: btn.getAttribute("data-name"),
            price: parseFloat(btn.getAttribute("data-price")),
            img: btn.getAttribute("data-img")
          }, qty);
          open();
        });
      });

      // Delegated qty / remove
      if (els.list) {
        els.list.addEventListener("click", function (e) {
          var inc = e.target.closest("[data-inc]");
          var dec = e.target.closest("[data-dec]");
          var rem = e.target.closest("[data-remove]");
          if (inc) changeQty(inc.getAttribute("data-inc"), 1);
          else if (dec) changeQty(dec.getAttribute("data-dec"), -1);
          else if (rem) remove(rem.getAttribute("data-remove"));
        });
      }

      render();
    }

    function changeQty(id, delta) {
      var it = items.filter(function (x) { return x.id === id; })[0];
      if (!it) return;
      it.qty += delta;
      if (it.qty < 1) { remove(id); return; }
      render();
    }
    function remove(id) {
      items = items.filter(function (x) { return x.id !== id; });
      render();
    }

    return { init: init, open: open };
  })();

  /* ---------- Toasts ---------- */
  var toastHost;
  function toast(msg) {
    if (!toastHost) toastHost = document.querySelector("[data-toasts]");
    if (!toastHost) return;
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = '<span class="toast__check" aria-hidden="true">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4 10-10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</span><span>' + msg + '</span>';
    toastHost.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("in"); });
    window.setTimeout(function () {
      el.classList.remove("in");
      window.setTimeout(function () { el.remove(); }, 300);
    }, 2600);
  }

  /* ---------- Quantity stepper (PDP) ---------- */
  function initStepper() {
    var stepper = document.querySelector("[data-stepper]");
    if (!stepper) return;
    var input = stepper.querySelector("[data-qty]");
    stepper.querySelectorAll("[data-step]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = Math.max(1, (parseInt(input.value, 10) || 1) + parseInt(btn.getAttribute("data-step"), 10));
        input.value = v;
      });
    });
    input.addEventListener("input", function () {
      var v = input.value.replace(/[^0-9]/g, "");
      input.value = v === "" ? "" : String(Math.max(1, parseInt(v, 10)));
    });
    input.addEventListener("blur", function () {
      if (!input.value || parseInt(input.value, 10) < 1) input.value = "1";
    });
  }

  /* ---------- Gallery thumbnail swap ---------- */
  function initGallery() {
    var main = document.querySelector("[data-main-image]");
    var thumbs = document.querySelectorAll("[data-thumb]");
    if (!main || !thumbs.length) return;
    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var full = thumb.getAttribute("data-full");
        if (full) main.src = full;
        thumbs.forEach(function (t) {
          t.classList.toggle("is-active", t === thumb);
          t.setAttribute("aria-selected", t === thumb ? "true" : "false");
        });
      });
    });
  }

  /* ---------- Variant selectors (PDP) ---------- */
  function initVariants() {
    document.querySelectorAll("[data-variant]").forEach(function (group) {
      var name = group.getAttribute("data-variant");
      var label = group.querySelector('[data-variant-value="' + name + '"]');
      var opts = group.querySelectorAll("[data-variant-opt]");
      opts.forEach(function (opt) {
        opt.addEventListener("click", function () {
          opts.forEach(function (o) { o.classList.remove("is-active"); o.setAttribute("aria-checked", "false"); });
          opt.classList.add("is-active");
          opt.setAttribute("aria-checked", "true");
          if (label) label.textContent = opt.getAttribute("data-variant-opt");
        });
      });
    });
  }

  /* ---------- Product tabs (keyboard accessible) ---------- */
  function initTabs() {
    var tablist = document.querySelector(".ptabs__nav");
    if (!tablist) return;
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll(".ptab"));

    function select(tab) {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
        t.setAttribute("tabindex", active ? "0" : "-1");
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) {
          panel.hidden = !active;
          panel.classList.toggle("is-active", active);
        }
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var idx = i;
        if (e.key === "ArrowRight") idx = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") idx = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") idx = 0;
        else if (e.key === "End") idx = tabs.length - 1;
        else return;
        e.preventDefault();
        tabs[idx].focus();
        select(tabs[idx]);
      });
    });
  }

  /* ---------- Lightbox (PDP) ---------- */
  function initLightbox() {
    var box = document.querySelector("[data-lightbox]");
    var openBtn = document.querySelector("[data-lightbox-open]");
    if (!box || !openBtn) return;
    var img = box.querySelector("[data-lightbox-img]");
    var closeBtn = box.querySelector("[data-lightbox-close]");
    var main = document.querySelector("[data-main-image]");
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      if (main && img) { img.src = main.src; img.alt = main.alt; }
      box.hidden = false;
      requestAnimationFrame(function () { box.classList.add("is-open"); });
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      box.classList.remove("is-open");
      window.setTimeout(function () { box.hidden = true; }, 250);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !box.hidden) close();
    });
  }

  /* ---------- Newsletter validation ---------- */
  function initNewsletter() {
    var form = document.querySelector("[data-newsletter]");
    if (!form) return;
    var input = form.querySelector('input[type="email"]');
    var msg = form.querySelector(".news__msg");
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = (input.value || "").trim();
      if (!re.test(val)) {
        input.classList.add("is-invalid");
        input.setAttribute("aria-invalid", "true");
        if (msg) { msg.textContent = "Please enter a valid email address."; msg.classList.add("is-error"); }
        input.focus();
        return;
      }
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
      if (msg) { msg.textContent = "Thanks! Your $10 code is on its way to your inbox."; msg.classList.remove("is-error"); }
      form.reset();
    });
  }

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initStickyHeader();
    initMobileMenu();
    initReveal();
    initFilters();
    initWishlist();
    initCountdown();
    initScroller();
    Cart.init();
    initStepper();
    initGallery();
    initVariants();
    initTabs();
    initLightbox();
    initNewsletter();
  });
})();
