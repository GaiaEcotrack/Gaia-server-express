const axios = require('axios');
const Credenciales = require('../models/credenciales');

const { wrapper } = require('axios-cookiejar-support');
const tough = require('tough-cookie');

// Crear un jar para almacenar cookies
const cookieJar = new tough.CookieJar();

// Envolver axios con soporte para cookies
const client = wrapper(axios.create({ jar: cookieJar }));




const auth = async (username,password) => {
  try {
    // Preparar los datos que se enviarán en el cuerpo de la solicitud
    const data = {
      account: username,  // Reemplaza con los datos reales si es necesario
      password: '',  // Añade la contraseña correspondiente
      validateCode: '',
      isReadPact: 0,
      passwordCrc: password
    };

    // Configurar la solicitud, incluyendo los encabezados necesarios
    const response = await axios.post('https://openapi.growatt.com/login', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Origin': 'https://openapi.growatt.com',
        'Referer': 'https://openapi.growatt.com/login',
        'Accept-Language': 'es-419,es-US;q=0.9,es;q=0.8,en;q=0.7',
        'Connection': 'keep-alive'
      }
    });

    // Verificar las cookies devueltas
    const cookies = response.headers['set-cookie'];
    const cookieString = cookies.map(cookie => cookie.split(';')[0]).join('; ');
    // Retornar las cookies y los datos de la respuesta
    return {
      cookies: cookieString,
      data: response.data
    };

  } catch (error) {
    console.error('Error al hacer login en Growatt:', error.message);
    throw new Error('Error en la solicitud');
  }
};


const getAuthCookies = async (user_client) => {
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapa caracteres especiales
  }
  
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapa caracteres especiales
  }
  
  // Eliminar espacios del user_client que se busca
  const cleanedUserClient = user_client.replace(/\s+/g, '');
  
  // Crear la expresión regular para la búsqueda
  const regex = new RegExp(`^${escapeRegExp(cleanedUserClient)}$`, 'i');
  
  // Buscar las credenciales en la base de datos
  const credencials = await Credenciales.find(); // Busca todas las credenciales
  
  // Filtrar las credenciales para comparar sin espacios
  const filteredCredencials = credencials.filter(credencial => {
    return credencial.user_client.replace(/\s+/g, '').match(regex);
  });
  
  // Si necesitas solo la primera coincidencia
  const matchedCredential = filteredCredencials.length > 0 ? filteredCredencials[0] : null;
  
  if (!matchedCredential) {
    throw new Error('Credenciales no encontradas');
  }

  const username = matchedCredential.username;
  const password = matchedCredential.password;
  const cookies = await auth(username, password);
  return cookies.cookies;
};
const makePostRequest = async (url, payload, headers) => {
  try {
    const response = await axios.post(url, payload, { headers });
    return response.data;
  } catch (error) {
    throw new Error(error.response ? error.response.data : error.message);
  }
};

const createHeaders = (cookies) => ({
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Language': 'es-419,es-US;q=0.9,es;q=0.8,en;q=0.7',
  'Connection': 'keep-alive',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
  'X-Requested-With': 'XMLHttpRequest',
  'Cookie': `_gcl_au=1.1.52447567.1726501117; _ga=GA1.1.1842650990.1726501117; _ga_2CL3HRD0F3=GS1.1.1726501117.1.1.1726501360.44.0.541737046; _gcl_gs=2.1.k1$i1726538856; _gcl_aw=GCL.1726538883.Cj0KCQjwrp-3BhDgARIsAEWJ6Sy00pBmhCd_VvxIJmyeT_fkKxstYJ1dhRpvDwfcSjZbajhblsZRmQ0aAuIdEALw_wcB; _ga_NBFECDGEF8=GS1.1.1726541606.3.0.1726541606.60.0.2067184679; loginPage=login; mapLang=com; lang=en; ${cookies}`
});



let plantCache = {}; // Objeto para almacenar las plantas en caché
const CACHE_EXPIRATION = 5 * 60 * 1000; // Tiempo de expiración en milisegundos (5 minutos)

