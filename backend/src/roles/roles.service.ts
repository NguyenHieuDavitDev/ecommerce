import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { User } from '../users/users.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async ensureRole(name: string): Promise<Role> {
    const normalized = (name || 'user').toLowerCase();
    let role = await this.rolesRepo.findOne({ where: { name: normalized } });
    if (!role) {
      role = this.rolesRepo.create({ name: normalized });
      role = await this.rolesRepo.save(role);
    }
    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.rolesRepo.findOne({ where: { name } });
  }

  async findAll(): Promise<Role[]> {
    return this.rolesRepo.find();
  }

  async findAllWithCounts(): Promise<(Role & { userCount?: number })[]> {
    return this.rolesRepo
      .createQueryBuilder('role')
      .loadRelationCountAndMap('role.userCount', 'role.users')
      .orderBy('role.name', 'ASC')
      .getMany();
  }

  async createRole(payload: { name: string; description?: string }): Promise<Role> {
    const name = (payload.name || '').trim().toLowerCase();
    if (!name) {
      throw new BadRequestException('Role name is required');
    }
    const existing = await this.rolesRepo.findOne({ where: { name } });
    if (existing) {
      throw new BadRequestException('Role name already exists');
    }
    const role = this.rolesRepo.create({ name, description: payload.description });
    return this.rolesRepo.save(role);
  }

  async updateRole(id: number, payload: { name?: string; description?: string }): Promise<Role> {
    const role = await this.rolesRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');

    if (payload.name) {
      const normalized = payload.name.trim().toLowerCase();
      if (normalized !== role.name) {
        const existing = await this.rolesRepo.findOne({ where: { name: normalized } });
        if (existing) throw new BadRequestException('Role name already exists');
        role.name = normalized;
      }
    }
    if (payload.description !== undefined) {
      role.description = payload.description;
    }
    return this.rolesRepo.save(role);
  }

  async deleteRole(id: number): Promise<void> {
    const role = await this.rolesRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    const inUse = await this.usersRepo.count({ where: { roleName: role.name } });
    if (inUse > 0) {
      throw new BadRequestException('Cannot delete a role that is assigned to users');
    }
    await this.rolesRepo.delete(id);
  }
}
