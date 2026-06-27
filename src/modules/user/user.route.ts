import { NextFunction, Request, Response, Router } from 'express'
import { userController } from './user.controller'
import { jwtUtils } from '../../utils/jwt'
import config from '../../config'
import { Role } from '../../../generated/prisma/enums'
import httpStatus from 'http-status'
import { catchAsync } from '../../utils/catchAsync'
import { JwtPayload } from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'
import { auth } from '../../middlewares/auth'

const router = Router()

router.post('/register', userController.registerUser)

router.get(
  '/me',
  auth(Role.ADMIN, Role.USER, Role.AUTHOR),
  userController.getMyProfile,
)

router.put(
  '/my-profile',
  auth(Role.ADMIN, Role.USER, Role.AUTHOR),
  userController.updateMyProfile,
)

export const userRoutes = router
