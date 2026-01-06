import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './role.entity';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { User } from '../users/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, User])],
  providers: [RolesService],
  controllers: [RolesController],
  exports: [RolesService],
})
export class RolesModule {}


