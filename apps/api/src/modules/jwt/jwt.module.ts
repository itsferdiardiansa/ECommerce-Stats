import { Global, Module } from '@nestjs/common'
import { JwtModule as NestJwtModule } from '@nestjs/jwt'
import { JwtService } from './jwt.service'
import { TokenDenylistService } from './token-denylist.service'

@Global()
@Module({
  imports: [NestJwtModule.register({})],
  providers: [JwtService, TokenDenylistService],
  exports: [JwtService, TokenDenylistService],
})
export class JwtModule {}
