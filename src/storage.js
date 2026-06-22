const fs = require('fs-extra');
const path = require('path');
const prisma = require('./prisma/client');

async function processJob(jobId) {
  try {
   
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    if (!job) return;

    
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'IN_PROGRESS' }
    });

    
    const object = await prisma.object.findUnique({
      where: { id: job.objectId }
    });
    if (!object) throw new Error('Object not found');

    
    if (job.type === 'ARCHIVE') {
      await archiveObject(object, job);
    } else if (job.type === 'RESTORE') {
      await restoreObject(object, job);
    } else if (job.type === 'PARTIAL_RESTORE') {
      await partialRestore(object, job);
    }

    
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', completedAt: new Date() }
    });

  } catch (error) {
    
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'FAILED', errorMessage: error.message }
    });
  }
}


async function archiveObject(object, job) {
  const dest = path.join(process.env.ARCHIVE_STORAGE, object.name);
  await fs.ensureDir(process.env.ARCHIVE_STORAGE);
  await fs.move(object.storagePath, dest, { overwrite: true });
  
  await prisma.object.update({
    where: { id: object.id },
    data: { storagePath: dest, archiveStatus: 'ARCHIVED' }
  });

  await prisma.auditLog.create({
    data: { objectId: object.id, action: 'ARCHIVE' }
  });
}


async function restoreObject(object, job) {
  const dest = path.join(process.env.PRIMARY_STORAGE, object.name);
  await fs.ensureDir(process.env.PRIMARY_STORAGE);
  await fs.move(object.storagePath, dest, { overwrite: true });
  
  await prisma.object.update({
    where: { id: object.id },
    data: { storagePath: dest, archiveStatus: 'ACTIVE' }
  });

  await prisma.auditLog.create({
    data: { objectId: object.id, action: 'RESTORE' }
  });
}

async function partialRestore(object, job) {
  const outputFile = path.join(
    process.env.RESTORE_STORAGE || './src/storage/restore',
    `${object.name}.partial`
  );
  await fs.ensureDir(path.dirname(outputFile));
  
  const readStream = fs.createReadStream(object.storagePath, {
    start: job.startByte,
    end: job.endByte
  });
  const writeStream = fs.createWriteStream(outputFile);
  
  await new Promise((resolve, reject) => {
    readStream.pipe(writeStream);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  await prisma.auditLog.create({
    data: { 
      objectId: object.id, 
      action: `PARTIAL_RESTORE_${job.startByte}_${job.endByte}` 
    }
  });
}


function createJob(objectId, type, startByte = null, endByte = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const job = await prisma.job.create({
        data: {
          objectId,
          type,
          status: 'QUEUED',
          startByte,
          endByte
        }
      });

     
      setTimeout(() => processJob(job.id), 10);
      
      resolve(job);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  createJob,
  processJob
};