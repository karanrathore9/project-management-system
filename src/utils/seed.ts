/* eslint-disable no-console */
// Run with: npm run seed
import 'dotenv/config';
import mongoose from 'mongoose';
import env from '../config/env';
import User from '../models/User';
import Project from '../models/Project';
import Task from '../models/Task';

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log('Connected. Seeding...');

  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Task.deleteMany({})]);

  const owner = await User.create({
    name: 'Alice Owner',
    email: 'alice@example.com',
    password: 'password123',
    role: 'manager',
  });

  const member = await User.create({
    name: 'Bob Member',
    email: 'bob@example.com',
    password: 'password123',
    role: 'member',
  });

  const project = await Project.create({
    name: 'Website Revamp',
    description: 'Redesign the marketing website',
    owner: owner._id,
    members: [
      { user: owner._id, role: 'manager' },
      { user: member._id, role: 'member' },
    ],
  });

  await Task.insertMany([
    {
      title: 'Set up design system',
      status: 'todo',
      project: project._id,
      createdBy: owner._id,
      assignee: member._id,
      order: 0,
    },
    {
      title: 'Build landing page',
      status: 'in-progress',
      project: project._id,
      createdBy: owner._id,
      assignee: owner._id,
      order: 0,
    },
    {
      title: 'Write project brief',
      status: 'done',
      project: project._id,
      createdBy: owner._id,
      order: 0,
    },
  ]);

  console.log('Seed complete:');
  console.log('  Owner:  alice@example.com / password123');
  console.log('  Member: bob@example.com / password123');
  console.log(`  Project ID: ${project._id}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
