// Yeh main entry point hai — sabko yahan jodha jaata hai

const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());                  // Frontend se requests allow karo
app.use(express.json());          // JSON body parse karo
app.use(express.static('frontend')); // HTML files serve karo

// Routes — har prefix apni file se aata hai
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/entries', require('./routes/entries'));
app.use('/api/stats',   require('./routes/stats'));
app.use('/api/goals',   require('./routes/goals'));
app.use('/api/reports', require('./routes/reports'));

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});