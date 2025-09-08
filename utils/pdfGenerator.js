const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

class PDFGenerator {
  /**
   * Genera un PDF del reporte de monitoreo según estándares Gold Standard
   */
  static async generatePDF(report, project) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Iniciando generación de PDF para reporte:', report._id);
        
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          console.log('PDF generado exitosamente, tamaño:', Buffer.concat(chunks).length);
          resolve(Buffer.concat(chunks));
        });

        try {
          // Generar QR code con el hash del certificado
          const qrCodeDataUrl = await QRCode.toDataURL(report.certificateHash || 'test-hash', {
            width: 100,
            margin: 2
          });

          console.log('QR code generado exitosamente');

          // Encabezado
          PDFGenerator.addHeader(doc, report, project);
          
          // Información del proyecto
          PDFGenerator.addProjectInfo(doc, project);
          
          // Detalles del reporte
          PDFGenerator.addReportDetails(doc, report);
          
          // Metadatos técnicos
          PDFGenerator.addTechnicalMetadata(doc, report);
          
          // QR Code y hash
          PDFGenerator.addQRCodeAndHash(doc, qrCodeDataUrl, report.certificateHash || 'test-hash');
          
          // Pie de página
          PDFGenerator.addFooter(doc);

          console.log('Contenido del PDF agregado exitosamente');
          doc.end();

        } catch (pdfError) {
          console.error('Error generando contenido del PDF:', pdfError);
          // Generar PDF básico en caso de error
          doc.fontSize(16).text('Reporte de Carbono GAIA', { align: 'center' });
          doc.moveDown(1);
          doc.fontSize(12).text(`Proyecto: ${project.name || 'N/A'}`);
          doc.fontSize(12).text(`CO2 Evitado: ${report.co2Avoided_kg || 0} kg`);
          doc.end();
        }

      } catch (error) {
        console.error('Error general en generación de PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Agrega el encabezado del documento
   */
  static addHeader(doc, report, project) {
    // Logo o título de la empresa
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('GAIA - Gold Standard', { align: 'center' });
    
    doc.moveDown(0.5);
    
    doc.fontSize(16)
       .font('Helvetica')
       .text('Reporte de Monitoreo de Carbono', { align: 'center' });
    
    doc.moveDown(0.5);
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Fecha de Generación: ${new Date().toLocaleDateString('es-CO')}`, { align: 'center' });
    
    doc.moveDown(1);
    
    // Línea separadora
    doc.moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .stroke();
    
    doc.moveDown(1);
  }

  /**
   * Agrega información del proyecto
   */
  static addProjectInfo(doc, project) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DEL PROYECTO');
    
    doc.moveDown(0.5);
    
    const projectInfo = [
      { label: 'ID del Proyecto:', value: project.projectId },
      { label: 'Nombre:', value: project.name },
      { label: 'Tecnología:', value: project.technologyType },
      { label: 'Capacidad Instalada:', value: `${project.capacityInstalled} ${project.capacityUnit}` },
      { label: 'Fecha de Inicio:', value: project.startDate.toLocaleDateString('es-CO') },
      { label: 'Estado Gold Standard:', value: project.goldStandardStatus }
    ];

    projectInfo.forEach(info => {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text(info.label, { continued: true })
         .font('Helvetica')
         .text(` ${info.value}`);
    });

    doc.moveDown(0.5);
    
    // Coordenadas GPS
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Coordenadas GPS:', { continued: true })
       .font('Helvetica')
       .text(` ${project.gpsCoordinates.latitude}, ${project.gpsCoordinates.longitude}`);
    
    doc.moveDown(1);
  }

  /**
   * Agrega detalles del reporte
   */
  static addReportDetails(doc, report) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('DETALLES DEL REPORTE');
    
    doc.moveDown(0.5);
    
    const reportInfo = [
      { label: 'ID del Reporte:', value: report._id.toString() },
      { label: 'Período de Monitoreo:', value: `${report.startDate.toLocaleDateString('es-CO')} - ${report.endDate.toLocaleDateString('es-CO')}` },
      { label: 'Energía Generada:', value: `${report.energyGenerated_kWh.toLocaleString('es-CO')} kWh` },
      { label: 'CO₂ Evitado:', value: `${report.co2Avoided_kg.toLocaleString('es-CO')} kg` },
      { label: 'Factor de Emisión:', value: `${report.emissionFactor} kg CO₂/kWh` },
      { label: 'Fuente del Factor:', value: report.emissionFactorSource },
      { label: 'Estado:', value: report.status }
    ];

    reportInfo.forEach(info => {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text(info.label, { continued: true })
         .font('Helvetica')
         .text(` ${info.value}`);
    });

    doc.moveDown(1);
  }

  /**
   * Agrega metadatos técnicos
   */
  static addTechnicalMetadata(doc, report) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('METADATOS TÉCNICOS');
    
    doc.moveDown(0.5);
    
    const metadata = [
      { label: 'Dispositivos:', value: report.metadata.deviceSerial || 'No especificado' },
      { label: 'Marca:', value: report.metadata.deviceBrand || 'No especificado' },
      { label: 'Tecnología:', value: report.metadata.technologyType },
      { label: 'Capacidad:', value: `${report.metadata.capacityInstalled} kWp` }
    ];

    metadata.forEach(info => {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text(info.label, { continued: true })
         .font('Helvetica')
         .text(` ${info.value}`);
    });

    doc.moveDown(1);
  }

  /**
   * Agrega QR code y hash del certificado
   */
  static addQRCodeAndHash(doc, qrCodeDataUrl, certificateHash) {
    // QR Code
    doc.image(qrCodeDataUrl, doc.x, doc.y, { width: 100, height: 100 });
    
    doc.moveDown(1);
    
    // Hash del certificado
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Hash del Certificado:');
    
    doc.fontSize(8)
       .font('Helvetica')
       .text(certificateHash, { align: 'center' });
    
    doc.moveDown(1);
  }

  /**
   * Agrega pie de página
   */
  static addFooter(doc) {
    // Línea separadora
    doc.moveTo(50, doc.page.height - 100)
       .lineTo(545, doc.page.height - 100)
       .stroke();
    
    doc.moveDown(1);
    
    doc.fontSize(8)
       .font('Helvetica')
       .text('Este documento ha sido generado automáticamente por el sistema GAIA.', { align: 'center' });
    
    doc.moveDown(0.5);
    
    doc.text('Para verificar la autenticidad, escanee el código QR o verifique el hash del certificado.', { align: 'center' });
    
    doc.moveDown(0.5);
    
    doc.text('© 2025 GAIA - Sistema de Créditos de Carbono Gold Standard', { align: 'center' });
  }

  /**
   * Genera un PDF de certificado verificado
   */
  static async generateVerifiedCertificate(report, project, verifierInfo) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Generar QR code
        const qrCodeDataUrl = await QRCode.toDataURL(report.certificateHash, {
          width: 120,
          margin: 2
        });

        // Encabezado del certificado
        PDFGenerator.addCertificateHeader(doc);
        
        // Información del proyecto
        PDFGenerator.addProjectInfo(doc, project);
        
        // Información de verificación
        PDFGenerator.addVerificationInfo(doc, report, verifierInfo);
        
        // QR Code y hash
        PDFGenerator.addQRCodeAndHash(doc, qrCodeDataUrl, report.certificateHash);
        
        // Pie de página del certificado
        PDFGenerator.addCertificateFooter(doc);

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Encabezado del certificado
   */
  static addCertificateHeader(doc) {
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .text('CERTIFICADO VERIFICADO', { align: 'center' });
    
    doc.moveDown(0.5);
    
    doc.fontSize(16)
       .font('Helvetica')
       .text('Gold Standard - Créditos de Carbono', { align: 'center' });
    
    doc.moveDown(1);
    
    // Línea separadora
    doc.moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .stroke();
    
    doc.moveDown(1);
  }

  /**
   * Información de verificación
   */
  static addVerificationInfo(doc, report, verifierInfo) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DE VERIFICACIÓN');
    
    doc.moveDown(0.5);
    
    const verificationInfo = [
      { label: 'Verificado por:', value: verifierInfo.name || 'Verificador Autorizado' },
      { label: 'Fecha de Verificación:', value: report.verificationDate.toLocaleDateString('es-CO') },
      { label: 'Estado:', value: 'VERIFICADO Y APROBADO' },
      { label: 'CO₂ Certificado:', value: `${report.co2Avoided_kg.toLocaleString('es-CO')} kg` }
    ];

    verificationInfo.forEach(info => {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text(info.label, { continued: true })
         .font('Helvetica')
         .text(` ${info.value}`);
    });

    doc.moveDown(1);
  }

  /**
   * Pie de página del certificado
   */
  static addCertificateFooter(doc) {
    // Línea separadora
    doc.moveTo(50, doc.page.height - 100)
       .lineTo(545, doc.page.height - 100)
       .stroke();
    
    doc.moveDown(1);
    
    doc.fontSize(8)
       .font('Helvetica')
       .text('Este certificado ha sido verificado y aprobado según los estándares Gold Standard.', { align: 'center' });
    
    doc.moveDown(0.5);
    
    doc.text('El proyecto cumple con todos los requisitos de certificación para créditos de carbono VERs.', { align: 'center' });
    
    doc.moveDown(0.5);
    
    doc.text('© 2025 GAIA - Sistema de Créditos de Carbono Gold Standard', { align: 'center' });
  }
}

module.exports = PDFGenerator;
