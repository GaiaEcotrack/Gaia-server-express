const MonitoringReport = require('../models/MonitoringReport');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');

class ValidationService {
  /**
   * Valida que un proyecto cumpla con los requisitos de Gold Standard
   */
  static async validateProject(projectId) {
    try {
      const project = await Project.findOne({ projectId });
      if (!project) {
        throw new Error('Proyecto no encontrado');
      }

      const validationResults = {
        isValid: true,
        errors: [],
        warnings: [],
        score: 100
      };

      // Validar coordenadas GPS
      if (!project.gpsCoordinates || !project.gpsCoordinates.latitude || !project.gpsCoordinates.longitude) {
        validationResults.errors.push('Coordenadas GPS requeridas');
        validationResults.score -= 20;
      }

      // Validar capacidad instalada
      if (!project.capacityInstalled || project.capacityInstalled <= 0) {
        validationResults.errors.push('Capacidad instalada debe ser mayor a 0');
        validationResults.score -= 15;
      }

      // Validar fecha de inicio
      if (!project.startDate) {
        validationResults.errors.push('Fecha de inicio requerida');
        validationResults.score -= 10;
      }

      // Validar dispositivos
      if (!project.devices || project.devices.length === 0) {
        validationResults.errors.push('Al menos un dispositivo debe estar registrado');
        validationResults.score -= 15;
      }

      // Validar factor de emisión
      if (!project.emissionFactor || project.emissionFactor <= 0) {
        validationResults.errors.push('Factor de emisión debe ser mayor a 0');
        validationResults.score -= 10;
      }

      // Validar fuente del factor de emisión
      if (!project.emissionFactorSource) {
        validationResults.warnings.push('Fuente del factor de emisión no especificada');
        validationResults.score -= 5;
      }

      // Validar tecnología
      if (!project.technologyType || project.technologyType !== 'fotovoltaico') {
        validationResults.warnings.push('Tecnología debe ser fotovoltaica para Gold Standard');
        validationResults.score -= 5;
      }

      // Determinar si es válido
      validationResults.isValid = validationResults.score >= 80 && validationResults.errors.length === 0;

      // Actualizar estado del proyecto
      if (validationResults.isValid) {
        project.goldStandardStatus = 'registered';
        await project.save();
      }

      return validationResults;

    } catch (error) {
      console.error('Error validando proyecto:', error);
      throw error;
    }
  }

  /**
   * Valida que un reporte cumpla con los requisitos para verificación
   */
  static async validateReport(reportId) {
    try {
      const report = await MonitoringReport.findById(reportId);
      if (!report) {
        throw new Error('Reporte no encontrado');
      }

      const validationResults = {
        isValid: true,
        errors: [],
        warnings: [],
        score: 100
      };

      // Validar umbral mínimo de CO2
      if (report.co2Avoided_kg < 1000) {
        validationResults.errors.push('Se requiere mínimo 1000 kg CO2 para verificación');
        validationResults.score -= 30;
      }

      // Validar rango de fechas
      const dateRange = report.endDate - report.startDate;
      const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 año en ms
      if (dateRange > maxRange) {
        validationResults.errors.push('El rango de fechas no puede exceder 1 año');
        validationResults.score -= 20;
      }

      // Validar energía generada
      if (report.energyGenerated_kWh <= 0) {
        validationResults.errors.push('Energía generada debe ser mayor a 0');
        validationResults.score -= 15;
      }

      // Validar factor de emisión
      if (report.emissionFactor <= 0) {
        validationResults.errors.push('Factor de emisión debe ser mayor a 0');
        validationResults.score -= 10;
      }

      // Validar hash del certificado
      if (!report.certificateHash) {
        validationResults.errors.push('Hash del certificado requerido');
        validationResults.score -= 15;
      }

      // Validar metadatos
      if (!report.metadata.gpsCoordinates) {
        validationResults.warnings.push('Coordenadas GPS no especificadas en metadatos');
        validationResults.score -= 5;
      }

      if (!report.metadata.deviceSerial) {
        validationResults.warnings.push('Serial del dispositivo no especificado');
        validationResults.score -= 5;
      }

      // Determinar si es válido
      validationResults.isValid = validationResults.score >= 80 && validationResults.errors.length === 0;

      return validationResults;

    } catch (error) {
      console.error('Error validando reporte:', error);
      throw error;
    }
  }

  /**
   * Valida datos de energía en tiempo real
   */
  static validateEnergyData(energyData) {
    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 100
    };

