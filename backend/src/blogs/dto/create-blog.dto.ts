import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUrl,
  MaxLength,
  ArrayNotEmpty,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBlogDto {
  // Tiêu đề bài viết
  @IsString({ message: 'Tiêu đề phải là chuỗi ký tự.' }) // Tiêu đề phải là chuỗi ký tự.
  @IsNotEmpty({ message: 'Tiêu đề không được để trống.' }) // Tiêu đề không được để trống.
  @MaxLength(200, { message: 'Tiêu đề không được vượt quá 200 ký tự.' }) // Tiêu đề không được vượt quá 200 ký tự.
  title: string;

  // Nội dung bài viết
  @IsString({ message: 'Nội dung phải là chuỗi ký tự.' }) // Nội dung phải là chuỗi ký tự.
  @IsNotEmpty({ message: 'Nội dung không được để trống.' })
  content: string; // content của bài viết.

  // Bài viết nổi bật (true/false)
  @IsOptional() // Featured có thể là true hoặc false.
  @IsBoolean({ message: 'Featured phải là kiểu boolean.' }) // Featured phải là kiểu boolean.
  featured?: boolean; // featured của bài viết.

  // Hình ảnh chính (1 ảnh)
  @IsOptional() // Image có thể là null.
  @IsString({ message: 'Image phải là chuỗi URL.' }) // Image phải là chuỗi URL.
  @IsUrl({}, { message: 'Image phải là một URL hợp lệ.' }) // Image phải là một URL hợp lệ.
  image?: string; // image của bài viết.

  // Danh sách nhiều ảnh (mảng URL)
  @IsOptional() // Images có thể là null.
  @IsArray({ message: 'Images phải là một mảng.' })
  @Type(() => String) // Images phải là một mảng.
  @IsUrl({}, { each: true, message: 'Mỗi phần tử trong images phải là URL hợp lệ.' }) // Mỗi phần tử trong images phải là URL hợp lệ.
  images?: string[]; // images của bài viết.

  // Danh sách ảnh hiện tại (dùng khi update blog)
  @IsOptional() // currentImages có thể là null.
  @IsString({ message: 'currentImages phải là chuỗi JSON hoặc chuỗi thông thường.' })
  currentImages?: string; // currentImages của bài viết.
}

// CreateBlogDto là DTO để tạo bài viết mới.
// nhận title, content, featured, image, images và currentImages từ client.
// trả về title, content, featured, image, images và currentImages từ client.
// sử dụng để nhận thông tin tạo bài viết mới từ client.
// sử dụng để xử lý request tạo bài viết mới.