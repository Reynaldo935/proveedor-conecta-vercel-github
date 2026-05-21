/**
 * Google Apps Script - ProveedorConecta Nicaragua
 * Middleware para obtener datos del equipo desde Google Drive
 * 
 * Instrucciones:
 * 1. Ir a https://script.google.com
 * 2. Crear nuevo proyecto
 * 3. Pegar este código
 * 4. Implementar como aplicación web (acceso: cualquiera)
 * 5. Copiar la URL y ponerla en NEXT_PUBLIC_CREATORS_ENDPOINT
 * 
 * Estructura de carpetas en Drive:
 * 📁 1tflbpXzZAheNLH5Tdr3KnxlaW-grNNBJ (carpeta principal)
 *   📁 Apolonio
 *     🖼️ foto.jpg
 *     📄 info.txt
 *   📁 Arbela
 *     🖼️ foto.jpg
 *     📄 info.txt
 *   📁 Mychael
 *     🖼️ foto.jpg
 *     📄 info.txt
 *   📁 Pedro
 *     🖼️ foto.jpg
 *     📄 info.txt
 *   📁 Reynaldo
 *     🖼️ foto.jpg
 *     📄 info.txt
 */

function doGet() {
  const mainFolderId = '1tflbpXzZAheNLH5Tdr3KnxlaW-grNNBJ';
  const mainFolder = DriveApp.getFolderById(mainFolderId);
  const subFolders = mainFolder.getFolders();
  
  const roles = {
    'Apolonio': { id: '1', role: 'Desarrollador Backend', color: '#1A5276', email: '' },
    'Arbela': { id: '2', role: 'Marketing Digital', color: '#2E86C1', email: '' },
    'Mychael': { id: '3', role: 'Desarrollador Fullstack', color: '#1E8449', email: '' },
    'Pedro': { id: '4', role: 'Diseño Gráfico', color: '#F4D03F', email: '' },
    'Reynaldo': { id: '5', role: 'Comunicador y Fundador', color: '#C0392B', email: 'rey7214935@gmail.com' },
  };
  
  const teamData = [];
  
  while (subFolders.hasNext()) {
    const subFolder = subFolders.next();
    const name = subFolder.getName();
    const roleInfo = roles[name] || { id: String(teamData.length + 1), role: 'Miembro', color: '#2E86C1', email: '' };
    
    const files = subFolder.getFiles();
    let photoUrl = '';
    let infoText = '';
    
    while (files.hasNext()) {
      const file = files.next();
      const mimeType = file.getMimeType();
      
      if (mimeType.startsWith('image/')) {
        photoUrl = `https://drive.google.com/uc?export=view&id=${file.getId()}`;
      } else if (mimeType === 'text/plain' || mimeType === 'application/json') {
        infoText = file.getBlob().getDataAsString();
      }
    }
    
    teamData.push({
      id: roleInfo.id,
      name: name,
      role: roleInfo.role,
      bio: infoText || `Miembro del equipo ProveedorConecta Nicaragua.`,
      photo: photoUrl,
      email: roleInfo.email,
      color: roleInfo.color,
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify(teamData))
    .setMimeType(ContentService.MimeType.JSON);
}
