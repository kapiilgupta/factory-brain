import express from 'express';
import { getMachines, getMachineById, createMachine, updateMachine, deleteMachine } from '../controllers/machineController.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

// Enforce session authentication across all machine endpoints
router.use(authenticateUser);

router
    .route('/')
    .get(getMachines)
    .post(createMachine);

router
    .route('/:id')
    .get(getMachineById)
    .patch(updateMachine)
    .delete(deleteMachine);

export default router;