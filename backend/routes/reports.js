const router = require('express').Router();
const { Entry } = require('../db/mongoose');
const auth   = require('../middleware/auth');

// GET /api/reports/csv
router.get('/csv', auth, async (req, res) => {
  const { from, to, class: cls } = req.query;
  const query = {};
  if (cls) query.class = cls;
  if (from || to) {
    query.entry_date = {};
    if (from) query.entry_date.$gte = new Date(from);
    if (to) query.entry_date.$lte = new Date(to);
  }

  try {
    const data = await Entry.find(query).sort({ entry_date: -1 });
    
    // Create CSV manually
    const headers = ['Date', 'Class', 'Category', 'Weight (kg)', 'Logged By', 'Notes'];
    const rows = data.map(r => [
      r.entry_date ? new Date(r.entry_date).toISOString().slice(0, 10) : '',
      r.class || '',
      r.category || '',
      r.kg || 0,
      r.logged_by || '',
      r.notes || ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    
    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition',
      `attachment; filename="recycling_${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;