import { IsNotEmpty, IsString } from 'class-validator';

export class GetUserByIdRequest {
  @IsNotEmpty()
  @IsString()
  id: string;
}
