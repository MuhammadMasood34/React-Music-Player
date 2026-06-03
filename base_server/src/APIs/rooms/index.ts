import { NextFunction, Request, Response } from 'express'
import asyncHandler from '../../handlers/async'
import httpResponse from '../../handlers/httpResponse'
import httpError from '../../handlers/errorHandler/httpError'
import { CustomError } from '../../utils/errors'
import Room from './models/room.model'

const normalizeRoomCode = (code: string): string => code.trim().toUpperCase()

const handleError = (error: unknown, next: NextFunction, request: Request): void => {
    if (error instanceof CustomError) {
        httpError(next, error, request, error.statusCode)
    } else if (error instanceof Error) {
        httpError(next, error, request, 500)
    } else {
        httpError(next, new Error('Unexpected error'), request, 500)
    }
}

export default {
    getByCode: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const code = normalizeRoomCode(request.params.code)
            const room = await Room.findOne({ code, isActive: true })

            if (!room) {
                throw new CustomError('Room not found', 404)
            }

            httpResponse(response, request, 200, 'Room fetched', room)
        } catch (error: unknown) {
            handleError(error, next, request)
        }
    })
}
