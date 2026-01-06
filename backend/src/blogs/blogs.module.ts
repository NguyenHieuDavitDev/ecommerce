import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { Blog } from './blog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Blog])], // đăng ký entity với TypeORM
  providers: [BlogsService], //
  controllers: [BlogsController],
})
export class BlogsModule {}
