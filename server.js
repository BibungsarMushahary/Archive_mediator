require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/prisma/client');
const fs = require('fs-extra');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    
    await fs.ensureDir(process.env.PRIMARY_STORAGE || './src/storage/primary');
    await fs.ensureDir(process.env.ARCHIVE_STORAGE || './src/storage/archive');
    await fs.ensureDir(process.env.RESTORE_STORAGE || './src/storage/restore');

    
    await prisma.$connect();
    console.log(' Database connected');

    
    app.listen(PORT, () => {
      console.log(` Server running on http://localhost:${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error(' Failed to start:', error.message);
    process.exit(1);
  }
}

startServer();


process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});