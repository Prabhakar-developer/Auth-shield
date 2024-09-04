import type { User } from '../user';

export interface JwtPayload {
  id: string;
  email: string;
  sub: string;
  username: string;
}

export type Payload = Omit<User, 'email'>;
