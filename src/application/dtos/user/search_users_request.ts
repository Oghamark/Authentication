import { IsString } from 'class-validator';

export class SearchUsersRequest {
  @IsString()
  query: string;
}
