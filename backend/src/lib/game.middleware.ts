import { RecaptchaResponse, RequestWithRecaptcha } from '@/types/custom';
import { NextFunction, Request, Response } from 'express';
import { myConfig } from '@config/env';
import { redisOps } from '@/redis/ops';
import { Socket } from 'socket.io';
import * as cookie from 'cookie';
import { PlayerIdentity } from '@/utils/validation';
import { authService } from '@/services/auth.service';
import { AuthenticatedRequest } from './auth/middleware';


export const sendUserToGame = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {

    const token = req.user?.userId; // Get the session token from the request cookies
  
    if (token) {

        // check with redis if that user is in a game. if so then redirect them to that game shortcode
        console.log("Checking Game For User Authenticated:", token);
    }
    else return next();
};
