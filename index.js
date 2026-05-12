import env from 'dotenv';
await env.config();
import app from './app.js';
import dbConnect from './db.js';
import createAdminUser from './create-admin.js';
import Period from './model/period.model.js';

const PORT = process.env.PORT || 8000;

const getPeriodName = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

const createPeriodIfNotExists = async (year, month) => {
  const name = getPeriodName(year, month);
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

const getNextPeriodTrigger = () => {
  const now = new Date();
  const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
  const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
  const trigger = new Date(nextYear, nextMonth, 1, 0, 1, 1, 0);

  return trigger <= now
    ? new Date(nextYear + (nextMonth === 11 ? 1 : 0), (nextMonth + 1) % 12, 1, 0, 1, 1, 0)
    : trigger;
};

const scheduleNextMonthPeriod = () => {
  const trigger = getNextPeriodTrigger();
  const delay = trigger.getTime() - Date.now();

  console.log(`Scheduling next period creation for ${trigger.toISOString()}`);

  setTimeout(async () => {
    try {
      await createPeriodIfNotExists(trigger.getFullYear(), trigger.getMonth() + 1);
    } catch (error) {
      console.error('Failed to create monthly period on schedule:', error);
    }
    scheduleNextMonthPeriod();
  }, delay);
};

const startServer = async () => {
  await dbConnect();
  await createAdminUser(); // Create admin user before server start

  const now = new Date();
  await createPeriodIfNotExists(now.getFullYear(), now.getMonth() + 1);
  scheduleNextMonthPeriod();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();

