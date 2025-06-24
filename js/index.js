document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.querySelector(".dropdown-toggle");
  const menu = document.querySelector(".dropdown-menu");

  if (toggle && menu) {
    toggle.addEventListener("click", function (e) {
      e.stopPropagation(); // impede o fechamento imediato ao clicar
      menu.classList.toggle("show");
    });

    // Fecha o dropdown se clicar fora
    document.addEventListener("click", function (event) {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) {
        menu.classList.remove("show");
      }
    });
  }
});
