import React, { useState, useEffect } from 'react';

// Use environment variable or fall back to Express server URL or proxy
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/users`;

export default function SignUp() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Error connecting to backend server', isError: true });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setMessage({ text: '', isError: false });

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMessage({ text: 'Enter a valid email', isError: true });
      return;
    }

    if (!editingId && (!password || password.length < 6)) {
      setMessage({ text: 'Password must be at least 6 characters', isError: true });
      return;
    }

    if (editingId && password && password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters', isError: true });
      return;
    }

    setLoading(true);
    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? 'PUT' : 'POST';
      const body = { email: trimmedEmail };
      if (password) body.password = password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || 'Request failed', isError: true });
        setLoading(false);
        return;
      }

      setMessage({
        text: editingId ? 'User updated' : 'Signed up successfully',
        isError: false,
      });

      resetForm();
      await fetchUsers();
    } catch (err) {
      setMessage({ text: err.message || 'Network error', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user) => {
    const id = user.id || user._id;
    setEditingId(id);
    setEmail(user.email);
    setPassword('');
    setMessage({ text: '', isError: false });
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage({ text: data.error || 'Failed to delete user', isError: true });
        return;
      }
      if (editingId === id) resetForm();
      setMessage({ text: 'User deleted', isError: false });
      await fetchUsers();
    } catch (err) {
      setMessage({ text: 'Failed to delete user', isError: true });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="card">
      <h1 id="title">{editingId ? 'Edit User' : 'Sign Up'}</h1>
      <p className="sub">
        Already a member? <a href="#users">Log In</a>
      </p>

      <form onSubmit={handleSave}>
        <div className="field">
          <input
            type="email"
            id="email"
            placeholder="Email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <input
            type="password"
            id="password"
            placeholder={
              editingId ? 'New password (leave empty to keep)' : 'Password'
            }
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" id="saveBtn" className="save-btn" disabled={loading}>
          {editingId ? (loading ? 'Updating...' : 'Update') : (loading ? 'Signing Up...' : 'Sign Up')}
        </button>

        {editingId && (
          <button
            type="button"
            id="cancelBtn"
            className="cancel-btn"
            onClick={() => {
              resetForm();
              setMessage({ text: '', isError: false });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <p className={`message ${message.text && !message.isError ? 'ok' : ''}`}>
        {message.text}
      </p>

      <h2 id="users">Registered Users</h2>
      <ul id="userList">
        {users.length === 0 ? (
          <li className="empty">No users yet</li>
        ) : (
          users.map((u) => {
            const userId = u.id || u._id;
            return (
              <li key={userId}>
                <span>{u.email}</span>
                <div className="actions">
                  <button type="button" onClick={() => startEdit(u)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="delete"
                    onClick={() => handleDelete(userId)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
