import dotenvFlow from 'dotenv-flow'
import { configureDns } from './configureDns'

dotenvFlow.config()
configureDns()

export default {
    // General
    ENV: process.env.ENV,
    PORT: process.env.PORT ?? '3000',
    SERVER_URL: process.env.SERVER_URL,
    CLIENT_URL: process.env.CLIENT_URL,
    CORS_ORIGINS: process.env.CORS_ORIGINS,

    // Database
    DATABASE_URL: process.env.DATABASE_URL,

    //Email
    EMAIL_API_KEY: process.env.EMAIL_SERVICE_API_KEY,

    //Tokens
    TOKENS: {
        ACCESS: {
            SECRET: process.env.ACCESS_TOKEN_SECRET as string,
            EXPIRY: 3600
        },
        REFRESH: {
            SECRET: process.env.REFRESH_TOKEN_SECRET as string,
            EXPIRY: 3600 * 24 * 365
        }
    }
}