// Función para verificar si el caché está todavía vigente
const isCacheValid = (cachedEntry) => {
  return cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_EXPIRATION);
};





const getAllPlants = async (user_client) => {
  // Si las plantas están en caché y no ha expirado, devolver el caché
  if (plantCache[user_client] && isCacheValid(plantCache[user_client])) {
    return plantCache[user_client].data;
  }

  // Si no están en caché o ha expirado, realizar la solicitud
  const cookies = await getAuthCookies(user_client);
  const config = {
    method: 'post',
    url: 'https://openapi.growatt.com/selectPlant/getPlantList',
    headers: {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'es-419,es-US;q=0.9,es;q=0.8,en;q=0.7',
      'Connection': 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Origin': 'https://openapi.growatt.com',
      'Referer': 'https://openapi.growatt.com/selectPlant',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': cookies,
    },
    data: {
      currPage: 1,
      plantType: -1,
      orderType: 2,
      plantName: ""
    }
  };

  try {
    const response = await axios(config);
    const plantList = response.data.datas;
    
    // Guardar en caché
    plantCache[user_client] = {
      data: plantList,
      timestamp: Date.now(),
    };
    
    return plantList;
  } catch (error) {
    console.error('Error al obtener la lista de plantas:', error.message);
    throw new Error('Error al obtener la lista de plantas');
  }
};

const getDevicesByPlantList = async (user_client) => {
  const cookies = await getAuthCookies(user_client);
  const requestId = await getAllPlants(user_client);

  // Eliminar espacios del user_client que se busca
  const cleanedUserClient = user_client.replace(/\s+/g, '').toLowerCase(); // Elimina espacios y convierte a minúsculas

  // Filtrar la planta cuyo nombre coincida con user_client, ignorando espacios y mayúsculas/minúsculas
  const plant = requestId.find(plant => 
    plant.plantName.replace(/\s+/g, '').toLowerCase() === cleanedUserClient
  );

  if (!plant) {
    throw new Error(`No se encontró una planta con el nombre: ${user_client}`);
  }

  // Usar el id de la planta encontrada como plantId
  const plantId = plant.id;

  const url = 'https://openapi.growatt.com/panel/getDevicesByPlantList';
  const headers = createHeaders(cookies);
  const payload = new URLSearchParams({
    currPage: "1",
    plantId: plantId.toString()  // Aquí se usa el id de la planta encontrada
  });

  const data = await makePostRequest(url, payload, headers);
  return data.obj.datas;
};

const getCarboonPlantData = async (user_client) => {
  const cookies = await getAuthCookies(user_client);
  const baseUrl = 'https://openapi.growatt.com/panel/getPlantData';

  const requestId = await getAllPlants(user_client);

  // Eliminar espacios del user_client que se busca
  const cleanedUserClient = user_client.replace(/\s+/g, '').toLowerCase(); // Elimina espacios y convierte a minúsculas

  // Filtrar la planta cuyo nombre coincida con user_client, ignorando espacios y mayúsculas/minúsculas
  const plant = requestId.find(plant => 
    plant.plantName.replace(/\s+/g, '').toLowerCase() === cleanedUserClient
  );

  if (!plant) {
    throw new Error(`No se encontró una planta con el nombre: ${user_client}`);
  }

  // Usar el id de la planta encontrada como plantId
  const plantId = plant.id;

  const headers = createHeaders(cookies);
  const url = `${baseUrl}?plantId=${plantId}`;

  const data = await makePostRequest(url, {}, headers);
  return data;
};



