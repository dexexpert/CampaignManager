import jwt from "jsonwebtoken";
import { env } from "../env.js";

export type JwtUser = {
  userId: string;
  email: string;
  name: string;
};

export function signAccessToken(user: JwtUser) {
  return jwt.sign(user, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): JwtUser {
  return jwt.verify(token, env.jwtSecret) as JwtUser;
}