    if (!Array.isArray(energyData) || energyData.length === 0) {
      validationResults.errors.push('Datos de energía requeridos');
      validationResults.score -= 30;
      validationResults.isValid = false;
      return validationResults;
    }

    // Validar límites por entrada
    energyData.forEach((entry, index) => {
      // Límite máximo por hora (ajustar según tus necesidades)
      if (entry.kwh > 10000) {
        validationResults.errors.push(`Entrada ${index}: kWh excede límite máximo de 10,000`);
        validationResults.score -= 10;
      }

      // Validar timestamp
      if (!entry.timestamp || isNaN(new Date(entry.timestamp).getTime())) {
        validationResults.errors.push(`Entrada ${index}: Timestamp inválido`);
        validationResults.score -= 15;
      }

      // Validar valor de kWh
      if (entry.kwh <= 0) {
        validationResults.errors.push(`Entrada ${index}: kWh debe ser mayor a 0`);
        validationResults.score -= 10;
      }
    });

    // Validar consistencia temporal
    for (let i = 1; i < energyData.length; i++) {
      const currentTime = new Date(energyData[i].timestamp).getTime();
      const previousTime = new Date(energyData[i - 1].timestamp).getTime();
      
      if (currentTime <= previousTime) {
        validationResults.warnings.push(`Entrada ${i}: Timestamp debe ser posterior al anterior`);
        validationResults.score -= 5;
      }
    }

    // Determinar si es válido
    validationResults.isValid = validationResults.score >= 70;

    return validationResults;
  }

  /**
   * Valida factor de emisión por región
   */
  static validateEmissionFactor(emissionFactor, region, source) {
    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 100
    };

    // Validar valor del factor
    if (!emissionFactor || emissionFactor <= 0) {
      validationResults.errors.push('Factor de emisión debe ser mayor a 0');
      validationResults.score -= 30;
    }

    // Validar rango razonable (0.1 - 1.0 kg CO2/kWh)
    if (emissionFactor < 0.1 || emissionFactor > 1.0) {
      validationResults.warnings.push('Factor de emisión fuera del rango típico (0.1 - 1.0)');
      validationResults.score -= 10;
    }

    // Validar fuente
    if (!source) {
      validationResults.warnings.push('Fuente del factor de emisión no especificada');
      validationResults.score -= 10;
    }

    // Validar región
    if (!region) {
      validationResults.warnings.push('Región no especificada');
      validationResults.score -= 5;
    }

    // Determinar si es válido
    validationResults.isValid = validationResults.score >= 80;

    return validationResults;
  }

  /**
   * Valida coordenadas GPS
   */
  static validateGPSCoordinates(latitude, longitude) {
    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 100
    };

    // Validar latitud (-90 a 90)
    if (latitude < -90 || latitude > 90) {
      validationResults.errors.push('Latitud debe estar entre -90 y 90');
      validationResults.score -= 30;
    }

    // Validar longitud (-180 a 180)
    if (longitude < -180 || longitude > 180) {
      validationResults.errors.push('Longitud debe estar entre -180 y 180');
      validationResults.score -= 30;
    }

    // Validar que no sean 0,0 (océano)
    if (latitude === 0 && longitude === 0) {
      validationResults.warnings.push('Coordenadas (0,0) pueden no ser válidas');
      validationResults.score -= 10;
    }

    // Determinar si es válido
    validationResults.isValid = validationResults.score >= 80;

    return validationResults;
  }

  /**
   * Obtiene estadísticas de validación para un usuario
   */
  static async getUserValidationStats(userId) {
    try {
      const projects = await Project.find({ userId });
      const reports = await MonitoringReport.find({ userId });

      const stats = {
        totalProjects: projects.length,
        validProjects: projects.filter(p => p.goldStandardStatus === 'certified').length,
        totalReports: reports.length,
        validReports: reports.filter(r => r.status === 'verified').length,
        pendingReports: reports.filter(r => r.status === 'pending').length,
        submittedReports: reports.filter(r => r.status === 'submitted').length,
        averageValidationScore: 0
      };

      // Calcular score promedio
      if (projects.length > 0) {
        const totalScore = projects.reduce((sum, p) => {
          if (p.goldStandardStatus === 'certified') return sum + 100;
          if (p.goldStandardStatus === 'verified') return sum + 80;
          if (p.goldStandardStatus === 'registered') return sum + 60;
          return sum + 40;
        }, 0);
        stats.averageValidationScore = Math.round(totalScore / projects.length);
      }

      return stats;

    } catch (error) {
      console.error('Error obteniendo estadísticas de validación:', error);
      throw error;
    }
  }
}

module.exports = ValidationService;