const getMAXDayChart = async (user_client) => {
  const cookies = await getAuthCookies(user_client);
  const requestId = await getAllPlants(user_client);

  // Eliminar espacios del user_client que se busca
  const cleanedUserClient = user_client.replace(/\s+/g, '').toLowerCase(); // Elimina espacios y convierte a minúsculas

  // Filtrar la planta cuyo nombre coincida con user_client, ignorando espacios y mayúsculas/minúsculas
  const plant = requestId.find(plant => 
    plant.plantName.replace(/\s+/g, '').toLowerCase() === cleanedUserClient
  );

  if (!plant) {
    throw new Error(`No se encontró una planta con el nombre: ${user_client}`);
  }

  // Usar el id de la planta encontrada como plantId
  const plantId = plant.id;

  if (!plantId) {
    throw new Error('Date y Plant ID son requeridos');
  }

  const devices = await getDevicesByPlantList(user_client);
  const device = devices[0]; // Suponiendo que sólo te interesa el primer dispositivo

  if (!device || !device.deviceTypeName) {
    throw new Error('No se pudo determinar el tipo de dispositivo');
  }

  // Seleccionar la URL basada en el deviceTypeName
  let baseUrl;
  let body;
  const today = new Date().toISOString().split('T')[0];
  const headers = createHeaders(cookies);

  switch (device.deviceTypeName.toLowerCase()) {
    case 'max':
      baseUrl = 'https://openapi.growatt.com/panel/max/getMAXDayChart';
      body = { date: today, plantId };
      break;
    case 'tlx':
      baseUrl = 'https://openapi.growatt.com/panel/tlx/getTLXEnergyDayChart';
      body = { date: today, plantId, tlxSn: device.sn };
      break;
    default:
      throw new Error(`Tipo de dispositivo no soportado: ${device.deviceTypeName}`);
  }
  

    // Hacer la petición
    const response = await makePostRequest(baseUrl, body, headers);

    // Extraer la parte deseada de la respuesta según el tipo
    let chartData;
    if (device.deviceTypeName.toLowerCase() === 'max') {
      chartData = response?.obj?.pac ?? null;
    } else if (device.deviceTypeName.toLowerCase() === 'tlx') {
      chartData = response?.obj?.charts?.ppv ?? null;
    }

  return chartData;
};




const getMAXMonthChart = async (user_client) => {
  const cookies = await getAuthCookies(user_client);
  const requestId = await getAllPlants(user_client);

  // Eliminar espacios del user_client que se busca
  const cleanedUserClient = user_client.replace(/\s+/g, '').toLowerCase(); // Elimina espacios y convierte a minúsculas

  // Filtrar la planta cuyo nombre coincida con user_client, ignorando espacios y mayúsculas/minúsculas
  const plant = requestId.find(plant => 
    plant.plantName.replace(/\s+/g, '').toLowerCase() === cleanedUserClient
  );

  if (!plant) {
    throw new Error(`No se encontró una planta con el nombre: ${user_client}`);
  }
    // Usar el id de la planta encontrada como plantId
    const plantId = plant.id;

    if (!plantId) {
      throw new Error('Date y Plant ID son requeridos');
    }
    
  

  const devices = await getDevicesByPlantList(user_client);
  const device = devices[0]; // Suponiendo que sólo te interesa el primer dispositivo

  if (!device || !device.deviceTypeName) {
    throw new Error('No se pudo determinar el tipo de dispositivo');
  }

  // Seleccionar la URL basada en el deviceTypeName
  let baseUrl;
  let body;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // +1 porque los meses van de 0-11
  const today = `${year}-${month}`;

  switch (device.deviceTypeName.toLowerCase()) {
    case 'max':
      baseUrl = 'https://openapi.growatt.com/panel/max/getMAXMonthChart'
      body = { date: today, plantId };
      break;
    case 'tlx':
      baseUrl = 'https://openapi.growatt.com/panel/tlx/getTLXEnergyMonthChart';
      body = { date: today, plantId, tlxSn: device.sn };
      break;
    default:
      throw new Error(`Tipo de dispositivo no soportado: ${device.deviceTypeName}`);
  }
  

  const headers = createHeaders(cookies);
    // Hacer la petición
    const response = await makePostRequest(baseUrl, body, headers);

    // Extraer la parte deseada de la respuesta según el tipo
    let chartData;
    if (device.deviceTypeName.toLowerCase() === 'max') {
      chartData = response?.obj?.energy ?? null;
    } else if (device.deviceTypeName.toLowerCase() === 'tlx') {
      chartData = response?.obj?.charts?.energy ?? null;
    }

  return chartData;
};


