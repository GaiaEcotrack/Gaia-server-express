const Project = require('../models/Project');
const MonitoringReport = require('../models/MonitoringReport');
const CarbonReportService = require('../services/CarbonReportService');
const ValidationService = require('../services/ValidationService');
const AuditLog = require('../models/AuditLog');
const { executeCommand } = require('./sailsController');

class CarbonController {
  /**
   * Crear un nuevo proyecto de carbono
   */
  static async createProject(req, res) {
    try {
      const {
        name,
        description,
        gpsCoordinates,
        technologyType,
        capacityInstalled,
        startDate,
        devices
      } = req.body;

      // Obtener userId del token o del body
      let userId = req.user?.id || req.body.userId;
      
      // Si no hay userId, usar uno de prueba para desarrollo
      if (!userId) {
        console.warn('No se encontró userId en token, usando ID de prueba');
        userId = 'test-user-123'; // ID de prueba para desarrollo
      }

      // Validar coordenadas GPS
      const gpsValidation = ValidationService.validateGPSCoordinates(
        gpsCoordinates.latitude,
        gpsCoordinates.longitude
      );

      if (!gpsValidation.isValid) {
        return res.status(400).json({
          success: false,
          errors: gpsValidation.errors,
          warnings: gpsValidation.warnings
        });
      }

      // Generar projectId manualmente
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substr(2, 5);
      const projectId = `GS-${userId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase();

      // Crear el proyecto
      const project = await Project.create({
        projectId,
        userId,
        name,
        description,
        gpsCoordinates,
        technologyType: technologyType || 'fotovoltaico',
        capacityInstalled,
        capacityUnit: 'kWp',
        startDate: new Date(startDate),
        devices: devices || [],
        emissionFactor: 0.4, // Por defecto para Colombia
        emissionFactorSource: 'Colombia - Resolución oficial'
      });

      // Log de auditoría
      await AuditLog.logAction({
        action: 'project_created',
        entityType: 'project',
        entityId: project._id.toString(),
        userId,
        details: { projectId: project.projectId, name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        project,
        message: 'Proyecto creado exitosamente'
      });

    } catch (error) {
      console.error('Error creando proyecto:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtener proyectos de un usuario
   */
  static async getUserProjects(req, res) {
    try {
      const userId = req.params.userId || req.user?.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const projects = await Project.find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Project.countDocuments({ userId });

      res.status(200).json({
        success: true,
        projects,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Error obteniendo proyectos:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtener un proyecto específico
   */
  static async getProject(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      const project = await Project.findOne({ projectId });
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Proyecto no encontrado'
        });
      }

      // Verificar acceso del usuario
      if (project.userId !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para acceder a este proyecto'
        });
      }

      res.status(200).json({
        success: true,
        project
      });

    } catch (error) {
      console.error('Error obteniendo proyecto:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Actualizar un proyecto
   */
  static async updateProject(req, res) {
    try {
      const { projectId } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;

      const project = await Project.findOne({ projectId });
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Proyecto no encontrado'
        });
      }

      // Verificar permisos
      if (project.userId !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para modificar este proyecto'
        });
      }

      // Validar coordenadas si se actualizan
      if (updateData.gpsCoordinates) {
        const gpsValidation = ValidationService.validateGPSCoordinates(
          updateData.gpsCoordinates.latitude,
          updateData.gpsCoordinates.longitude
        );

        if (!gpsValidation.isValid) {
          return res.status(400).json({
            success: false,
            errors: gpsValidation.errors,
            warnings: gpsValidation.warnings
          });
        }
      }

      // Actualizar proyecto
      const updatedProject = await Project.findByIdAndUpdate(
        project._id,
        updateData,
        { new: true, runValidators: true }
      );

      // Log de auditoría
      await AuditLog.logAction({
        action: 'project_updated',
        entityType: 'project',
        entityId: project._id.toString(),
        userId,
        details: { projectId, changes: updateData },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        project: updatedProject,
        message: 'Proyecto actualizado exitosamente'
      });

    } catch (error) {
      console.error('Error actualizando proyecto:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Generar reporte de monitoreo
   */
  static async generateReport(req, res) {
    try {
      const { projectId } = req.params;
      let userId = req.user?.id || req.body.userId;

      // Si no hay userId, usar uno de prueba para desarrollo
      if (!userId) {
        console.warn('No se encontró userId en token, usando ID de prueba');
        userId = 'test-user-123';
      }

      const result = await CarbonReportService.generateMonitoringReport(projectId, userId, req);

      res.status(200).json(result);

    } catch (error) {
      console.error('Error generando reporte:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Enviar reporte para verificación
   */
  static async submitReport(req, res) {
    try {
      const { reportId } = req.params;
      const userId = req.body.userId;

      const result = await CarbonReportService.submitReport(reportId, userId, req);

      res.status(200).json(result);

    } catch (error) {
      console.error('Error enviando reporte:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Verificar reporte (admin/verificador)
   */
  static async verifyReport(req, res) {
    try {
      const { reportId } = req.params;
      const { approved, reason, notes } = req.body;
      const verifierId = req.user?.id;

      if (!req.user?.role || !['admin', 'verifier'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para verificar reportes'
        });
      }

      const result = await CarbonReportService.verifyReport(
        reportId,
        verifierId,
        { approved, reason, notes },
        req
      );

      res.status(200).json(result);

    } catch (error) {
      console.error('Error verificando reporte:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtener reportes de un usuario
   */
  static async getUserReports(req, res) {
    try {
      const userId = req.params.userId || req.user?.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await CarbonReportService.getUserReports(userId, page, limit);

      res.status(200).json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Error obteniendo reportes:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtener reportes de un proyecto
   */
  static async getProjectReports(req, res) {
    try {
      const { projectId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await CarbonReportService.getProjectReports(projectId, page, limit);

      res.status(200).json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Error obteniendo reportes del proyecto:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de carbono de un usuario
   */
  static async getUserCarbonStats(req, res) {
    try {
      const userId = req.params.userId || req.user?.id;

      const stats = await CarbonReportService.getUserCarbonStats(userId);

      res.status(200).json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas de carbono:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Validar un proyecto
   */
  static async validateProject(req, res) {
    try {
      const { projectId } = req.params;

      const validationResults = await ValidationService.validateProject(projectId);

      res.status(200).json({
        success: true,
        validation: validationResults
      });

    } catch (error) {
      console.error('Error validando proyecto:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Validar un reporte
   */
  static async validateReport(req, res) {
    try {
      const { reportId } = req.params;

      const validationResults = await ValidationService.validateReport(reportId);

      res.status(200).json({
        success: true,
        validation: validationResults
      });

    } catch (error) {
      console.error('Error validando reporte:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de validación de un usuario
   */
  static async getUserValidationStats(req, res) {
    try {
      const userId = req.params.userId || req.user?.id;

      const stats = await ValidationService.getUserValidationStats(userId);

      res.status(200).json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas de validación:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Tokenizar crédito de carbono en blockchain
   */
  static async tokenizeCarbonCredit(req, res) {
    try {
      const { reportId } = req.params;
      const userId = req.user?.id;

      // Obtener el reporte verificado
      const report = await MonitoringReport.findOne({ _id: reportId, userId });
      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Reporte no encontrado'
        });
      }

      if (report.status !== 'verified') {
        return res.status(400).json({
          success: false,
          error: 'Solo se pueden tokenizar reportes verificados'
        });
      }

      // Obtener el proyecto
      const project = await Project.findOne({ projectId: report.projectId });
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Proyecto no encontrado'
        });
      }

      // Convertir kg a toneladas
      const co2Tonnes = Math.floor(report.co2Avoided_kg / 1000);

      // Llamar al smart contract para tokenizar
      const blockchainResult = await executeCommand(
        'GaiaService',
        'TokenizeCarbonCredit',
        [
          report.projectId,
          co2Tonnes,
          report.certificateHash,
          'GAIA-Verifier', // Nombre del verificador
          report.metadata.gpsCoordinates,
          userId, // Recipiente
          Math.floor(report.startDate.getTime() / 1000), // Timestamp en segundos
          Math.floor(report.endDate.getTime() / 1000)
        ]
      );

      // Log de auditoría
      await AuditLog.logAction({
        action: 'carbon_credit_tokenized',
        entityType: 'carbon_credit',
        entityId: report._id.toString(),
        userId,
        details: {
          reportId,
          projectId: report.projectId,
          co2Tonnes,
          certificateHash: report.certificateHash,
          blockchainResult
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        message: 'Crédito de carbono tokenizado exitosamente',
        co2Tonnes,
        certificateHash: report.certificateHash,
        blockchainResult
      });

    } catch (error) {
      console.error('Error tokenizando crédito de carbono:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Generar reporte de prueba (sin autenticación)
   */
  static async generateTestReport(req, res) {
    try {
      const { projectId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId es requerido para generar reporte de prueba'
        });
      }

      const result = await CarbonReportService.generateMonitoringReport(projectId, userId, req);

      res.status(200).json(result);

    } catch (error) {
      console.error('Error generando reporte de prueba:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Crear proyecto de prueba (sin autenticación)
   */
  static async createTestProject(req, res) {
    try {
      const {
        name,
        description,
        gpsCoordinates,
        technologyType,
        capacityInstalled,
        startDate,
        devices,
        userId
      } = req.body;

      // Validar que se proporcione userId
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId es requerido para proyectos de prueba'
        });
      }

      // Validar coordenadas GPS
      const gpsValidation = ValidationService.validateGPSCoordinates(
        gpsCoordinates.latitude,
        gpsCoordinates.longitude
      );

      if (!gpsValidation.isValid) {
        return res.status(400).json({
          success: false,
          errors: gpsValidation.errors,
          warnings: gpsValidation.warnings
        });
      }

      // Generar projectId manualmente
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substr(2, 5);
      const projectId = `GS-${userId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase();

      // Crear el proyecto
      const project = await Project.create({
        projectId,
        userId,
        name,
        description,
        gpsCoordinates,
        technologyType: technologyType || 'fotovoltaico',
        capacityInstalled,
        capacityUnit: 'kWp',
        startDate: new Date(startDate),
        devices: devices || [],
        emissionFactor: 0.4,
        emissionFactorSource: 'Colombia - Resolución oficial'
      });

      // Log de auditoría
      await AuditLog.logAction({
        action: 'project_created',
        entityType: 'project',
        entityId: project._id.toString(),
        userId,
        details: { projectId: project.projectId, name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        project,
        message: 'Proyecto de prueba creado exitosamente'
      });

    } catch (error) {
      console.error('Error creando proyecto de prueba:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = CarbonController;
