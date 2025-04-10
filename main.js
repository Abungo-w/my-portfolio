
console.log("Enhanced UI loaded");

// Optional scroll effect for nav links
const links = document.querySelectorAll("nav ul li a");
links.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    target.scrollIntoView({ behavior: "smooth" });
  });
});
