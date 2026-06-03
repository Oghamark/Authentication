import { UnauthorizedException } from '@nestjs/common';
import { UserPrincipal } from 'src/application/dtos/user/user_principal';
import { AuthConfig } from 'src/application/interfaces/auth_config_repository';
import { LDAPPropertiesError } from 'src/domain/exceptions/auth.exceptions';

export default class LdapPrincipalMapper {
  static toUserPrincipal(user: unknown, authConfig: AuthConfig): UserPrincipal {
    const { ldapEmailField, ldapNameField, ldapAdminGroup, ldapUserGroup } =
      authConfig;

    const record = user as Record<string, any>;

    const email = record[ldapEmailField ?? 'mail'] as string | undefined;
    const name = record[ldapNameField ?? 'sn'] as string | undefined;

    if (!email) {
      throw new LDAPPropertiesError('email');
    }

    if (!name) {
      throw new LDAPPropertiesError('name');
    }

    const user_groups = (record.memberOf ?? []) as Array<string>;
    if (ldapUserGroup && !user_groups.includes(ldapUserGroup)) {
      throw new UnauthorizedException('User not part of required LDAP group');
    }

    const isAdmin = ldapAdminGroup && user_groups.includes(ldapAdminGroup);

    return {
      id: '',
      provider: 'LDAP',
      email,
      name,
      role: isAdmin ? 'ADMIN' : 'USER',
    };
  }
}
