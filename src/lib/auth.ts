
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
    throw new Error("SESSION_SECRET is missing in .env.local");
}

const secretKey = new TextEncoder().encode(SESSION_SECRET);

export type UserRole = "SUPER_ADMIN" | "ADMIN";

export interface SessionPayload {
    userId: string;
    role: UserRole;
}

// Password hashing
export async function hashPassword(password: string) {
    return bcrypt.hash(password, 12);
}

// Password verification
export async function verifyPassword(
    password: string,
    passwordHash: string
) {
    return bcrypt.compare(password, passwordHash);
}

// Create JWT session
export async function createSession(payload: SessionPayload) {
    return new SignJWT({
        role: payload.role,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(payload.userId)
        .setIssuedAt()
        .setExpirationTime("8h")
        .sign(secretKey);
}

// Verify JWT session
export async function verifySession(
    token: string
): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secretKey, {
            algorithms: ["HS256"],
        });

        const userId = payload.sub;
        const role = payload.role;

        if (
            typeof userId !== "string" ||
            (role !== "SUPER_ADMIN" && role !== "ADMIN")
        ) {
            return null;
        }

        return {
            userId,
            role,
        };
    } catch {
        return null;
    }
}
