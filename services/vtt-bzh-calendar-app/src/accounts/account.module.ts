import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

const path = 'accounts';

@Module({
  imports: [
    RolesModule,
    AuthModule,
    UsersModule,
    RouterModule.register([
      {
        path,
        module: RolesModule,
      },
      {
        path,
        module: UsersModule,
      },
      {
        path,
        module: AuthModule,
      },
    ]),
  ],
})
export class AccountsModule {}
