import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class GetDisplayNamesRequest {
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  userIds: string[];
}

export interface UserDisplayName {
  id: string;
  name: string;
}
