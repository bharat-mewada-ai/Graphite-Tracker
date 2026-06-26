const router = require('express').Router();
const { Entry } = require('../db/mongoose');
const auth   = require('../middleware/auth');
const mongoose = require('mongoose');

// GET /api/stats/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalRes, weekRes, byCatRes, classesRes] = await Promise.all([
      Entry.aggregate([{ $group: { _id: null, total: { $sum: '$kg' } } }]),
      Entry.aggregate([
        { $match: { entry_date: { $gte: sevenDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$kg' } } }
      ]),
      Entry.aggregate([
        { $group: { _id: '$category', kg: { $sum: '$kg' } } },
        { $project: { category: '$_id', kg: 1, _id: 0 } }
      ]),
      Entry.distinct('class')
    ]);

    const total = totalRes[0] ? totalRes[0].total : 0;
    const week = weekRes[0] ? weekRes[0].total : 0;
    const classes = classesRes.length;

    res.json({
      total,
      week,
      classes,
      by_category: byCatRes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/trend
router.get('/trend', auth, async (req, res) => {
  const range = parseInt(req.query.range) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - range);

  try {
    const results = await Entry.aggregate([
      { $match: { entry_date: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$entry_date" } },
            category: "$category"
          },
          kg: { $sum: "$kg" }
        }
      },
      {
        $project: {
          date: "$_id.date",
          category: "$_id.category",
          kg: 1,
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    const map = {};
    results.forEach(r => {
      if (!map[r.date]) map[r.date] = { date: r.date };
      map[r.date][r.category] = r.kg;
    });

    res.json(Object.values(map));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  const { category } = req.query;
  const match = {};
  if (category) match.category = category;

  try {
    const leaderboard = await Entry.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$class',
          kg: { $sum: '$kg' },
          entries: { $sum: 1 }
        }
      },
      {
        $project: {
          class: '$_id',
          kg: 1,
          entries: 1,
          _id: 0
        }
      },
      { $sort: { kg: -1 } },
      { $limit: 10 }
    ]);

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/my-profile (Student / User profile statistics)
router.get('/my-profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const name = req.user.name;
    const userClass = req.user.class || '';

    // Calculate total contribution
    const totalContRes = await Entry.aggregate([
      {
        $match: {
          $or: [
            { user_id: new mongoose.Types.ObjectId(userId) },
            { logged_by: { $regex: `^${name}$`, $options: 'i' } }
          ]
        }
      },
      { $group: { _id: null, total: { $sum: '$kg' } } }
    ]);

    const totalContribution = totalContRes[0] ? totalContRes[0].total : 0;

    let rank = '-';
    let classTotalStudents = 0;

    if (userClass) {
      // Find all contributions in student's class, grouped by logged_by
      const classLeaderboard = await Entry.aggregate([
        { $match: { class: userClass } },
        {
          $group: {
            _id: { $toLower: '$logged_by' },
            totalKg: { $sum: '$kg' }
          }
        },
        { $sort: { totalKg: -1 } }
      ]);

      classTotalStudents = classLeaderboard.length;
      const myNameLower = name.toLowerCase();
      const myIndex = classLeaderboard.findIndex(item => item._id === myNameLower);
      if (myIndex !== -1) {
        rank = myIndex + 1;
      }
    }

    res.json({
      name,
      class: userClass,
      role: req.user.role,
      totalContribution,
      rank,
      classTotalStudents
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;