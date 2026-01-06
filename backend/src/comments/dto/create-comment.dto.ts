// src/comments/dto/create-comment.dto.ts
export class CreateCommentDto {
  username: string; // tên người comment
  text: string;     // nội dung comment
  rating?: number;  // đánh giá (tùy chọn)
  images?: string[]; // đường dẫn ảnh (tự gán trong controller)
}
