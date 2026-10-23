(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "class") node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return node;
  }
  function svgUse(id, cls) {
    var ns = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(ns, "svg"); s.setAttribute("aria-hidden", "true"); if (cls) s.setAttribute("class", cls);
    var u = document.createElementNS(ns, "use"); u.setAttribute("href", "#" + id); s.appendChild(u);
    return s;
  }
  function img(src, alt) { return el("img", { src: src, alt: alt || "", loading: "lazy", decoding: "async" }); }

  /* Header: scrolled state, mobile menu, active link */
  var header = $(".site-header"), nav = $("#nav"), toggle = $(".menu-toggle");
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  function setMenu(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "סגירת תפריט" : "פתיחת תפריט");
  }
  toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); toggle.focus(); } });
  if ("IntersectionObserver" in window) {
    var links = $$("a", nav);
    $(".hero").id = "main-hero";
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id === "main-hero" ? "top" : en.target.id;
        links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["main-hero", "treatments", "about", "stories", "news", "contact"].forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* Photos */
  var photos = S.photos || {};
  $$("[data-photo]").forEach(function (n) { var src = photos[n.getAttribute("data-photo")]; if (src) n.style.backgroundImage = "url('" + src + "')"; });
  $$("[data-photo-img]").forEach(function (n) { var src = photos[n.getAttribute("data-photo-img")]; if (src) n.src = src; else n.parentNode.hidden = true; });

  /* Contact details */
  var contact = S.contact || {};
  var TBD = { phone: "[טלפון, להשלמה]", address: "[כתובת, להשלמה]", hours: "[שעות פעילות, להשלמה]" };
  ["phone", "address", "hours"].forEach(function (k) {
    $$("[data-field='" + k + "']").forEach(function (n) {
      n.textContent = "";
      if (!contact[k]) { n.textContent = TBD[k]; return; }
      if (k === "phone") {
        var tel = "tel:" + contact.phone.replace(/[^\d+]/g, "");
        if (n.tagName === "A") { n.href = tel; n.textContent = contact.phone; n.dir = "ltr"; }
        else n.appendChild(el("a", { href: tel, dir: "ltr", text: contact.phone }));
      } else if (k === "hours") {
        contact.hours.split(/(\d[\d:]*[–-]\d[\d:]*)/).forEach(function (part, i) {
          n.appendChild(i % 2 ? el("span", { dir: "ltr", text: part }) : document.createTextNode(part));
        });
      } else n.textContent = contact[k];
    });
  });
  if (contact.address) {
    var q = encodeURIComponent(contact.address);
    $("#waze-link").href = "https://waze.com/ul?q=" + q + "&navigate=yes";
    $("#maps-link").href = "https://www.google.com/maps/search/?api=1&query=" + q;
  } else { $("#waze-link").hidden = true; $("#maps-link").hidden = true; }
  var social = S.social || {};
  if (social.instagram) $("#ig-link").href = social.instagram;
  if (social.facebook) $("#fb-link").href = social.facebook; else $("#fb-link").hidden = true;

  /* Modals: native <dialog> gives focus trapping and Escape */
  var lastTrigger = null;
  function openDialog(dlg, trigger) {
    $$("dialog[open]").forEach(function (d) { if (d !== dlg) d.close(); });
    lastTrigger = trigger || document.activeElement;
    dlg.showModal();
    document.documentElement.style.overflow = "hidden";
    $(".modal-inner", dlg).scrollTop = 0;
  }
  $$("dialog.modal").forEach(function (dlg) {
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    $$("[data-close]", dlg).forEach(function (b) { b.addEventListener("click", function () { dlg.close(); }); });
    dlg.addEventListener("close", function () {
      var v = $("video", dlg); if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
      if ($("dialog[open]")) return;
      document.documentElement.style.overflow = "";
      if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
    });
  });

  /* Services */
  var list = $("#treatment-list"), tm = $("#treatment-modal");
  (S.treatments || []).forEach(function (t) {
    var btn = el("button", { class: "card", type: "button", "aria-haspopup": "dialog" }, [
      t.image ? el("span", { class: "card-img" }, [img(t.image, "")]) : null,
      el("span", { class: "card-body" }, [
        el("span", {}, [el("span", { class: "card-name", text: t.name }), el("span", { class: "card-short", text: t.short })]),
        el("span", { class: "card-arrow", "aria-hidden": "true" }, [svgUse("i-chev-l")])
      ])
    ]);
    btn.addEventListener("click", function () { openTreatment(t, btn); });
    list.appendChild(el("li", {}, [btn]));
  });
  function openTreatment(t, trigger) {
    $("#tm-title", tm).textContent = t.name;
    var tag = $("#tm-tagline"); tag.textContent = t.tagline || ""; tag.hidden = !t.tagline;
    var desc = $("#tm-desc"); desc.textContent = "";
    [].concat(t.desc || []).forEach(function (p) { desc.appendChild(el("p", { text: p })); });
    $("#tm-fit-title").textContent = t.fitTitle || "למי זה עשוי להתאים";
    var outro = $("#tm-outro"); outro.textContent = "";
    [].concat(t.outro || []).forEach(function (p) { outro.appendChild(el("p", { text: p })); });
    outro.hidden = !t.outro;
    $(".tm-note", tm).hidden = !!t.outro;
    $("#tm-form-title").textContent = t.formTitle || "רוצים לשמוע עוד?";
    var fit = $(".tm-fit", tm); fit.textContent = "";
    (t.fit || []).forEach(function (f) { fit.appendChild(el("li", { text: f })); });
    $(".modal-media", tm).hidden = !t.image;
    if (t.image) { $("#tm-img").src = t.image; $("#tm-img").alt = t.name; }
    var form = $("form", tm);
    resetForm(form);
    form.elements.treatment.value = t.name;
    openDialog(tm, trigger);
    $("#m-name", tm).focus({ preventScroll: true });
  }

  /* About */
  var about = S.about || {};
  $("#about-short").textContent = about.short || "";
  var am = $("#about-modal"), amText = $(".am-text", am);
  [about.short].concat(about.more || []).forEach(function (p) { if (p) amText.appendChild(el("p", { text: p })); });
  $("#about-more").addEventListener("click", function (e) { openDialog(am, e.currentTarget); });

  /* Video player (hero video and patient stories) */
  var vm = $("#video-modal"), player = $("#video-player"), vEmpty = $("#video-empty");
  function playVideo(src, poster, trigger) {
    player.hidden = !src; vEmpty.hidden = !!src;
    if (src) {
      player.src = src;
      if (poster) player.poster = poster; else player.removeAttribute("poster");
    } else {
      $("#video-poster").src = poster || "";
      $("#video-poster").hidden = !poster;
    }
    openDialog(vm, trigger);
    if (src) { var p = player.play(); if (p && p.catch) p.catch(function () {}); }
  }
  $("#hero-video-btn").addEventListener("click", function (e) {
    if (S.heroVideo) playVideo(S.heroVideo, photos.hero, e.currentTarget);
    else document.getElementById("stories").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });

  /* Patient stories carousel */
  var rail = $("#story-rail");
  (S.stories || []).forEach(function (s, i) {
    if (s.facebook) {
      var src = "https://www.facebook.com/plugins/video.php?href=" + encodeURIComponent(s.facebook) + "&show_text=false&width=320&t=0";
      rail.appendChild(el("div", { class: "story story-fb" }, [
        S.previewMode
          ? el("a", { class: "story-fb-link", href: s.facebook, target: "_blank", rel: "noopener" }, [
              el("span", { class: "story-play", "aria-hidden": "true" }), el("span", { text: "צפייה בסרטון בפייסבוק" })
            ])
          : el("iframe", {
              src: src, title: "סרטון מטופל " + (i + 1), loading: "lazy", scrolling: "no", allowfullscreen: "true",
              allow: "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            })
      ]));
      return;
    }
    var b = el("button", { class: "story", type: "button", "aria-label": "סרטון מטופל " + (i + 1) + (s.quote ? ": " + s.quote : "") }, [
      el("span", { class: "story-img" }, [s.poster ? img(s.poster, "") : null, el("span", { class: "story-play", "aria-hidden": "true" })]),
      s.quote ? el("span", { class: "story-quote", text: "״" + s.quote + "״" }) : null
    ]);
    b.addEventListener("click", function () { playVideo(s.video, s.poster, b); });
    rail.appendChild(b);
  });
  var prev = $(".car-prev"), next = $(".car-next");
  function step() { var c = $(".story", rail); return c ? c.getBoundingClientRect().width + 24 : 200; }
  function updateArrows() {
    var max = rail.scrollWidth - rail.clientWidth - 2;
    var pos = Math.abs(rail.scrollLeft); // in RTL scrollLeft runs from 0 toward negative values
    prev.disabled = pos <= 2; next.disabled = pos >= max;
  }
  $$(".car-btn").forEach(function (b) {
    b.addEventListener("click", function () { rail.scrollBy({ left: -Number(b.getAttribute("data-dir")) * step(), behavior: "smooth" }); });
  });
  rail.addEventListener("scroll", updateArrows, { passive: true });
  window.addEventListener("resize", updateArrows);
  updateArrows();

  /* What's new: Instagram's own profile embed (no account or API key), or a static grid */
  var feed = $("#insta-feed"), ig = S.instagram || {};
  if (ig.mode === "embed" && ig.username) {
    feed.appendChild(el("div", { class: "ig-embed" }, [
      el("iframe", {
        src: "https://www.instagram.com/" + encodeURIComponent(ig.username) + "/embed/",
        title: "הפוסטים האחרונים באינסטגרם של המרפאה", loading: "lazy", allowtransparency: "true", scrolling: "auto"
      })
    ]));
  } else {
    var ul = el("ul", { class: "posts" });
    (ig.fallback || []).forEach(function (p) {
      ul.appendChild(el("li", { class: "post" }, [
        el("a", { href: p.url || social.instagram || "#", target: "_blank", rel: "noopener" }, [
          el("span", { class: "post-img" }, [img(p.image, p.caption)]),
          el("span", { class: "post-cap", text: "💙 " + p.caption })
        ])
      ]));
    });
    feed.appendChild(ul);
  }

  /* Forms: validation, honeypot, submit */
  var PHONE_RE = /^(?:\+?972|0)(?:[23489]|5\d|7\d)\d{7}$/;
  function setErr(form, name, msg) {
    var input = form.elements[name], err = document.getElementById(input.id + "-err");
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (msg) input.setAttribute("aria-describedby", err.id); else input.removeAttribute("aria-describedby");
    err.textContent = msg || "";
  }
  function resetForm(form) {
    form.reset();
    ["name", "phone"].forEach(function (n) { setErr(form, n, ""); });
    var st = $(".status", form); st.textContent = ""; st.className = "status";
    $("button[type=submit]", form).disabled = false;
    form._opened = Date.now();
  }
  function validate(form) {
    var ok = true;
    var name = form.elements.name.value.trim(), phone = form.elements.phone.value.replace(/[\s\-()]/g, "");
    if (name.length < 2) { setErr(form, "name", "נא למלא שם מלא."); ok = false; } else setErr(form, "name", "");
    if (!PHONE_RE.test(phone)) { setErr(form, "phone", "נא להזין מספר טלפון ישראלי תקין, למשל 050-1234567."); ok = false; } else setErr(form, "phone", "");
    if (!ok) { var first = $("[aria-invalid=true]", form); if (first) first.focus(); }
    return ok;
  }
  $$("[data-lead-form]").forEach(function (form) {
    form._opened = Date.now();
    ["name", "phone"].forEach(function (n) {
      form.elements[n].addEventListener("blur", function () { if (form.elements[n].getAttribute("aria-invalid") === "true") validate(form); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var st = $(".status", form);
      if (!validate(form)) return;
      // Spam guard: hidden field filled, or submitted too fast for a person
      if (form.elements.company.value || Date.now() - form._opened < 1500) { st.className = "status ok"; st.textContent = "תודה, הפרטים התקבלו."; return; }
      var data = {
        name: form.elements.name.value.trim(), phone: form.elements.phone.value.trim(),
        message: form.elements.message.value.trim(), treatment: form.elements.treatment.value, page: location.pathname
      };
      var btn = $("button[type=submit]", form);
      btn.disabled = true; st.className = "status"; st.textContent = "שולח…";
      var done = function () {
        st.className = "status ok";
        st.textContent = "תודה, " + data.name.split(" ")[0] + ". הפרטים התקבלו ונציג המרפאה יחזור אליך טלפונית בימים הקרובים.";
        form.elements.name.value = ""; form.elements.phone.value = ""; form.elements.message.value = "";
        btn.disabled = false;
      };
      var fail = function () { st.className = "status bad"; st.textContent = "השליחה לא הצליחה. נסו שוב בעוד רגע או התקשרו אלינו."; btn.disabled = false; };
      if (!S.formEndpoint) {
        setTimeout(function () { done(); st.textContent += " (תצוגה מקדימה: הטופס עדיין לא מחובר, ולכן הפרטים לא נשלחו.)"; }, 400);
        return;
      }
      fetch(S.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { if (r.ok) done(); else fail(); }).catch(fail);
    });
  });

  /* Booking buttons open the booking form */
  var bm = $("#book-modal");
  $$("[data-book]").forEach(function (b) {
    b.addEventListener("click", function () { resetForm($("form", bm)); openDialog(bm, b); $("#b-name").focus({ preventScroll: true }); });
  });

  /* Gentle reveal for content below the first screen */
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.remove("pre"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".section-head, .cards, .about-row, #insta-feed, .carousel, .booking-box").forEach(function (t) {
      if (t.getBoundingClientRect().top > window.innerHeight) { t.classList.add("reveal", "pre"); io.observe(t); }
    });
  }

  $("#year").textContent = new Date().getFullYear();
})();
