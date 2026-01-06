import { IsOptional, IsString, IsBoolean, IsArray, ArrayNotEmpty, IsUrl } from 'class-validator';

export class UpdateBlogDto { // DTO để cập nhật bài viết.
  @IsOptional() // Title có thể là null.
  @IsString({ message: 'Tiêu đề phải là chuỗi.' }) // Tiêu đề phải là chuỗi.
  title?: string; // title của bài viết.

  @IsOptional() // Content có thể là null.
  @IsString({ message: 'Nội dung phải là chuỗi.' }) // Nội dung phải là chuỗi.
  content?: string; // content của bài viết.

  @IsOptional() // Featured có thể là null.
  @IsBoolean({ message: 'Featured phải là kiểu boolean.' }) // Featured phải là kiểu boolean.
  featured?: boolean; // featured của bài viết.
  @IsString({ message: 'Image phải là chuỗi (URL hoặc path file).' }) // Image phải là chuỗi (URL hoặc path file).
  image?: string; // image của bài viết.

  @IsOptional() // Images có thể là null.
  @IsArray({ message: 'Images phải là một mảng.' }) // Images phải là một mảng.
  @IsString({ each: true, message: 'Mỗi phần tử trong images phải là chuỗi.' }) // Mỗi phần tử trong images phải là chuỗi.
  images?: string[]; // images của bài viết.

  @IsOptional() // currentImages có thể là null.
  @IsString({ message: 'currentImages phải là chuỗi.' }) // currentImages phải là chuỗi.
  currentImages?: string; // currentImages của bài viết.
}

// UpdateBlogDto là DTO để cập nhật bài viết.
// nhận title, content, featured, image, images và currentImages từ client.
// trả về title, content, featured, image, images và currentImages từ client.
// sử dụng để nhận thông tin cập nhật bài viết từ client.
// sử dụng để xử lý request cập nhật bài viết.