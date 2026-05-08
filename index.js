import env from 'dotenv';
await env.config();
import app from './app.js';
import dbConnect from './db.js';
import createAdminUser from './create-admin.js';


const PORT = process.env.PORT || 8000;

const startServer = async () => {
  await dbConnect();
  await createAdminUser(); // Create admin user before server start
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();

