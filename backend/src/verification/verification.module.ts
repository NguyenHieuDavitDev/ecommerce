import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationToken } from './verification.entity';
import { VerificationService } from './verification.service';

@Module({
  imports: [TypeOrmModule.forFeature([VerificationToken])],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}


