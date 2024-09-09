import type { User } from '../../user/interfaces/user';

export interface JwtPayload {
  id: string;
  email: string;
  sub: string;
  username: string;
}

export type Payload = Omit<User, 'email'>;
