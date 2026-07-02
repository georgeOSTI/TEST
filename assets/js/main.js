document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("open");
      document.body.classList.toggle("nav-open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    links.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        links.classList.remove("open");
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
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
    });
  }
});
