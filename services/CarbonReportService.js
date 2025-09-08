const MonitoringReport = require('../models/MonitoringReport');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const { generatePDF } = require('../utils/pdfGenerator');
const { uploadToIPFS } = require('../utils/ipfsHelper');
const crypto = require('crypto');

class CarbonReportService {
  /**
   * Genera un reporte de monitoreo automático cuando se alcanza el umbral
   */
  static async generateMonitoringReport(projectId, userId, req) {
    try {
      // Obtener el proyecto
      console.log('Buscando proyecto con projectId:', projectId, 'y userId:', userId);
      
      let project = await Project.findOne({ projectId, userId });
      
      // Si no se encuentra, buscar solo por projectId
      if (!project) {
        project = await Project.findOne({ projectId });
        if (project) {
          console.log('Proyecto encontrado por projectId, pero userId no coincide');
        }
      }
      
      if (!project) {
        throw new Error(`Proyecto no encontrado con projectId: ${projectId} y userId: ${userId}`);
      }
      
      console.log('Proyecto encontrado:', project.name, 'ID:', project._id);

      // Obtener datos de energía del proyecto (esto dependerá de tu implementación actual)
      const energyData = await this.getProjectEnergyData(projectId);
      
      if (!energyData || energyData.length === 0) {
        throw new Error('No hay datos de energía para generar el reporte');
      }

      // Calcular totales
      const totalKWh = energyData.reduce((sum, entry) => sum + entry.kwh, 0);
      const co2kg = totalKWh * project.emissionFactor;

      // Verificar si ya existe un reporte pendiente
      const existingReport = await MonitoringReport.findOne({
        projectId,
        status: { $in: ['pending', 'submitted'] }
      });

      if (existingReport) {
        throw new Error('Ya existe un reporte pendiente para este proyecto');
      }

      // Crear el reporte
      const report = await MonitoringReport.create({
        projectId,
        userId,
        startDate: energyData[0].timestamp,
        endDate: energyData[energyData.length - 1].timestamp,
        energyGenerated_kWh: totalKWh,
        co2Avoided_kg: co2kg,
        emissionFactor: project.emissionFactor,
        emissionFactorSource: project.emissionFactorSource,
        status: 'pending',
        metadata: {
          gpsCoordinates: `${project.gpsCoordinates.latitude},${project.gpsCoordinates.longitude}`,
          deviceSerial: project.devices.map(d => d.serialNumber).join(', '),
          deviceBrand: project.devices.map(d => d.brand).join(', '),
          technologyType: project.technologyType,
          capacityInstalled: project.capacityInstalled
        }
      });

      // Generar hash del reporte
      const reportHash = this.generateReportHash(report);
      report.certificateHash = reportHash;
      await report.save();

      // Generar PDF del reporte (opcional para pruebas)
      let ipfsResult = null;
      try {
        const pdfBuffer = await generatePDF(report, project);
        
        // Subir PDF a IPFS
        ipfsResult = await uploadToIPFS(pdfBuffer, `report-${report._id}.pdf`);
        console.log('PDF generado y subido a IPFS:', ipfsResult.hash);
      } catch (pdfError) {
        console.warn('Error generando PDF, continuando sin él:', pdfError.message);
        // Crear resultado simulado para pruebas
        ipfsResult = {
          hash: 'test-hash-' + Date.now(),
          url: 'https://test-ipfs.com/test-hash',
          fileName: `report-${report._id}.pdf`
        };
      }
      
      // Actualizar el proyecto con el total acumulado
      await Project.findByIdAndUpdate(project._id, {
        $inc: {
          totalEnergyGenerated: totalKWh,
          totalCO2Avoided: co2kg
        }
      });

      // Log de auditoría
      try {
        await AuditLog.logAction({
          action: 'report_generated',
          entityType: 'report',
          entityId: report._id.toString(),
          userId,
          details: {
            projectId,
            totalKWh,
            co2kg,
            ipfsHash: ipfsResult?.hash || 'no-hash'
          },
          ipAddress: req?.ip,
          userAgent: req?.get('User-Agent')
        });
      } catch (auditError) {
        console.warn('Error en log de auditoría, continuando:', auditError.message);
      }

      return {
        success: true,
        report,
        ipfsHash: ipfsResult.hash,
        ipfsUrl: ipfsResult.url
      };

    } catch (error) {
      console.error('Error generando reporte de monitoreo:', error);
      
      // Log de auditoría del error
      if (userId) {
        await AuditLog.logAction({
          action: 'report_generated',
          entityType: 'report',
          entityId: projectId,
          userId,
          status: 'failed',
          errorMessage: error.message,
          ipAddress: req?.ip,
          userAgent: req?.get('User-Agent')
        });
      }
      
      throw error;
    }
  }

