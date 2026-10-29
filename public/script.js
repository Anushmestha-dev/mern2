const API = "/api/users";

const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const title = document.getElementById("title");
const list = document.getElementById("userList");
const message = document.getElementById("message");

let editingId = null; // null = signing up, number = editing

function showMessage(text, ok = false) {
  message.textContent = text;
  message.className = ok ? "message ok" : "message";
}

// READ
async function loadUsers() {
  const res = await fetch(API);
  renderUsers(await res.json());
}

function renderUsers(users) {
  list.innerHTML = "";
  if (users.length === 0) {
    list.innerHTML = '<li class="empty">No users yet</li>';
    return;
  }
  users.forEach((user) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = user.email;

    const actions = document.createElement("div");
    actions.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => startEdit(user);

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "delete";
    delBtn.onclick = () => deleteUser(user.id);

    actions.append(editBtn, delBtn);
    li.append(span, actions);
    list.appendChild(li);
  });
}

// CREATE or UPDATE
async function saveUser() {
  const body = { email: emailInput.value, password: passInput.value };
  const url = editingId ? `${API}/${editingId}` : API;
  const method = editingId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (!res.ok) {
    showMessage(data.error);
    return;
  }

  showMessage(editingId ? "User updated" : "Signed up successfully", true);
  resetForm();
  loadUsers();
}

function startEdit(user) {
  editingId = user.id;
  emailInput.value = user.email;
  passInput.value = "";
  passInput.placeholder = "New password (leave empty to keep)";
  title.textContent = "Edit User";
  saveBtn.textContent = "Update";
  cancelBtn.classList.remove("hidden");
  showMessage("");
  emailInput.focus();
}

// DELETE
async function deleteUser(id) {
  await fetch(`${API}/${id}`, { method: "DELETE" });
  if (editingId === id) resetForm();
  showMessage("User deleted", true);
  loadUsers();
}

function resetForm() {
  editingId = null;
  emailInput.value = "";
  passInput.value = "";
  passInput.placeholder = "Password";
  title.textContent = "Sign Up";
  saveBtn.textContent = "Sign Up";
  cancelBtn.classList.add("hidden");
}

saveBtn.addEventListener("click", saveUser);
cancelBtn.addEventListener("click", () => { resetForm(); showMessage(""); });
passInput.addEventListener("keydown", (e) => { if (e.key === "Enter") saveUser(); });

loadUsers();
