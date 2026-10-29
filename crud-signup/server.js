const express = require("express");
const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const dotenv = require("dotenv");

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (_) {}


dotenv.config();
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const MONGO_URI = process.env.MONGO_URI;

const connectWithRetry = (retries = 5, delay = 3000) => {
  if (!MONGO_URI) {
    console.warn("MongoDB connection warning: MONGO_URI is not set in environment.");
    return;
  }
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
      if (retries > 0) {
        console.log(`Retrying MongoDB connection in ${delay / 1000}s... (${retries} attempts left)`);
        setTimeout(() => connectWithRetry(retries - 1, delay), delay);
      }
    });
};

connectWithRetry();

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

const emailOk = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// never send the password back to the front end
const safe = (u) => ({
  id: u._id ? u._id.toString() : u.id,
  _id: u._id ? u._id.toString() : u.id,
  email: u.email,
});


app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map(safe));
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch users" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!emailOk(email)) return res.status(400).json({ error: "Enter a valid email" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ error: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ email, password: hashedPassword });
    res.status(201).json(safe(user));
  } catch (err) {
    console.error("Create user error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: err.message || "Server error creating user" });
  }
});


app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!emailOk(email)) return res.status(400).json({ error: "Enter a valid email" });
    if (password && password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    const duplicateUser = await User.findOne({ email, _id: { $ne: id } });
    if (duplicateUser) return res.status(409).json({ error: "Email already registered" });

    user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    await user.save();
    res.json(safe(user));
  } catch (err) {
    console.error("Update user error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: err.message || "Server error updating user" });
  }
});


app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: err.message || "Server error deleting user" });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
