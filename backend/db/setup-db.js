const { Goal, mongoose } = require('./mongoose');

const defaultGoals = [
  { category: 'paper', target_kg: 300 },
  { category: 'plastic', target_kg: 200 },
  { category: 'metal', target_kg: 100 },
  { category: 'glass', target_kg: 80 },
  { category: 'ewaste', target_kg: 40 },
  { category: 'organic', target_kg: 280 }
];

async function setupDatabase() {
  try {
    console.log('Connecting to database and creating default goals...');
    for (const g of defaultGoals) {
      await Goal.findOneAndUpdate(
        { category: g.category },
        g,
        { upsert: true, new: true }
      );
    }
    console.log('Database initialized successfully with default goals!');
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await mongoose.connection.close();
  }
}

setupDatabase();
