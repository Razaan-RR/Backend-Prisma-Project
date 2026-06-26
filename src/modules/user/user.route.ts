import { NextFunction, Request, Response, Router } from 'express'
import { userController } from './user.controller'
import { jwtUtils } from '../../utils/jwt'
import config from '../../config'
import { Role } from '../../../generated/prisma/enums'
import httpStatus from 'http-status'
import { catchAsync } from '../../utils/catchAsync'
import { JwtPayload } from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'

const router = Router()

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string
        name: string
        id: string
        role: Role
      }
    }
  }
}

router.post('/register', userController.registerUser)

const auth = (...requiredRoles: Role[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token =
      req.cookies.accessToken 
    //   || req.headers.authorization?.startsWith('Bearer')
    //     ? req.headers.authorization?.split(' ')[1]
    //     : req.headers.authorization

    if (!token) {
      throw new Error('Login first')
    }

    const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret)

    if (!verifiedToken.success) {
      throw new Error('verifiedToken')
    }
    const { email, name, id, role } = verifiedToken.data as JwtPayload

    if (!requiredRoles.includes(role)) {
      throw new Error('You dont have permission to access')
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        id,
        email,
        name,
        role,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.activeStatus === 'BLOCKED') {
      throw new Error('Account blocked. Please contact support')
    }

    req.user = {
      email,
      name,
      id,
      role,
    }
    next()
  })
}

router.get(
  '/me',

  auth(Role.ADMIN, Role.USER, Role.AUTHOR),

  userController.getMyProfile,
)

export const userRoutes = router
