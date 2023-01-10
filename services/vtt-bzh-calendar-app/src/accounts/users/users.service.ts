import { Injectable } from '@nestjs/common';
import { Role } from '../roles';
import config from '../../config/default';

// This should be a real class/interface representing a user entity
export type User = any;

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: config().admin.name,
      password: config().admin.password,
      roles: [Role.Admin, Role.Contributor, Role.User],
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }
}
