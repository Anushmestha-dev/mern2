const form = document.getElementById("authForm");
const message = document.getElementById("message");
const mode = form.dataset.mode; // "signup" or "login"

// already logged in? go straight to items
if (localStorage.getItem("token")) window.location.href = "items.html";

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  message.textContent = "";

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`/api/${mode}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();

  if (!res.ok) {
    message.textContent = data.error;
    return;
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("email", data.email);
  window.location.href = "items.html";
});
