const { User, Entry, mongoose } = require('./mongoose');
const bcrypt = require('bcryptjs');

async function seedData() {
  try {
    console.log('Connecting to database for seeding...');

    // 1. Create Teacher and Student Users
    const salt = await bcrypt.genSalt(10);
    const teacherPasswordHash = await bcrypt.hash('Teacher123!', salt);
    const studentPasswordHash = await bcrypt.hash('Student123!', salt);

    console.log('Seeding Teacher and Student users...');
    
    // Upsert Teacher
    const teacher = await User.findOneAndUpdate(
      { email: 'teacher@school.com' },
      {
        name: 'Teacher Jane',
        email: 'teacher@school.com',
        password_hash: teacherPasswordHash,
        role: 'teacher'
      },
      { upsert: true, new: true }
    );

    // Upsert Student
    const student = await User.findOneAndUpdate(
      { email: 'student@school.com' },
      {
        name: 'Student Alex',
        email: 'student@school.com',
        password_hash: studentPasswordHash,
        role: 'student',
        class: 'Class 8-A'
      },
      { upsert: true, new: true }
    );

    // Get Admin user if exists to link entries
    const admin = await User.findOne({ role: 'admin' });
    const adminId = admin ? admin._id : null;

    console.log('Credentials Seeded:');
    console.log('--------------------------------------------------');
    console.log('Teacher Login -> Email: teacher@school.com | Password: Teacher123!');
    console.log('Student Login -> Email: student@school.com | Password: Student123!');
    console.log('--------------------------------------------------');

    // 2. Clear old entries and insert sample entries
    console.log('Clearing old entries...');
    await Entry.deleteMany({});

    console.log('Inserting mock recycling entries...');
    const mockEntries = [
      {
        user_id: adminId,
        logged_by: 'Admin User',
        class: 'Class 8-A',
        category: 'paper',
        kg: 45.5,
        entry_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        notes: 'Bulk newspapers from library clean-up'
      },
      {
        user_id: teacher._id,
        logged_by: 'Teacher Jane',
        class: 'Class 9-B',
        category: 'plastic',
        kg: 22.3,
        entry_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        notes: 'Water bottles collected during sports day'
      },
      {
        user_id: student._id,
        logged_by: 'Student Alex',
        class: 'Class 8-A',
        category: 'metal',
        kg: 12.8,
        entry_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        notes: 'Aluminum beverage cans'
      },
      {
        user_id: teacher._id,
        logged_by: 'Teacher Jane',
        class: 'Class 10-A',
        category: 'glass',
        kg: 35.0,
        entry_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        notes: 'Science lab empty glass bottles'
      },
      {
        user_id: adminId,
        logged_by: 'Admin User',
        class: 'Class 9-B',
        category: 'ewaste',
        kg: 8.5,
        entry_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        notes: 'Broken keyboards and mice from IT room'
      },
      {
        user_id: student._id,
        logged_by: 'Student Alex',
        class: 'Class 8-A',
        category: 'organic',
        kg: 60.2,
        entry_date: new Date(),
        notes: 'Food waste compost from cafeteria'
      },
      {
        user_id: teacher._id,
        logged_by: 'Teacher Jane',
        class: 'Class 10-B',
        category: 'paper',
        kg: 18.4,
        entry_date: new Date(),
        notes: 'Classroom worksheet scraps'
      }
    ];

    await Entry.insertMany(mockEntries);
    console.log('Sample entries seeded successfully!');

  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await mongoose.connection.close();
  }
}

seedData();
