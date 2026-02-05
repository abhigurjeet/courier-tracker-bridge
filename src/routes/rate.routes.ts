const express = require('express');
import { RateController } from '../controllers/rate.controller';

const router = express.Router();
const rateController = new RateController();

router.post('/rates', rateController.getRates);

router.get('/carriers', rateController.getCarriers);

export default router;
