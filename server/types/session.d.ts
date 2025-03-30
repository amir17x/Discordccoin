/**
 * تعریف تایپ برای session در express
 */

import 'express-session';

declare module 'express-session' {
  interface SessionData {
    isAuthenticated?: boolean;
    isAdmin?: boolean;
    user?: {
      id: string;
      discordId: string;
      username: string;
    };
    returnTo?: string;
  }
}