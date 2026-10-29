import {
  ExecutionContext,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { SocialSearchRateGuard } from './social_search_rate.guard';

describe('SocialSearchRateGuard', () => {
  const setHeader = jest.fn();
  const context = (id?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: id ? { id } : undefined }),
        getResponse: () => ({ setHeader }),
      }),
    }) as ExecutionContext;
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('requires the verified account', () => {
    expect(() => new SocialSearchRateGuard().canActivate(context())).toThrow(
      UnauthorizedException,
    );
  });

  it('limits accounts independently with retry guidance and expires the window', () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const guard = new SocialSearchRateGuard();
    for (let i = 0; i < 30; i++)
      expect(guard.canActivate(context('alice'))).toBe(true);
    try {
      guard.canActivate(context('alice'));
      throw new Error('Expected throttling');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
    }
    expect(setHeader).toHaveBeenCalledWith('Retry-After', 60);
    expect(guard.canActivate(context('bob'))).toBe(true);
    clock.mockReturnValue(61000);
    expect(guard.canActivate(context('alice'))).toBe(true);
  });

  it('bounds stored account windows without evicting active throttles', () => {
    const guard = new SocialSearchRateGuard();
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    for (let i = 0; i < 10000; i++) guard.canActivate(context(String(i)));
    expect(() => guard.canActivate(context('overflow'))).toThrow(
      'Account search is busy',
    );
    expect(guard.canActivate(context('0'))).toBe(true);
  });
});
