const router = require('express').Router();
const { User } = require('../db/mongoose');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const auth   = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Email not found' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Wrong password' });

    // Token with 7d expiration
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role, class: user.class || '' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user._id, name: user.name, role: user.role, class: user.class || '' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

// POST /api/auth/register (Admin only)
router.post('/register', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admin users can register new users' });
  }

  const { name, email, password, role, class: cls } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const validRoles = ['admin', 'teacher', 'student'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const check = await User.findOne({ email });
    if (check) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password_hash: hash,
      role,
      class: cls || ''
    });

    await newUser.save();

    res.status(201).json({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      class: newUser.class
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users (Admin only)
router.get('/users', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admin users can list registered users' });
  }
  try {
    const users = await User.find({}, 'name email role class createdAt').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/reset-password/:id (Admin only)
router.put('/reset-password/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admin users can update passwords' });
  }
  const { newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    const user = await User.findByIdAndUpdate(req.params.id, { password_hash: hash }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: `Password updated successfully for ${user.name}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/students (Admin & Teacher only)
router.get('/students', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only admins and teachers can view student lists' });
  }
  try {
    const students = await User.find({ role: 'student' }, 'name email class').sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;