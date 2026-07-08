import dotenv from 'dotenv';

dotenv.config();

/** Centralised, validated access to environment configuration. */
export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:5000/api/auth/google/callback',
  },
};

/** True only when Supabase credentials are present. */
export const isSupabaseConfigured = Boolean(
  env.supabase.url && env.supabase.serviceRoleKey,
);

/** True only when Google OAuth credentials are present. */
export const isGoogleOAuthConfigured = Boolean(
  env.google.clientId && env.google.clientSecret,
);
