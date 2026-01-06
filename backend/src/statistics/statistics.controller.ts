import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  // GET http://localhost:3001/overview
  @Get('overview')
  getOverview() {
    return this.statisticsService.getOverview();
  }

  // GET http://localhost:3001/products
  @Get('products')
  getProducts() {
    return this.statisticsService.getProductStats();
  }

  // GET http://localhost:3001/users
  @Get('users')
  getUsers() {
    return this.statisticsService.getUserStats();
  }

  // GET http://localhost:3001/orders/revenue?period=month
  @Get('orders/revenue')
  getRevenue(@Query('period') period: 'day' | 'month' | 'year' = 'month') {
    return this.statisticsService.getRevenueStats(period);
  }

  // GET http://localhost:3001/orders/status
  @Get('orders/status')
  getOrderStatus() {
    return this.statisticsService.getOrderStatusStats();
  }

  // GET http://localhost:3001/blogs
  @Get('blogs')
  getBlogs() {
    return this.statisticsService.getBlogStats();
  }

  // GET http://localhost:3001/comments
  @Get('comments')
  getComments() {
    return this.statisticsService.getCommentStats();
  }

  // GET http://localhost:3001/suppliers
  @Get('suppliers')
  getSuppliers() {
    return this.statisticsService.getSupplierStats();
  }
}
