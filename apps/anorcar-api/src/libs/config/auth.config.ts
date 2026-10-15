import type { CookieOptions } from 'express';

export const ACCESS_TOKEN_SECONDS = 15 * 60;
export const REFRESH_TOKEN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;
export const REFRESH_COOKIE_NAME = 'anorcar_refresh';

export const clientOrigins = (): string[] =>
	(process.env.CLIENT_ORIGINS ?? 'http://localhost:3000,http://localhost:3001')
		.split(',')
		.map((value) => value.trim())
		.filter(Boolean);

export const refreshCookieOptions = (): CookieOptions => {
	const sameSite = process.env.REFRESH_COOKIE_SAME_SITE ?? 'lax';
	if (!['lax', 'strict', 'none'].includes(sameSite)) throw new Error('Invalid REFRESH_COOKIE_SAME_SITE');
	return {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production' || sameSite === 'none',
		sameSite: sameSite as 'lax' | 'strict' | 'none',
		path: '/graphql',
	};
};
