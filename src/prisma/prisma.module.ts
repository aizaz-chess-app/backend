import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// Intentionally not @Global(): feature modules import PrismaModule explicitly
// so their dependency on the database stays visible in their own metadata.
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
