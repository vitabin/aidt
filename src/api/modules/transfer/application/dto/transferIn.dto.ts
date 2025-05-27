import { Role } from 'src/libs/decorators/role.enum';
import { UserStatus } from '../../infrastructure/userStatus.entity';
import { IsEnum, IsNumber, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { AccessToken } from '../../infrastructure/accessToken.entity';
import { TransferData } from '../../infrastructure/transferData.entity';

export class TransferDto {
  @ValidateNested()
  access_token!: AccessToken;
  @IsString()
  @IsUrl()
  api_domain!: string;
  @IsEnum(Role)
  user_type!: Role;
  @IsEnum(UserStatus)
  user_status!: UserStatus;
  @IsString()
  user_id!: string;
  @IsString()
  @IsOptional()
  lecture_code?: string;
  @IsString()
  @IsOptional()
  class_code?: string;
  @IsString()
  @IsOptional()
  class_period?: string;
  @IsOptional()
  @ValidateNested({ each: true })
  data?: TransferData[];
  @IsNumber()
  @IsOptional()
  count?: number;
}
