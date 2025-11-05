import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../../utils/logger/index.js';

const logger = createLogger('logs-api');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function logsRoutes() {
  const router = express.Router();
  
  // Get all logs
  router.get('/', async (req, res) => {
    try {
      const logDir = path.join(__dirname, '../../../../logs');
      
      // Ensure the logs directory exists
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
        logger.info(`Created logs directory at ${logDir}`);
        return res.json({ logs: [] });
      }
      
      const logFile = path.join(logDir, 'app.log');
      
      // Check if the log file exists
      if (!fs.existsSync(logFile)) {
        logger.info(`Log file does not exist at ${logFile}`);
        return res.json({ logs: [] });
      }
      
      // Read the log file
      const logs = fs.readFileSync(logFile, 'utf8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (err) {
            return { raw: line, parseError: true };
          }
        });
      
      res.json({ logs });
    } catch (error) {
      logger.error(`Error retrieving logs: ${error.message}`);
      res.status(500).json({ error: 'Failed to retrieve logs', details: error.message });
    }
  });
  
  // Get logs by component
  router.get('/component/:component', async (req, res) => {
    try {
      const { component } = req.params;
      const logDir = path.join(__dirname, '../../../../logs');
      const logFile = path.join(logDir, 'app.log');
      
      if (!fs.existsSync(logFile)) {
        return res.json({ logs: [] });
      }
      
      const logs = fs.readFileSync(logFile, 'utf8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (err) {
            return { raw: line, parseError: true };
          }
        })
        .filter(log => log.component === component);
      
      res.json({ logs });
    } catch (error) {
      logger.error(`Error retrieving logs for component ${req.params.component}: ${error.message}`);
      res.status(500).json({ error: 'Failed to retrieve logs', details: error.message });
    }
  });
  
  // Health check endpoint
  router.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
  
  return router;
}
