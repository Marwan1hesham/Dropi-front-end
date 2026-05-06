const container = document.getElementById("catContainer");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

const card = document.querySelector(".category");
const scrollStep = card ? card.offsetWidth + 16 : 200;

rightBtn.onclick = () => {
  container.scrollBy({
    left: scrollStep,
    behavior: "smooth",
  });
};

leftBtn.onclick = () => {
  container.scrollBy({
    left: -scrollStep,
    behavior: "smooth",
  });
};

function updateArrows() {
  const maxScrollLeft = container.scrollWidth - container.clientWidth;

  // LEFT arrow
  if (container.scrollLeft <= 0) {
    leftBtn.style.opacity = "0";
    leftBtn.style.pointerEvents = "none";
  } else {
    leftBtn.style.opacity = "1";
    leftBtn.style.pointerEvents = "auto";
  }

  // RIGHT arrow
  if (container.scrollLeft >= maxScrollLeft - 1) {
    rightBtn.style.opacity = "0";
    rightBtn.style.pointerEvents = "none";
  } else {
    rightBtn.style.opacity = "1";
    rightBtn.style.pointerEvents = "auto";
  }
}

container.addEventListener("scroll", updateArrows);
window.addEventListener("resize", updateArrows);

updateArrows();