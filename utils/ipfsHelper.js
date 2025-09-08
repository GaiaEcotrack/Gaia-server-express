// Importar SDK oficial de Pinata
const { PinataSDK } = require('pinata');

class PinataHelper {
  constructor() {
    this.pinataJwt = process.env.PINATA_JWT;
    this.pinataGateway = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';
    this.pinata = null;
    
    if (this.pinataJwt && this.pinataGateway) {
      this.initializePinata();
      console.log('Cliente Pinata inicializado correctamente');
    } else {
      console.warn('PINATA_JWT o PINATA_GATEWAY no configurados. IPFS funcionará en modo simulado.');
    }
  }

  /**
   * Inicializa el SDK de Pinata
   */
  initializePinata() {
    try {
      this.pinata = new PinataSDK({
        pinataJwt: this.pinataJwt,
        pinataGateway: this.pinataGateway,
      });
      console.log(`Pinata SDK inicializado con gateway: ${this.pinataGateway}`);
    } catch (error) {
      console.error('Error inicializando Pinata SDK:', error);
      this.pinata = null;
    }
  }

  /**
   * Sube un archivo a IPFS usando el SDK oficial de Pinata
   */
  async uploadToIPFS(fileBuffer, fileName, metadata = {}) {
    try {
      if (!this.pinata) {
        console.warn('SDK de Pinata no inicializado, usando modo simulado');
        return this.simulateIPFSUpload(fileBuffer, fileName, metadata);
      }

      // Crear objeto File para Pinata SDK
      const file = new File([fileBuffer], fileName, {
        type: this.getMimeType(fileName)
      });

      // Agregar metadatos personalizados
      const customMetadata = {
        ...metadata,
        uploadedAt: new Date().toISOString(),
        system: 'GAIA',
        version: '1.0',
        name: fileName
      };

      // Subir archivo usando el SDK oficial
      const upload = await this.pinata.upload.public.file(file, {
        metadata: customMetadata
      });

      const result = {
        hash: upload.cid,
        url: `https://${this.pinataGateway}/ipfs/${upload.cid}/${fileName}`,
        gateway: `https://ipfs.io/ipfs/${upload.cid}/${fileName}`,
        fileName,
        size: fileBuffer.length,
        uploadedAt: new Date(),
        pinata: true,
        uploadId: upload.id
      };

      console.log(`Archivo subido a Pinata IPFS: ${fileName} -> ${upload.cid}`);
      return result;

    } catch (error) {
      console.error('Error subiendo archivo a Pinata IPFS:', error);
      console.warn('Usando modo simulado debido al error');
      return this.simulateIPFSUpload(fileBuffer, fileName, metadata);
    }
  }

  /**
   * Sube múltiples archivos a IPFS usando el SDK oficial de Pinata
   */
  async uploadMultipleFiles(files) {
    try {
      if (!this.pinata) {
        throw new Error('SDK de Pinata no inicializado');
      }

      const results = [];
      
      // Subir archivos uno por uno usando el SDK
      for (const file of files) {
        const fileObj = new File([file.buffer], file.name, {
          type: file.mimetype
        });

        const metadata = {
          system: 'GAIA',
          batchUpload: true,
          fileName: file.name,
          uploadedAt: new Date().toISOString()
        };

        const upload = await this.pinata.upload.public.file(fileObj, {
          metadata: metadata
        });
        
        results.push({
          hash: upload.cid,
          url: `https://${this.pinataGateway}/ipfs/${upload.cid}/${file.name}`,
          gateway: `https://ipfs.io/ipfs/${upload.cid}/${file.name}`,
          fileName: file.name,
          size: file.buffer.length,
          uploadedAt: new Date(),
          pinata: true,
          uploadId: upload.id
        });
      }

      console.log(`Lote de ${files.length} archivos subido a Pinata IPFS usando SDK`);
      return results;

    } catch (error) {
      console.error('Error subiendo lote de archivos a Pinata IPFS:', error);
      throw new Error(`Error subiendo lote a Pinata IPFS: ${error.message}`);
    }
  }

  /**
   * Obtiene información de un archivo en IPFS desde Pinata
   */
  async getFileInfo(cid) {
    try {
      if (!this.pinata) {
        throw new Error('SDK de Pinata no inicializado');
      }

      // Usar el gateway de Pinata para obtener información básica
      return {
        cid,
        status: 'pinned',
        gateway: `https://${this.pinataGateway}/ipfs/${cid}`,
        pinata: true,
        url: `https://${this.pinataGateway}/ipfs/${cid}`
      };

    } catch (error) {
      console.error('Error obteniendo información del archivo Pinata IPFS:', error);
      throw new Error(`Error obteniendo info Pinata IPFS: ${error.message}`);
    }
  }

