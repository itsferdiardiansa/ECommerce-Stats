import { Global, Module } from '@nestjs/common'
import { JwtModule as NestJwtModule } from '@nestjs/jwt'
import { JwtService } from './jwt.service'

@Global()
@Module({
  imports: [NestJwtModule.register({})],
  providers: [JwtService],
  exports: [JwtService],
})
export class JwtModule {}
