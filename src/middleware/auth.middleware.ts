import {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  verifyToken,
  isTokenRevoked,
} from "../utils/jwt";

import {
  sendError,
} from "../helpers/response.helper";

import {
  messages,
} from "../helpers/message.helper";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authorization = req.headers.authorization;

  if (
    !authorization ||
    !authorization.startsWith("Bearer")
  ) {
    sendError(
      res,
      401,
      messages.auth.authenticationRequired
    );
    return;
  }

  const token = authorization.split(" ")[1];

  if (!token || isTokenRevoked(token)) {
    sendError(
      res,
      401,
      messages.auth.authenticationRequired
    );
    return;
  }

  try {
    const payload = verifyToken(token) as any;
    const userId = payload.userId || payload.id;

    if (!userId) {
      sendError(res, 401, messages.auth.authenticationRequired);
      return;
    }

    req.user = {
      id: Number(userId),
      role: payload.role,
    };

    next();
  } catch {
    sendError(
      res,
      401,
      messages.auth.authenticationRequired
    );
  }
};

export const optionalAuthenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authorization = req.headers.authorization;

  if (authorization && authorization.startsWith("Bearer")) {
    const token = authorization.split(" ")[1];
    if (token) {
      try {
        const payload = verifyToken(token);
        req.user = {
          id: payload.userId,
          role: payload.role,
        };
      } catch {
        // Ignore token errors for optional authentication
      }
    }
  }

  next();
};
