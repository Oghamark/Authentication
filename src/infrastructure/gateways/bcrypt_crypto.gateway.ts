import { ICryptoGateway } from 'src/application/interfaces/crypto_gateway';
import { compare, genSalt, hash as bcryptHash } from 'bcrypt';

const saltRounds: number = 10;

/**
 * BcryptCryptoGateway implements the ICryptoGateway interface using bcrypt for password hashing and comparison.
 * It provides methods to hash passwords, compare passwords, and generate salts.
 * This class is designed to be used in applications that require secure password management.
 */
export class BcryptCryptoGateway implements ICryptoGateway {
  async hash(value: string): Promise<string> {
    return await bcryptHash(value, saltRounds);
  }

  async validate(value: string, hashedValue: string): Promise<boolean> {
    return await compare(value, hashedValue);
  }

  async generateSalt(): Promise<string> {
    const saltRounds = 10;
    return await genSalt(saltRounds);
  }
}
