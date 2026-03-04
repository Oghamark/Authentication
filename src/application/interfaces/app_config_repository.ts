export interface AppConfig {
  signupEnabled: boolean;
}

export interface IAppConfigRepository {
  getConfig(): Promise<AppConfig>;
  setSignupEnabled(signupEnabled: boolean): Promise<void>;
}
