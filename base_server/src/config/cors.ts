import config from './config'
import { EApplicationEnvironment } from '../constant/application'

const configuredCorsOrigins = config.CORS_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

export const corsOrigins =
    configuredCorsOrigins?.length
        ? configuredCorsOrigins
        : config.CLIENT_URL
          ? [config.CLIENT_URL]
          : config.ENV === EApplicationEnvironment.DEVELOPMENT
            ? ['http://localhost:5173', 'http://127.0.0.1:5173']
            : []

export const corsMethods = ['GET', 'POST', 'DELETE', 'OPTIONS', 'HEAD', 'PUT', 'PATCH']
