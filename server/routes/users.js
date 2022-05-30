import express from 'express';
import * as controller from '../controllers/users.js';
import authenticate from '../middlewares/auth.js';

const router = express.Router();

router.post("/signin", authenticate, controller.signin)
    .post("/signup", authenticate, controller.signup);

export default router;
