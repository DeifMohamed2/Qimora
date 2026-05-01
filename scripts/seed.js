#!/usr/bin/env node
/* ============================================================
   Seed admin user + default projects (idempotent upserts)
   Usage: npm run seed
   Env: MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD
   ============================================================ */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Project = require('../models/Project');
const defaultProjects = require('../lib/seedDefaultProjects');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qimora';
  await mongoose.connect(uri);
  console.log('✦  MongoDB connected →', mongoose.connection.host);

  const email = (process.env.ADMIN_EMAIL || 'admin@qimora.app').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'changeme1234';

  if (!process.env.ADMIN_PASSWORD) {
    console.warn('⚠  ADMIN_PASSWORD not set — using default "changeme1234" (change immediately).');
  }

  const existing = await Admin.findOne({ email });
  if (!existing) {
    await Admin.create({
      email,
      passwordHash: Admin.hashPassword(password)
    });
    console.log('✦  Admin created:', email);
  } else {
    console.log('✦  Admin already exists:', email);
  }

  for (let i = 0; i < defaultProjects.length; i += 1) {
    const data = { ...defaultProjects[i], order: defaultProjects[i].order ?? i };
    await Project.findOneAndUpdate({ slug: data.slug }, { $set: data }, { upsert: true, new: true });
    console.log('✦  Project upserted:', data.slug);
  }

  await mongoose.disconnect();
  console.log('✦  Seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
