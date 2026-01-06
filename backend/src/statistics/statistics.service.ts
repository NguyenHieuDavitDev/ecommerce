import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Order, OrderStatus } from '../order/order.entity';
import { User } from '../users/users.entity';
import { Product } from '../product/product.entity';
import { Blog } from '../blogs/blog.entity';
import { Comment } from '../comments/comment.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Blog) private blogRepo: Repository<Blog>,
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    @InjectRepository(Supplier) private supplierRepo: Repository<Supplier>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
  ) {}

  // ===================== REVENUE STATISTICS =====================
  async getRevenueStats(period: 'day' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;
    let groupByFormat: string;

    if (period === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      groupByFormat = '%Y-%m-%d';
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      groupByFormat = '%Y-%m';
    } else {
      startDate = new Date(now.getFullYear() - 4, 0, 1);
      groupByFormat = '%Y';
    }

    const orders = await this.orderRepo
      .createQueryBuilder('order')
      .select(`DATE_FORMAT(order.createdAt, '${groupByFormat}')`, 'period')
      .addSelect('SUM(order.totalAmount)', 'revenue')
      .addSelect('COUNT(order.id)', 'count')
      .where('order.status = :status', { status: OrderStatus.PAID })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .groupBy(`DATE_FORMAT(order.createdAt, '${groupByFormat}')`)
      .orderBy('period', 'ASC')
      .getRawMany();

    const totalRevenue = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.status = :status', { status: OrderStatus.PAID })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .getRawOne();

    const todayRevenue = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.status = :status', { status: OrderStatus.PAID })
      .andWhere('DATE(order.createdAt) = CURDATE()')
      .getRawOne();

    return {
      period,
      data: orders.map((o) => ({
        period: o.period,
        revenue: parseFloat(o.revenue || 0),
        count: parseInt(o.count || 0, 10),
      })),
      totalRevenue: parseFloat(totalRevenue?.total || 0),
      todayRevenue: parseFloat(todayRevenue?.total || 0),
    };
  }

  // ===================== USER STATISTICS =====================
  async getUserStats() {
    const totalUsers = await this.userRepo.count();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

    const newUsersToday = await this.userRepo.count({
      where: { createdAt: MoreThanOrEqual(startOfToday) },
    });

    const newUsersThisMonth = await this.userRepo.count({
      where: { createdAt: MoreThanOrEqual(startOfMonth) },
    });

    const usersByMonth = await this.userRepo
      .createQueryBuilder('user')
      .select("DATE_FORMAT(user.createdAt, '%Y-%m')", 'month')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.createdAt >= :startDate', { startDate: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() - 11, 1) })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return {
      totalUsers,
      newUsersToday,
      newUsersThisMonth,
      usersByMonth: usersByMonth.map((u) => ({
        month: u.month,
        count: parseInt(u.count || 0, 10),
      })),
    };
  }

  // ===================== PRODUCT STATISTICS =====================
  async getProductStats() {
    const totalProducts = await this.productRepo.count();

    const lowStockProducts = await this.productRepo.count({
      where: { stock: LessThanOrEqual(10) },
    });

    const outOfStockProducts = await this.productRepo.count({
      where: { stock: LessThanOrEqual(0) },
    });

    const productsByCategory = await this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.category', 'category')
      .select('category.name', 'categoryName')
      .addSelect('COUNT(product.id)', 'count')
      .groupBy('category.id')
      .getRawMany();

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      productsByCategory: productsByCategory.map((p) => ({
        category: p.categoryName || 'Chưa phân loại',
        count: parseInt(p.count || 0, 10),
      })),
    };
  }

  // ===================== BLOG STATISTICS =====================
  async getBlogStats() {
    const totalBlogs = await this.blogRepo.count();
    const featuredBlogs = await this.blogRepo.count({ where: { featured: true } });

    const blogsByMonth = await this.blogRepo
      .createQueryBuilder('blog')
      .select("DATE_FORMAT(blog.createdAt, '%Y-%m')", 'month')
      .addSelect('COUNT(blog.id)', 'count')
      .where('blog.createdAt >= :startDate', { startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1) })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return {
      totalBlogs,
      featuredBlogs,
      blogsByMonth: blogsByMonth.map((b) => ({
        month: b.month,
        count: parseInt(b.count || 0, 10),
      })),
    };
  }

  // ===================== COMMENT STATISTICS =====================
  async getCommentStats() {
    const totalComments = await this.commentRepo.count();

    const avgRating = await this.commentRepo
      .createQueryBuilder('comment')
      .select('AVG(comment.rating)', 'avg')
      .getRawOne();

    const commentsByMonth = await this.commentRepo
      .createQueryBuilder('comment')
      .select("DATE_FORMAT(comment.createdAt, '%Y-%m')", 'month')
      .addSelect('COUNT(comment.id)', 'count')
      .where('comment.createdAt >= :startDate', { startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1) })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    const ratingDistribution = await this.commentRepo
      .createQueryBuilder('comment')
      .select('comment.rating', 'rating')
      .addSelect('COUNT(comment.id)', 'count')
      .groupBy('comment.rating')
      .orderBy('comment.rating', 'DESC')
      .getRawMany();

    return {
      totalComments,
      avgRating: parseFloat(avgRating?.avg || 0),
      commentsByMonth: commentsByMonth.map((c) => ({
        month: c.month,
        count: parseInt(c.count || 0, 10),
      })),
      ratingDistribution: ratingDistribution.map((r) => ({
        rating: parseInt(r.rating || 0, 10),
        count: parseInt(r.count || 0, 10),
      })),
    };
  }

  // ===================== SUPPLIER STATISTICS =====================
  async getSupplierStats() {
    const totalSuppliers = await this.supplierRepo.count();

    const suppliersWithProducts = await this.supplierRepo
      .createQueryBuilder('supplier')
      .leftJoin('supplier.products', 'product')
      .select('supplier.name', 'supplierName')
      .addSelect('COUNT(product.id)', 'productCount')
      .groupBy('supplier.id')
      .orderBy('productCount', 'DESC')
      .getRawMany();

    return {
      totalSuppliers,
      suppliersWithProducts: suppliersWithProducts.map((s) => ({
        supplier: s.supplierName,
        productCount: parseInt(s.productCount || 0, 10),
      })),
    };
  }

  // ===================== ORDER STATUS STATISTICS =====================
  async getOrderStatusStats() {
    const statusCounts = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .addSelect('SUM(order.totalAmount)', 'totalAmount')
      .groupBy('order.status')
      .getRawMany();

    return statusCounts.map((s) => ({
      status: s.status,
      count: parseInt(s.count || 0, 10),
      totalAmount: parseFloat(s.totalAmount || 0),
    }));
  }

  // ===================== OVERVIEW STATISTICS =====================
  async getOverview() {
    const [
      totalOrders,
      totalRevenue,
      totalUsers,
      totalProducts,
      totalBlogs,
      totalComments,
      totalSuppliers,
    ] = await Promise.all([
      this.orderRepo.count(),
      this.orderRepo.createQueryBuilder('order')
        .select('SUM(order.totalAmount)', 'total')
        .where('order.status = :status', { status: OrderStatus.PAID })
        .getRawOne(),
      this.userRepo.count(),
      this.productRepo.count(),
      this.blogRepo.count(),
      this.commentRepo.count(),
      this.supplierRepo.count(),
    ]);

    const pendingOrders = await this.orderRepo.count({ where: { status: OrderStatus.PENDING } });

    return {
      totalOrders,
      totalRevenue: parseFloat(totalRevenue?.total || 0),
      totalUsers,
      totalProducts,
      totalBlogs,
      totalComments,
      totalSuppliers,
      pendingOrders,
    };
  }
}
