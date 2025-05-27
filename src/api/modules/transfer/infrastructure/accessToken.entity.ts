import { IsString } from 'class-validator';

export class AccessToken {
  @IsString()
  token!: string;
  @IsString()
  access_id!: string;
}