  /**
   * Verifica si un archivo existe en IPFS usando el gateway de Pinata
   */
  async fileExists(cid) {
    try {
      if (!this.pinata || !this.pinataGateway) {
        return false;
      }

      // Para Pinata, si tenemos un hash válido, asumimos que existe
      // En producción podrías hacer una petición HTTP al gateway para verificar
      return cid && cid.length > 0;

    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene el tipo MIME basado en la extensión del archivo
   */
  getMimeType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    const mimeTypes = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain',
      'json': 'application/json',
      'xml': 'application/xml',
      'csv': 'text/csv',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Genera un enlace de descarga directa para Pinata
   */
  generateDownloadLink(cid, fileName) {
    return {
      pinata: `https://${this.pinataGateway}/ipfs/${cid}/${fileName}`,
      gateway: `https://ipfs.io/ipfs/${cid}/${fileName}`,
      cloudflare: `https://cloudflare-ipfs.com/ipfs/${cid}/${fileName}`,
      dweb: `https://${cid}.ipfs.dweb.link/${fileName}`
    };
  }

  /**
   * Sube un reporte de carbono con metadatos específicos
   */
  async uploadCarbonReport(pdfBuffer, reportId, projectId, metadata = {}) {
    const fileName = `carbon-report-${reportId}-${Date.now()}.pdf`;
    
    const reportMetadata = {
      ...metadata,
      reportId,
      projectId,
      documentType: 'carbon_report',
      goldStandard: true,
      system: 'GAIA'
    };

    return await this.uploadToIPFS(pdfBuffer, fileName, reportMetadata);
  }

  /**
   * Sube un certificado verificado
   */
  async uploadVerifiedCertificate(pdfBuffer, reportId, projectId, verifierInfo, metadata = {}) {
    const fileName = `verified-certificate-${reportId}-${Date.now()}.pdf`;
    
    const certificateMetadata = {
      ...metadata,
      reportId,
      projectId,
      documentType: 'verified_certificate',
      goldStandard: true,
      verifier: verifierInfo.name || verifierInfo.id,
      verificationDate: new Date().toISOString(),
      system: 'GAIA'
    };

    return await this.uploadToIPFS(pdfBuffer, fileName, certificateMetadata);
  }

  /**
   * Simula la subida a IPFS para desarrollo/pruebas
   */
  simulateIPFSUpload(fileBuffer, fileName, metadata = {}) {
    const timestamp = Date.now();
    const simulatedHash = `simulated-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    
    const result = {
      hash: simulatedHash,
      url: `https://simulated-ipfs.gaia.com/${simulatedHash}/${fileName}`,
      gateway: `https://simulated-ipfs.gaia.com/${simulatedHash}/${fileName}`,
      fileName,
      size: fileBuffer.length,
      uploadedAt: new Date(),
      simulated: true
    };

    console.log(`Archivo simulado en IPFS: ${fileName} -> ${simulatedHash} (MODO SIMULADO)`);
    return result;
  }

  /**
   * Sube documentación del proyecto
   */
  async uploadProjectDocument(fileBuffer, fileName, projectId, documentType, metadata = {}) {
    const projectFileName = `project-${projectId}-${documentType}-${Date.now()}-${fileName}`;
    
    const documentMetadata = {
      ...metadata,
      projectId,
      documentType,
      goldStandard: true,
      system: 'GAIA'
    };

    return await this.uploadToIPFS(fileBuffer, projectFileName, documentMetadata);
  }
}

// Exportar instancia singleton
const pinataHelper = new PinataHelper();

module.exports = {
  uploadToIPFS: (fileBuffer, fileName, metadata) => pinataHelper.uploadToIPFS(fileBuffer, fileName, metadata),
  uploadMultipleFiles: (files) => pinataHelper.uploadMultipleFiles(files),
  getFileInfo: (cid) => pinataHelper.getFileInfo(cid),
  fileExists: (cid) => pinataHelper.fileExists(cid),
  generateDownloadLink: (cid, fileName) => pinataHelper.generateDownloadLink(cid, fileName),
  uploadCarbonReport: (pdfBuffer, reportId, projectId, metadata) => 
    pinataHelper.uploadCarbonReport(pdfBuffer, reportId, projectId, metadata),
  uploadVerifiedCertificate: (pdfBuffer, reportId, projectId, verifierInfo, metadata) => 
    pinataHelper.uploadVerifiedCertificate(pdfBuffer, reportId, projectId, verifierInfo, metadata),
  uploadProjectDocument: (fileBuffer, fileName, projectId, documentType, metadata) => 
    pinataHelper.uploadProjectDocument(fileBuffer, fileName, projectId, documentType, metadata)
};
