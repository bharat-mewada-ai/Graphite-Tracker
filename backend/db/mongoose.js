const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

mongoose.connect(connectionString)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, default: 'teacher', enum: ['admin', 'teacher', 'student'] },
  class: { type: String, default: '' }
}, { timestamps: true });

// Entry Schema
const EntrySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  logged_by: { type: String },
  class: { type: String, required: true },
  category: { type: String, required: true },
  kg: { type: Number, required: true, min: 0.1, max: 500 },
  entry_date: { type: Date, required: true, default: Date.now },
  notes: { type: String, default: '' }
}, { timestamps: true });

// Goal Schema
const GoalSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  target_kg: { type: Number, required: true },
  academic_year: { type: String, default: '2025-26' }
});

const User = mongoose.model('User', UserSchema);
const Entry = mongoose.model('Entry', EntrySchema);
const Goal = mongoose.model('Goal', GoalSchema);

module.exports = {
  mongoose,
  User,
  Entry,
  Goal
};
