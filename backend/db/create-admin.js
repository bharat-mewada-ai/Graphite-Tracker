const { User, mongoose } = require('./mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const name = process.env.ADMIN_NAME || 'School Admin';
  const email = process.env.ADMIN_EMAIL || 'admin@school.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const role = 'admin';

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log(`Checking if user ${email} already exists in MongoDB...`);
    const check = await User.findOne({ email });
    
    if (check) {
      console.log(`User ${email} already exists.`);
    } else {
      const adminUser = new User({
        name,
        email,
        password_hash: passwordHash,
        role
      });
      await adminUser.save();
      
      console.log('--------------------------------------------------');
      console.log('Admin user created successfully in MongoDB!');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log(`Role: ${role}`);
      console.log('--------------------------------------------------');
    }
  } catch (err) {
    console.error('Error creating admin user:', err);
  } finally {
    await mongoose.connection.close();
  }
}

createAdmin();
