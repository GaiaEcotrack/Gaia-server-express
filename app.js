const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const updateFunctions = require('./controllers/updateKwController');
const executeCommand = require('./controllers/sailsController')
const sendContracMessage = require('./controllers/tokenController');
const verifyToken = require('./middlewares/authMiddleware');
const cron = require('node-cron');
const morgan = require('morgan');
const { sailsInstance, signerFromAccount } = require('./services/SailsService/utils');

// Load environment variables
dotenv.config();

const app = express();

// Middleware to parse JSON
app.use(express.json());
// app.use(morgan('combined'));
app.use(morgan('tiny'));

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length'],
    credentials: true
};

app.use(cors(corsOptions));

// Import routes
const apiRoutes = require('./routes/device');
const generadorRoutes = require('./routes/generadorRoutes');
const credencialsUser = require('./routes/credencialsRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const userComercial = require('./routes/userComercialRoutes');
const userInstaller = require('./routes/installerRoutes');

// Use routes
app.use('/api', apiRoutes);
app.get("/api", (req, res) => {
    res.send("App running 👍");
});
app.use('/generator',verifyToken,generadorRoutes);
app.use('/credencials', verifyToken, credencialsUser);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/comercial',userComercial)
app.use('/installer',userInstaller)

let isUpdating = false;

// Función para actualizar usuarios
async function startUpdatingUsers() {
    try {
        isUpdating = true; // Indicar que se está actualizando
        await updateFunctions.actualizarKwGeneradoParaUsuarios()
        console.log('Proceso de actualización completado.');
    } catch (error) {
        console.error('Error durante la actualización de usuarios:', error.message);
    } finally {
        isUpdating = false; // Indicar que se ha finalizado la actualización
    }
}

// Ruta GET para iniciar el proceso de actualización
app.get('/update-users', async (req, res) => {
    if (isUpdating) {
        res.send('Se está realizando el proceso de actualización.');
    } else {
        await startUpdatingUsers();
        res.send('Se terminó el proceso de actualización.');
    }
});

app.get('/api/protected-route', verifyToken, (req, res) => {
    // req.user contiene la información decodificada del token
    res.json({ message: 'This is a protected route', user: req.user });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Start updating users
cron.schedule('00 20 * * *', async () => {
    console.log('Iniciando la actualización de usuarios programada.');
    await startUpdatingUsers();
}, {
    scheduled: true,
    timezone: "America/Bogota" // Zona horaria de Colombia
});

const IP = '0.0.0.0'; // Cambia esta IP por la correcta de tu servidor
const PORT =  8080;





// Data to create a keyring (name and mnemonic from a wallet)
const accountName = 'Admin';
const accountMnemonic = 'sun pill sentence spoil ripple october funny ensure illness equal car demise';

// Data to set SailsCalls (network, contract id and idl)
const network = 'wss://testnet.vara.network'; // network, testnet
const contractId = '0xf01f2b47b1970923651f76fef44476d2123020baab0a2336857fb73a9e28af5a';
const idl = `type MiniDexsEvents = enum {
  RefundOfVaras: u128,
  VFTContractIdSet,
  DevicesAdded,
  MinTokensToAddSet,
  TokensAdded,
  SetTokensPerVaras,
  MintingScheduled,
  MintingExecuted,
  TotalSwapInVaras: u128,
  TokensSwapSuccessfully: struct { total_tokens: u128, total_varas: u128 },
  Error: MiniDexsErrors,
};

type MiniDexsErrors = enum {
  MinTokensToAdd: u128,
  UserAlreadyExists,
  CantSwapTokens: struct { tokens_in_vft_contract: u256 },
  CantSwapUserTokens: struct { user_tokens: u256, tokens_to_swap: u256 },
  ContractCantMint,
  CantSwapTokensWithAmount: struct { min_amount: u128, actual_amount: u128 },
  OnlyOwnerCanDoThatAction,
  VftContractIdNotSet,
  ErrorInVFTContract,
  ErrorInGetNumOfVarasToSwap,
  OperationWasNotPerformed,
  MintingFailed,
};

type MiniDexsQueryEvents = enum {
  ContractBalanceInVaras: u128,
  Mitings: vec MintingSchedule,
  Devices: vec Devices,
  UserTotalTokensAsU128: u128,
  UserTotalTokens: u256,
  TotalTokensToSwap: u256,
  TotalTokensToSwapAsU128: u128,
  TokensToSwapOneVara: u128,
  NumOfTokensForOneVara: u128,
  Error: MiniDexsErrors,
};

type MintingSchedule = struct {
  wallet: actor_id,
  amount: u128,
  minting_time: u64,
};

type Devices = struct {
  owner: actor_id,
  serial_number: str,
  location: str,
  type_device: str,
  device_brand: str,
};

constructor {
  New : ();
  NewWithData : (vft_contract_id: opt actor_id, vft_contract_id_two: opt actor_id, min_tokens_to_add: u128, tokens_per_vara: u128);
};

service MiniDeXs {
  AddDevice : (owner: actor_id, serial_number: str, location: str, type_device: str, device_brand: str) -> MiniDexsEvents;
  AddTokensToContract : (tokens_to_add: u128) -> MiniDexsEvents;
  ExecuteMintings : (time: u64) -> MiniDexsEvents;
  MintTokensToUser : (recipient: actor_id, amount: u128) -> MiniDexsEvents;
  ScheduleMinting : (wallet: actor_id, amount: u128, minting_time: u64) -> MiniDexsEvents;
  SetMinTokensToAdd : (min_tokens_to_add: u128) -> MiniDexsEvents;
  SetTokensPerVara : (tokens_per_vara: u128) -> MiniDexsEvents;
  SetVftContractId : (vft_contract_id: actor_id) -> MiniDexsEvents;
  SwapTokensByNumOfVaras : () -> MiniDexsEvents;
  SwapTokensToVaras : (amount_of_tokens: u128) -> MiniDexsEvents;
  TransferTokensToUser : (recipient: actor_id, amount: u128) -> MiniDexsEvents;
  query ContractTotalVarasStored : () -> MiniDexsQueryEvents;
  query GetDevices : () -> MiniDexsQueryEvents;
  query GetMitings : () -> MiniDexsQueryEvents;
  query TokensToSwapOneVara : () -> MiniDexsQueryEvents;
  query TotalTokensToSwap : () -> MiniDexsQueryEvents;
  query TotalTokensToSwapAsU128 : () -> MiniDexsQueryEvents;
};

`;



/**
 * GET endpoint to read state (query) from a contract   
 */
app.get('/query', async (req, res) => {


    try {
        response=await executeCommand.executeQuery("MiniDeXs","GetDevices",[])
        // Return response
        res.send(JSON.stringify(response));
    } catch (e) {
        console.error(e);
        res.status(500).send(
            `Error while read state: ${e}`
        );
    }
});

/**
 * POST endpoint to send a command to the contract
 */
app.post('/command/:service/:method', async (req, res) => {
    const service = req.params.service;
    const method = req.params.method;
    const callArguments = Array.isArray(req.body) ? req.body : [];

    // Set the SailsCalls instance
    const sailsCalls = await sailsInstance(network, contractId, idl);
    const keyring = await signerFromAccount(accountName, accountMnemonic);

    let responses = [];

    // Definir cuántas veces quieres ejecutar la llamada, por ejemplo 5 veces.
    const numberOfCalls = 100;

    try {
        for (let i = 0; i < numberOfCalls; i++) {
            // Enviar comando al programa
            const response = await sailsCalls.command(
                `${service}/${method}`,
                keyring,
                { callArguments }
            );
            
            console.log(`Response ${i + 1}:`, response);
            responses.push(response);  // Guardar la respuesta en un array para devolver todas
        }

        // Retornar todas las respuestas
        res.send(JSON.stringify(responses));
    } catch (e) {
        console.error(e);
        res.status(500).send(`Error while executing command: ${e}`);
    }
});





app.listen(PORT, () => {
    console.log(`Server running on http://${IP}:${PORT}`);
});

module.exports = app;
