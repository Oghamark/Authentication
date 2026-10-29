import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import {
  GetDisplayNamesRequest,
  UserDisplayName,
} from 'src/application/dtos/user/get_display_names_request';
import { IUserRepository } from 'src/application/interfaces/user_repository';
import { IUseCase } from 'src/application/interfaces/use_case';
import { Result } from 'src/core/result';

@Injectable()
export class GetDisplayNamesUseCase implements IUseCase<
  GetDisplayNamesRequest,
  UserDisplayName[]
> {
  constructor(
    @Inject('UserRepository') private readonly userRepository: IUserRepository,
  ) {}

  async execute({
    userIds,
  }: GetDisplayNamesRequest): Promise<Result<UserDisplayName[]>> {
    if (
      !Array.isArray(userIds) ||
      userIds.length > 50 ||
      userIds.some((id) => typeof id !== 'string' || !isUUID(id))
    ) {
      throw new BadRequestException('Display names require at most 50 UUIDs');
    }
    return this.userRepository.findDisplayNames([
      ...new Set(userIds.map((id) => id.toLowerCase())),
    ]);
  }
}
