const express = require('express');
const router = express.Router();
const CarbonController = require('../controllers/carbonController');
const authMiddleware = require('../middlewares/authMiddleware');

// Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// Rutas de proyectos
router.post('/projects', CarbonController.createProject);

// Ruta de prueba sin autenticación
router.post('/projects/test', CarbonController.createTestProject);
router.get('/projects/user/:userId?', CarbonController.getUserProjects);
router.get('/projects/:projectId', CarbonController.getProject);
router.put('/projects/:projectId', CarbonController.updateProject);

// Rutas de reportes
router.post('/projects/:projectId/reports', CarbonController.generateReport);
router.post('/projects/:projectId/reports/test', CarbonController.generateTestReport);
router.put('/reports/:reportId/submit', CarbonController.submitReport);
router.put('/reports/:reportId/verify', CarbonController.verifyReport);
router.get('/reports/user/:userId?', CarbonController.getUserReports);
router.get('/reports/project/:projectId', CarbonController.getProjectReports);

// Rutas de validación
router.post('/projects/:projectId/validate', CarbonController.validateProject);
router.post('/reports/:reportId/validate', CarbonController.validateReport);
router.get('/validation/stats/:userId?', CarbonController.getUserValidationStats);

// Rutas de estadísticas
router.get('/stats/carbon/:userId?', CarbonController.getUserCarbonStats);

// Rutas de blockchain
router.post('/reports/:reportId/tokenize', CarbonController.tokenizeCarbonCredit);

module.exports = router;
