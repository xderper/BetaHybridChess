import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface UserJwtPayload extends JWTPayload {
  id: string;
  role: string;
  login: string;
}

export async function createToken(payload: UserJwtPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(new TextEncoder().encode(JWT_SECRET));
  
  return token;
}

export async function verifyToken(token: string) {
  try {
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );
    
    return verified.payload as UserJwtPayload;
  } catch (err) {
    throw new Error('Invalid token');
  }
}

export async function getUser(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  
  try {
    return await verifyToken(token);
  } catch (err) {
    return null;
  }
}

export function getUserFromCookies() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  
  try {
    return verifyToken(token);
  } catch (err) {
    return null;
  }
}