const getMAXYearChart = async (user_client) => {
  const cookies = await getAuthCookies(user_client);
  const requestId = await getAllPlants(user_client);

  // Eliminar espacios del user_client que se busca
  const cleanedUserClient = user_client.replace(/\s+/g, '').toLowerCase(); // Elimina espacios y convierte a minúsculas

  // Filtrar la planta cuyo nombre coincida con user_client, ignorando espacios y mayúsculas/minúsculas
  const plant = requestId.find(plant => 
    plant.plantName.replace(/\s+/g, '').toLowerCase() === cleanedUserClient
  );

  if (!plant) {
    throw new Error(`No se encontró una planta con el nombre: ${user_client}`);
  }

  // Usar el id de la planta encontrada como plantId
  const plantId = plant.id;

  const devices = await getDevicesByPlantList(user_client);
  const device = devices[0]; // Suponiendo que sólo te interesa el primer dispositivo

  if (!device || !device.deviceTypeName) {
    throw new Error('No se pudo determinar el tipo de dispositivo');
  }

  // Seleccionar la URL basada en el deviceTypeName
  let baseUrl;
  let body;

    
  const now = new Date();
  const year = now.getFullYear();

  const today = `${year}`;

  switch (device.deviceTypeName.toLowerCase()) {
    case 'max':
      baseUrl = 'https://openapi.growatt.com/panel/max/getMAXYearChart'
      body = { year: today, plantId };
      break;
    case 'tlx':
      baseUrl = 'https://openapi.growatt.com/panel/tlx/getTLXEnergyYearChart';
      body = { year: today, plantId, tlxSn: device.sn };
      break;
    default:
      throw new Error(`Tipo de dispositivo no soportado: ${device.deviceTypeName}`);
  }

  if (!plantId) {
    throw new Error('Date y Plant ID son requeridos');
  }

  const headers = createHeaders(cookies);

  const response = await makePostRequest(baseUrl, body, headers);

  // Extraer la parte deseada de la respuesta según el tipo
  let chartData;
  if (device.deviceTypeName.toLowerCase() === 'max') {
    chartData = response?.obj?.energy ?? null;
  } else if (device.deviceTypeName.toLowerCase() === 'tlx') {
    chartData = response?.obj?.charts?.energy ?? null;
  }

return chartData;
};




const getDataLog = async (user_client) => {
  const cookies = await getAuthCookies(user_client);
  const requestId = await getAllPlants(user_client);

  // Eliminar espacios del user_client que se busca
  const cleanedUserClient = user_client.replace(/\s+/g, '').toLowerCase(); // Elimina espacios y convierte a minúsculas

  // Filtrar la planta cuyo nombre coincida con user_client, ignorando espacios y mayúsculas/minúsculas
  const plant = requestId.find(plant => 
    plant.plantName.replace(/\s+/g, '').toLowerCase() === cleanedUserClient
  );

  if (!plant) {
    throw new Error(`No se encontró una planta con el nombre: ${user_client}`);
  }

  // Usar el id de la planta encontrada como plantId
  const plantId = plant.id;
  const baseUrl = 'https://openapi.growatt.com/device/getDatalogList';

  if (!plantId) {
    throw new Error('Date y Plant ID son requeridos');
  }
  
  const today = new Date().toISOString().split('T')[0];
  const headers = createHeaders(cookies);
  const data = await makePostRequest(baseUrl, { datalogSn: "", currPage: 1, plantId }, headers);
  return data;
};


// Exportar las funciones para su uso en otros lugares
module.exports = {
  getDevicesByPlantList,
  getCarboonPlantData,
  getMAXDayChart,
  getAllPlants,
  getDataLog,
  getMAXMonthChart,
  getMAXYearChart

};