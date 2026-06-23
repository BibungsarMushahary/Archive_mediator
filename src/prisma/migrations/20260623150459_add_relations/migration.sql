-- AlterTable
ALTER TABLE "Object" ALTER COLUMN "archiveStatus" SET DEFAULT 'ACTIVE';

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "Object"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "Object"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
