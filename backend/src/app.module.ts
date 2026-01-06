import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CategoryModule } from './category/category.module';
import { SupplierModule } from './supplier/supplier.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { FlashsaleModule } from './flashsale/flashsale.module';
import { BlogsModule } from './blogs/blogs.module';
import { CommentsModule } from './comments/comments.module';
import { RolesModule } from './roles/roles.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Kết nối MySQL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
      type: 'mysql',
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: Number(config.get<string>('DATABASE_PORT', '3306')),
        username: config.get<string>('DATABASE_USER', 'root'),
        password: config.get<string>('DATABASE_PASS', ''),
        database: config.get<string>('DATABASE_NAME', 'productdb'),
      autoLoadEntities: true,
        synchronize: config.get<string>('DATABASE_SYNC', 'true') === 'true', 
      }),
    }),

    // Cho phép truy cập file tĩnh (ảnh upload)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads', // URL truy cập = http://localhost:3000/uploads/...
    }),

    // Các module khác
    CategoryModule,
    SupplierModule,
    UsersModule,
    AuthModule,
    ProductModule,
    OrderModule,
    FlashsaleModule,
    BlogsModule,
    CommentsModule,
    RolesModule,
    StatisticsModule,
  ],
})
export class AppModule {}
