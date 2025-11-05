import express from 'express';

export default function testRoutes() {
  const router = express.Router();
  
  router.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is working properly', timestamp: new Date().toISOString() });
  });
  
  return router;
}
