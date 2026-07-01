import jwt from 'jsonwebtoken';
import env from '../config/env';
import User, { IUser, UserRole } from '../models/User';
import ApiError from '../utils/ApiError';

function signAccessToken(user: IUser) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  } as jwt.SignOptions);
}

function signRefreshToken(user: IUser) {
  return jwt.sign({ sub: user._id.toString() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export async function register(input: RegisterInput) {
  const existing = await User.findOne({ email: input.email });
  if (existing) throw ApiError.conflict('Email already registered');

  const user = await User.create(input);

  return {
    user: user.toSafeObject(),
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
}

export async function login(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const isMatch = await user.comparePassword(input.password);
  if (!isMatch) throw ApiError.unauthorized('Invalid email or password');

  return {
    user: user.toSafeObject(),
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
}

export async function refreshAccessToken(refreshToken: string) {
  let decoded: { sub: string };
  try {
    decoded = jwt.verify(refreshToken, env.jwt.refreshSecret) as { sub: string };
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');

  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
}

export async function getProfile(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user.toSafeObject();
}
