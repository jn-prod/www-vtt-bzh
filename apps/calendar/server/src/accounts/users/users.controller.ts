import { Controller, Request, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get('/profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
