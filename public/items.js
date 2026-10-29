const API = "/api/items";

// ---- login check ----
const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

document.getElementById("userEmail").textContent = localStorage.getItem("email");

// fetch with token attached
async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  });
  if (res.status === 401) {
    localStorage.clear();
    window.location.href = "login.html";
  }
  return res;
}

document.getElementById("logoutLink").addEventListener("click", async (e) => {
  e.preventDefault();
  await api("/api/logout", { method: "POST" });
  localStorage.clear();
  window.location.href = "login.html";
});

const nameInput = document.getElementById("itemName");
const saveBtn = document.getElementById("saveBtn");
const list = document.getElementById("itemList");
const message = document.getElementById("message");

let editingId = null; // null = adding, number = editing

// READ
async function loadItems() {
  const res = await api(API);
  const items = await res.json();
  renderItems(items);
}

function renderItems(items) {
  list.innerHTML = "";
  if (items.length === 0) {
    list.innerHTML = '<li class="empty">No items yet</li>';
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = item.name;

    const actions = document.createElement("div");
    actions.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => startEdit(item);

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "delete";
    delBtn.onclick = () => deleteItem(item.id);

    actions.append(editBtn, delBtn);
    li.append(span, actions);
    list.appendChild(li);
  });
}

// CREATE or UPDATE
async function saveItem() {
  const name = nameInput.value.trim();
  if (!name) {
    message.textContent = "Please enter a name";
    return;
  }
  message.textContent = "";

  const method = editingId ? "PUT" : "POST";
  const url = editingId ? `${API}/${editingId}` : API;

  await api(url, {
    method,
    body: JSON.stringify({ name }),
  });

  resetForm();
  loadItems();
}

function startEdit(item) {
  editingId = item.id;
  nameInput.value = item.name;
  saveBtn.textContent = "Update Item";
  nameInput.focus();
}

// DELETE
async function deleteItem(id) {
  await api(`${API}/${id}`, { method: "DELETE" });
  if (editingId === id) resetForm();
  loadItems();
}

function resetForm() {
  editingId = null;
  nameInput.value = "";
  saveBtn.textContent = "Add Item";
}

saveBtn.addEventListener("click", saveItem);
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveItem();
});

loadItems();
