import '../config/config'
import { createServer } from 'http'
import app from '../app'
import { bootstrap } from '../bootstrap'
import config from '../config/config'
import logger from '../handlers/logger'
import { initializeRoomSocket } from '../socket/roomSocket'

const server = createServer(app)
initializeRoomSocket(server)

server.listen(config.PORT)
void (async () => {
    try {
        await bootstrap().then(() => {
            logger.info(`Application started on port ${config.PORT}`, {
                meta: { SERVER_URL: config.SERVER_URL }
            })
        })
    } catch (error) {
        logger.error(`Error starting server:`, { meta: error })
        server.close((err) => {
            if (err) logger.error(`error`, { meta: error })

            process.exit(1)
        })
    }
})()
