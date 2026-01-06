export enum PaymentMethod {
  // Thanh toán khi nhận hàng (Cash On Delivery)
  COD = 'COD',

  // Thanh toán qua ví điện tử MoMo

  MOMO = 'MOMO',
}

// Enum PaymentMethod đại diện cho các phương thức thanh toán hợp lệ trong hệ thống.
// Enum giúp giới hạn giá trị đầu vào, tránh việc client gửi linh tinh như "paypal", "cash", "banking".



