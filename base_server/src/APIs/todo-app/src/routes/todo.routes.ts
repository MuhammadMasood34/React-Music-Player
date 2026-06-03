import { Router } from 'express'
import authenticate from '../../../../middlewares/authenticate'
import todoController from '../index'

const router = Router()

// authenticate is your existing middleware — zero changes needed
router.use(authenticate)

router.route('/').get(todoController.getAll)
router.route('/').post(todoController.create)
router.route('/:id').patch(todoController.update)
router.route('/:id').delete(todoController.remove)

export default router