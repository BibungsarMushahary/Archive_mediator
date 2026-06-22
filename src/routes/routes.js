const express = require('express');
const prisma = require('../prisma/client');
const storage = require('../storage');

const router = express.Router();


router.get('/objects', async (req, res) => {
  try {
    const objects = await prisma.object.findMany({
      where: { deletedAt: null }
    });
    res.json({ success: true, data: objects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/objects/:id',async(req,res)=>{
    try{
        const object = await prisma.object.findUnique({
            where:{
                id: req.params.id
            }
        })
        
        if (!object){
            return res.status(404).json({
                success: false ,message:"Object Not found"
            })
        }
        res.json({  success: true,data: object});

    }catch(err){
        res.status(500).json({
            message: err.message
        })
    }
})


router.post('/objects/:id/archive', async (req, res) => {
  try {
    const object = await prisma.object.findUnique({
      where: { id: req.params.id }
    });

    if (!object) {
      return res.status(404).json({ message: 'Object not found' });
    }
    if (object.archiveStatus === 'ARCHIVED') {
      return res.status(400).json({ message: 'Already archived' });
    }
    if (object.archiveStatus === 'DELETED') {
      return res.status(400).json({ message: 'Object is deleted' });
    }

    const job = await storage.createJob(object.id, 'ARCHIVE');
    res.status(202).json({ jobId: job.id, status: 'QUEUED' });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


router.post('/objects/:id/restore', async (req, res) => {
  try {
    const object = await prisma.object.findUnique({
      where: { id: req.params.id }
    });

    if (!object) {
      return res.status(404).json({ message: 'Object not found' });
    }
    if (object.archiveStatus !== 'ARCHIVED') {
      return res.status(400).json({ message: 'Object is not archived' });
    }

    const job = await storage.createJob(object.id, 'RESTORE');
    res.status(202).json({ jobId: job.id, status: 'QUEUED' });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


router.post('/objects/:id/partial-restore', async (req, res) => {
  try {
    const { startByte, endByte } = req.body;
    
    if (startByte === undefined || endByte === undefined) {
      return res.status(400).json({ message: 'startByte and endByte required' });
    }
    if (startByte < 0 || endByte < 0) {
      return res.status(400).json({ message: 'Byte range must be positive' });
    }
    if (startByte > endByte) {
      return res.status(400).json({ message: 'Start must be less than end' });
    }

    const object = await prisma.object.findUnique({
      where: { id: req.params.id }
    });

    if (!object) {
      return res.status(404).json({ message: 'Object not found' });
    }
    if (object.archiveStatus !== 'ARCHIVED') {
      return res.status(400).json({ message: 'Object must be archived' });
    }
    if (endByte >= object.size) {
      return res.status(400).json({ message: 'End byte exceeds file size' });
    }

    const job = await storage.createJob(
      object.id, 
      'PARTIAL_RESTORE', 
      parseInt(startByte), 
      parseInt(endByte)
    );
    
    res.status(202).json({ jobId: job.id, status: 'QUEUED' });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


router.delete('/objects/:id', async (req, res) => {
  try {
    const object = await prisma.object.findUnique({
      where: { id: req.params.id }
    });

    if (!object) {
      return res.status(404).json({ message: 'Object not found' });
    }
    if (object.archiveStatus === 'DELETED') {
      return res.status(400).json({ message: 'Already deleted' });
    }

    await prisma.object.update({
      where: { id: req.params.id },
      data: {
        archiveStatus: 'DELETED',
        deletedAt: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        objectId: req.params.id,
        action: 'DELETE'
      }
    });

    res.json({ success: true, message: 'Object soft deleted' });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id }
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ success: true, data: job });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/jobs', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;