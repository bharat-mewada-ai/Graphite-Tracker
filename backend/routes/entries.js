const router = require('express').Router();
const { Entry } = require('../db/mongoose');
const auth   = require('../middleware/auth');

// GET /api/entries
router.get('/', auth, async (req, res) => {
  const { class: cls, category, from, to, page = 1, limit = 15 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query = {};
  if (cls) query.class = cls;
  if (category) query.category = category;
  if (from || to) {
    query.entry_date = {};
    if (from) query.entry_date.$gte = new Date(from);
    if (to) query.entry_date.$lte = new Date(to);
  }

  try {
    const total = await Entry.countDocuments(query);
    const data = await Entry.find(query)
      .sort({ entry_date: -1, _id: -1 })
      .skip(skip)
      .limit(limitNum);

    // Map _id to id for frontend compatibility
    const entries = data.map(e => {
      const obj = e.toObject();
      obj.id = obj._id.toString();
      return obj;
    });

    res.json({
      total,
      page: pageNum,
      entries
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/entries
router.post('/', auth, async (req, res) => {
  if (req.user.role === 'student') {
    return res.status(403).json({ error: 'Students are not allowed to log entries.' });
  }

  const { class: cls, category, kg, entry_date, logged_by, notes, student_id } = req.body;
  if (!cls || !category || !kg || !entry_date)
    return res.status(400).json({ error: 'Missing required fields' });
  if (kg <= 0 || kg > 500)
    return res.status(400).json({ error: 'Weight must be 0.1–500 kg' });

  try {
    const newEntry = new Entry({
      user_id: student_id || req.user.id,
      logged_by,
      class: cls,
      category,
      kg,
      entry_date: new Date(entry_date),
      notes: notes || ''
    });

    await newEntry.save();
    
    const obj = newEntry.toObject();
    obj.id = obj._id.toString();
    res.status(201).json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/entries/:id
router.put('/:id', auth, async (req, res) => {
  const { class: cls, category, kg, entry_date, logged_by, notes, student_id } = req.body;
  try {
    const entry = await Entry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    // Check permissions
    if (req.user.role !== 'admin' && entry.user_id.toString() !== req.user.id.toString())
      return res.status(403).json({ error: 'Not your entry' });

    entry.class = cls;
    entry.category = category;
    entry.kg = kg;
    entry.entry_date = new Date(entry_date);
    entry.logged_by = logged_by;
    entry.notes = notes;
    if (student_id) {
      entry.user_id = student_id;
    }

    await entry.save();
    
    const obj = entry.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/entries/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    if (req.user.role !== 'admin' && entry.user_id.toString() !== req.user.id.toString())
      return res.status(403).json({ error: 'Not your entry' });

    await Entry.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;