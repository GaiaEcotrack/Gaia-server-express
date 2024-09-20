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
  const credencials = await Credenciales.findOne({ user_client: { $regex: new RegExp(`^${user_client}$`, 'i') } });
  
  if (!credencials) {
    throw new Error('Credenciales no encontradas');
  }

  const username = credencials.username;
  const password = credencials.password;
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

const getAllPlants = async (user_client) => {
  const cookies = await getAuthCookies(user_client);

  // Configuración de la solicitud
  const config = {
    method: 'post',
    url: 'https://openapi.growatt.com/index/getPlantListTitle',
    headers: {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'es-419,es-US;q=0.9,es;q=0.8,en;q=0.7',
      'Connection': 'keep-alive',
      'Content-Length': '0',
      'Content-Type': 'application/json',
      'Origin': 'https://openapi.growatt.com',
      'Referer': 'https://openapi.growatt.com/selectPlant',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': `_gcl_au=1.1.52447567.1726501117; _ga=GA1.1.1842650990.1726501117; _ga_2CL3HRD0F3=GS1.1.1726501117.1.1.1726501360.44.0.541737046; _gcl_gs=2.1.k1$i1726538856; _gcl_aw=GCL.1726538883.Cj0KCQjwrp-3BhDgARIsAEWJ6Sy00pBmhCd_VvxIJmyeT_fkKxstYJ1dhRpvDwfcSjZbajhblsZRmQ0aAuIdEALw_wcB; _ga_NBFECDGEF8=GS1.1.1726541606.3.0.1726541606.60.0.2067184679; loginPage=login; mapLang=com; lang=en; ${cookies}`,
    },
  };

  try {
    // Realizando la solicitud
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('Error al obtener la lista de plantas:', error.message);
    throw new Error('Error al obtener la lista de plantas');
  }
};

const getDevicesByPlantList = async (user_client) => {
  const cookies = await getAuthCookies(user_client);
  const requestId = await getAllPlants(user_client);

  // Filtrar la planta cuyo nombre coincida con user_client, sin importar mayúsculas/minúsculas
  const plant = requestId.find(plant => 
    plant.plantName.toLowerCase() === user_client.toLowerCase()
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

  // Filtrar la planta cuyo nombre coincida con user_client, sin importar mayúsculas/minúsculas
  const plant = requestId.find(plant => 
    plant.plantName.toLowerCase() === user_client.toLowerCase()
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

  // Filtrar la planta cuyo nombre coincida con user_client, sin importar mayúsculas/minúsculas
  const plant = requestId.find(plant => 
    plant.plantName.toLowerCase() === user_client.toLowerCase()
  );

  if (!plant) {
    throw new Error(`No se encontró una planta con el nombre: ${user_client}`);
  }

  // Usar el id de la planta encontrada como plantId
  const plantId = plant.id;
  const baseUrl = 'https://openapi.growatt.com/panel/max/getMAXDayChart';

  if ( !plantId) {
    throw new Error('Date y Plant ID son requeridos');
  }
  const today = new Date().toISOString().split('T')[0];
  const headers = createHeaders(cookies);
  const data = await makePostRequest(baseUrl, { date:today, plantId }, headers);
  return data;
};



// Exportar las funciones para su uso en otros lugares
module.exports = {
  getDevicesByPlantList,
  getCarboonPlantData,
  getMAXDayChart,
  getAllPlants,

};