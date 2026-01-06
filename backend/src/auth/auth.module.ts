import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { MailModule } from '../mail/mail.module';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [
    ConfigModule, // Import ConfigModule để sử dụng các config từ file .env.
    UsersModule, // Import UsersModule để sử dụng các service và repository liên quan đến user. 
    MailModule, // Import MailModule để sử dụng các service và repository liên quan đến email.
    VerificationModule, // Import VerificationModule để sử dụng các service và repository liên quan đến verification.
    JwtModule.registerAsync({ // Import JwtModule để sử dụng các service và repository liên quan đến JWT.
      inject: [ConfigService], // Inject ConfigService để sử dụng các config từ file .env.
      useFactory: (config: ConfigService) => { // Sử dụng ConfigService để lấy các config từ file .env.
        const expiresIn = config.get<string>('JWT_EXPIRES_IN', '1h') as JwtSignOptions['expiresIn']; // Lấy thời gian hết hạn của JWT từ file .env.
        return {
          secret: config.get<string>('JWT_SECRET', 'please-change-me'), // Lấy secret của JWT từ file .env.
          signOptions: { expiresIn }, // Thời gian hết hạn của JWT.
        };
      },
    }),
  ],
  controllers: [AuthController], // Import AuthController để sử dụng các phương thức trong AuthController.
  providers: [AuthService, JwtStrategy], // Import AuthService và JwtStrategy để sử dụng các service và repository liên quan đến Auth và JWT.
})
export class AuthModule {}

// AuthModule là module để sử dụng các service và repository liên quan đến Auth và JWT.
// Sử dụng các module khác để sử dụng các service và repository liên quan đến Auth và JWT.
// Sử dụng các module khác để sử dụng các service và repository liên quan đến Auth và JWT.
