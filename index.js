import env from 'dotenv';
await env.config();
import app from './app.js';
import dbConnect from './db.js';
import createAdminUser from './create-admin.js';
import Period from './model/period.model.js';
import cron from 'node-cron';

const PORT = process.env.PORT || 8000;

const getPeriodName = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

const createPeriodIfNotExists = async (year, month) => {
  const name = getPeriodName(year, month);
  console.log(`Checking for period '${name}'`);

  const existingPeriod = await Period.findOne({ name });
  if (existingPeriod) {
    console.log(`Period '${name}' already exists`);
    return existingPeriod;
  }

  const newPeriod = new Period({ year, month, name });
  await newPeriod.save();
  console.log(`Created period '${name}'`);
  return newPeriod;
};

const scheduleMonthlyPeriod = () => {
  cron.schedule('1 0 1 * *', async () => {
    const now = new Date();
    try {
      await createPeriodIfNotExists(now.getFullYear(), now.getMonth() + 1);
    } catch (error) {
      console.error('Failed to create monthly period on cron schedule:', error);
    }
  });
};

const startServer = async () => {
  await dbConnect();
  await createAdminUser(); // Create admin user before server start

  const now = new Date();
  await createPeriodIfNotExists(now.getFullYear(), now.getMonth() + 1);
  // scheduleMonthlyPeriod();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();