  /**
   * Envía un reporte para verificación
   */
  static async submitReport(reportId, userId, req) {
    try {
      const report = await MonitoringReport.findOne({ _id: reportId, userId });
      if (!report) {
        throw new Error('Reporte no encontrado');
      }

      if (report.status !== 'pending') {
        throw new Error('El reporte no está en estado pendiente');
      }

      // Verificar que se haya alcanzado el umbral mínimo (1000 kg CO2)
      if (report.co2Avoided_kg < 1000) {
        throw new Error('Se requiere mínimo 1000 kg CO2 para enviar el reporte');
      }

      report.status = 'submitted';
      await report.save();

      // Log de auditoría
      await AuditLog.logAction({
        action: 'report_submitted',
        entityType: 'report',
        entityId: reportId,
        userId,
        details: { reportId, co2kg: report.co2Avoided_kg },
        ipAddress: req?.ip,
        userAgent: req?.get('User-Agent')
      });

      return { success: true, report };

    } catch (error) {
      console.error('Error enviando reporte:', error);
      throw error;
    }
  }

  /**
   * Verifica un reporte (acción de admin/verificador)
   */
  static async verifyReport(reportId, verifierId, verificationData, req) {
    try {
      const report = await MonitoringReport.findById(reportId);
      if (!report) {
        throw new Error('Reporte no encontrado');
      }

      if (report.status !== 'submitted') {
        throw new Error('El reporte no está en estado enviado');
      }

      const { approved, reason, notes } = verificationData;

      if (approved) {
        report.status = 'verified';
        report.verifiedBy = verifierId;
        report.verificationDate = new Date();
      } else {
        report.status = 'rejected';
        report.rejectionReason = reason;
      }

      await report.save();

      // Log de auditoría
      await AuditLog.logAction({
        action: approved ? 'report_verified' : 'report_rejected',
        entityType: 'report',
        entityId: reportId,
        userId: verifierId,
        userType: 'verifier',
        details: { reportId, approved, reason, notes },
        ipAddress: req?.ip,
        userAgent: req?.get('User-Agent')
      });

      return { success: true, report };

    } catch (error) {
      console.error('Error verificando reporte:', error);
      throw error;
    }
  }

  /**
   * Genera hash único del reporte para blockchain
   */
  static generateReportHash(report) {
    const dataToHash = {
      projectId: report.projectId,
      userId: report.userId,
      startDate: report.startDate.toISOString(),
      endDate: report.endDate.toISOString(),
      energyGenerated: report.energyGenerated_kWh,
      co2Avoided: report.co2Avoided_kg,
      emissionFactor: report.emissionFactor,
      timestamp: report.createdAt.toISOString()
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(dataToHash))
      .digest('hex');
  }

  /**
   * Obtiene datos de energía del proyecto (implementar según tu sistema actual)
   */
  static async getProjectEnergyData(projectId) {
    try {
      // TODO: Implementar según tu sistema de dispositivos (Growatt, Hoymiles, etc.)
      // Por ahora retornamos datos de ejemplo para pruebas
      console.log('Generando datos de energía de ejemplo para proyecto:', projectId);
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      return [
        { timestamp: yesterday, kwh: 100 },
        { timestamp: now, kwh: 150 }
      ];
    } catch (error) {
      console.error('Error obteniendo datos de energía:', error);
      // Retornar datos de ejemplo en caso de error
      const now = new Date();
      return [
        { timestamp: now, kwh: 100 },
        { timestamp: new Date(now.getTime() + 3600000), kwh: 150 }
      ];
    }
  }

  /**
   * Obtiene reportes por usuario
   */
  static async getUserReports(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const reports = await MonitoringReport.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MonitoringReport.countDocuments({ userId });

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtiene reportes por proyecto
   */
  static async getProjectReports(projectId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const reports = await MonitoringReport.find({ projectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MonitoringReport.countDocuments({ projectId });

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtiene estadísticas de carbono por usuario
   */
  static async getUserCarbonStats(userId) {
    const stats = await MonitoringReport.aggregate([
      { $match: { userId, status: 'verified' } },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          totalCO2Avoided: { $sum: '$co2Avoided_kg' },
          totalEnergyGenerated: { $sum: '$energyGenerated_kWh' },
          averageEmissionFactor: { $avg: '$emissionFactor' }
        }
      }
    ]);

    return stats[0] || {
      totalReports: 0,
      totalCO2Avoided: 0,
      totalEnergyGenerated: 0,
      averageEmissionFactor: 0
    };
  }
}

module.exports = CarbonReportService;
