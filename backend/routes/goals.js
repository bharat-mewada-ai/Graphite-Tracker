const router = require('express').Router();
const { Goal } = require('../db/mongoose');
const auth   = require('../middleware/auth');

// GET /api/goals
router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find();
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/goals/:category
router.put('/:category', auth, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin only' });

  const { target_kg } = req.body;
  try {
    const goal = await Goal.findOneAndUpdate(
      { category: req.params.category },
      { target_kg },
      { new: true, upsert: true }
    );
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;