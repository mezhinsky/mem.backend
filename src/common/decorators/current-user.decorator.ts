import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { GatewayUser } from '../guards/gateway-auth.guard';

export const CurrentUser = createParamDecorator(
  (data: keyof GatewayUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
