import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

// Define a Base User Class that mirrors the Prisma Model
export class UserEntity {
  @IsInt()
  id: number;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  username: string | null;

  @IsString()
  @IsOptional()
  passwordHash: string | null;

  @IsString()
  @IsOptional()
  name: string | null;

  @IsString()
  @IsOptional()
  avatar: string | null;

  @IsString()
  @IsOptional()
  phone: string | null;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  emailVerifiedAt: Date | null;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  phoneVerifiedAt: Date | null;

  @IsBoolean()
  isActive: boolean;

  @IsBoolean()
  isStaff: boolean;

  @IsBoolean()
  isTwoFactorEnabled: boolean;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  lastLoginAt: Date | null;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  passwordChangedAt: Date | null;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  deletedAt: Date | null;
}
