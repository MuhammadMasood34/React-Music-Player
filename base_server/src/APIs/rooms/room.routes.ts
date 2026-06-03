import { Router } from 'express'
import roomController from './index'

const router = Router()

router.route('/:code').get(roomController.getByCode)

export default router
