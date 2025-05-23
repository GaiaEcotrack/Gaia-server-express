const { sailsInstance, signerFromAccount } = require('../services/SailsService/utils');



//INFO CONTRACT 
const network = 'wss://testnet.vara.network'; // network, testnet
const contractId = '0x2e178a0a3d10307c8aa961b1d06977599a46d7c0e1925df9d285add810c7a115';
const idl = `type GaiaEvents = enum {
  VFTContractIdChanged: struct { old: opt actor_id, new: opt actor_id },
  TokensSwapSuccessfullyEnergy: struct { total_tokens: u128, total_company_tokens: u128 },
  ApprovalSuccessful: struct { owner: actor_id, spender: actor_id, amount: u128 },
  RefundOfVaras: u128,
  VFTContractIdSet,
  CertificateAdded: str,
  AdminRemoved: actor_id,
  DevicesAdded: str,
  MinTokensToAddSet,
  TokensAdded: str,
  TokensBurned,
  SetTokensPerVaras,
  MintingScheduled: str,
  MintingExecuted,
  TotalSwapInVaras: u128,
  TokensSwapSuccessfully: struct { total_tokens: u128, total_varas: u128 },
  AdminAdded: actor_id,
  Error: GaiaErrors,
  TransferSuccessful: struct { from: actor_id, to: actor_id, amount: u128, timestamp: u64 },
  TotalSupplyRetrieved: u256,
  PropertyChanged: struct { str, u256 },
  CooldownChanged: struct { old_value: u64, new_value: u64 },
};

type GaiaErrors = enum {
  MinTokensToAdd: u128,
  AdminExist,
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
  InvalidAmount,
  InvalidSerialNumber,
  InvalidLocation,
  InvalidTypeDevice,
  InvalidDeviceBrand,
  ExternalCallTimeout,
  ArithmeticOverflow,
  InvalidDeviceType,
  InvalidCertificateId,
  CertificateAlreadyExists,
  InvalidDates,
  DeviceAlreadyExists,
  InsufficientBalance,
  InvalidTransferAmount,
  CalculationOverflow,
  InvalidTimeRange,
  CooldownPeriodActive,
  ConversionLimitExceeded,
  InvalidConversionCooldown,
  InvalidCooldownValue: u64,
  InvalidPropertyName: str,
  InvalidPropertyValue: struct { str, u256 },
  AdminListExceeded,
  DeviceListExceeded,
  MintingSchedulesExceeded,
  InvalidMintAmount,
  EnergyProductionLimitExceeded,
  TimeRangeTooLarge,
  InvalidTokenValue,
  TooManyEntriesProcessed,
  OnlyOwnerOrAdminCanDoThatAction,
  InvalidContractId,
  VftContractBurnFailed,
  AmountExceedsLimit,
  GaiaAmountTooLarge,
  InvalidPercentageBase,
  InvalidMintingTime: str,
  ExceededTokenLimit: u128,
  SelfTransferAttempted,
  ExceededTransferLimit: u128,
  TransferCooldownActive,
  ExceededConversionLimit,
  ExceededMintingLimit,
  AdminNotFound,
  CantSwapVftWithAmount: struct { min_amount: u128, actual_amount: u128 },
  CompanyTokenContractIdNotSet,
  InsufficientBalanceEnergy: struct { required: u256, available: u256 },
  TransferFailed,
  BalanceCheckFailed,
  ApprovalFailed,
  BurnFailed,
};

type GaiaQueryEvents = enum {
  ContractBalanceInVaras: u128,
  Mitings: vec MintingSchedule,
  Devices: vec Devices,
  Admins: vec actor_id,
  TotalTokensUserEnergy: u128,
  TotalTokensUserCompany: u128,
  UserTotalTokensAsU128: u128,
  UserTotalTokens: u256,
  TotalTokensToSwap: u256,
  TotalTokensToSwapEnergyAndCompany: struct { u128, u128 },
  TotalTokensToSwapAsU128: u128,
  TokensToSwapOneVara: u128,
  NumOfTokensForOneVara: u128,
  Error: GaiaErrors,
  Producers: vec EnergyProduction,
  PropertiesFetched: GaiaProperties,
  CarbonCertificates: vec CarbonCertificates,
  TransferRecords: vec TransferRecord,
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

type EnergyProduction = struct {
  timestamp: u64,
  kwh_generated: u256,
  gaia_e_minted: u256,
  producer: actor_id,
};

type GaiaProperties = struct {
  kwh_per_token: u256,
  gaia_e_to_gaia_rate: u256,
  min_conversion_amount: u256,
  max_daily_conversion: u256,
  min_gaia_e_transfer: u256,
  max_gaia_e_per_kwh: u256,
  conversion_cooldown: u64,
};

type CarbonCertificates = struct {
  owner: actor_id,
  certificate_id: str,
  value: u256,
  issue_date: u64,
  expiry_date: u64,
};

type TransferRecord = struct {
  from: actor_id,
  to: actor_id,
  amount: u128,
  timestamp: u64,
  token_type: str,
};

constructor {
  New : ();
  NewWithData : (vft_contract_id: opt actor_id, gaia_company_token: opt actor_id, min_tokens_to_add: u128, tokens_per_vara: u128, gaia_e_to_gaia_rate: u256, min_conversion_amount: u256, max_daily_conversion: u256, min_gaia_e_transfer: u256, max_gaia_e_per_kwh: u256, kwh_por_token: u256, conversion_cooldown: u64);
};

service GaiaService {
  AddAdmin : (new_admin: actor_id) -> GaiaEvents;
  AddCarbonCertificate : (owner: actor_id, certificate_id: str, value: u256, issue_date: u64, expiry_date: u64) -> GaiaEvents;
  AddCompanyToken : (tokens_to_add: u128) -> GaiaEvents;
  AddDevice : (owner: actor_id, serial_number: str, location: str, type_device: str, device_brand: str) -> GaiaEvents;
  AddTokensToContract : (tokens_to_add: u128) -> GaiaEvents;
  ChangeCooldown : (conversion_cooldown: u64) -> GaiaEvents;
  ChangeProperty : (property: str, value: u256) -> GaiaEvents;
  ExecuteMintings : (time: u64) -> GaiaEvents;
  MintTokensToUser : (recipient: actor_id, amount: u256) -> GaiaEvents;
  RemoveAdmin : (admin_to_remove: actor_id) -> GaiaEvents;
  ScheduleMinting : (wallet: actor_id, amount: u128, minting_time: u64) -> GaiaEvents;
  SetMinTokensToAdd : (min_tokens_to_add: u128) -> GaiaEvents;
  SetTokensPerVara : (tokens_per_vara: u128) -> GaiaEvents;
  SetVftContractId : (new_vft_contract_id: actor_id) -> GaiaEvents;
  SwapGaiaEToGaiaCompany : (from: actor_id, amount_of_vft: u128) -> GaiaEvents;
  SwapTokensByNumOfVaras : () -> GaiaEvents;
  SwapTokensToVaras : (amount_of_tokens: u128) -> GaiaEvents;
  TransferGaiaCompanyToken : (from: actor_id, to: actor_id, amount: u128) -> GaiaEvents;
  TransferGaiaETokens : (from: actor_id, to: actor_id, amount: u128) -> GaiaEvents;
  query ContractTotalVarasStored : () -> GaiaQueryEvents;
  query GetAdmins : () -> GaiaQueryEvents;
  query GetAllProperties : () -> GaiaQueryEvents;
  query GetCarbonCertificates : () -> GaiaQueryEvents;
  query GetDevices : () -> GaiaQueryEvents;
  query GetEnergyProductionStats : (producer: actor_id, start_time: u64, end_time: u64) -> result (struct { u256, u256 }, GaiaErrors);
  query GetMitings : () -> GaiaQueryEvents;
  query GetProducers : () -> GaiaQueryEvents;
  query GetSwapTotalsGaiaeToGaiaCompany : () -> GaiaQueryEvents;
  query GetTotalSupplyGaiaCompany : () -> GaiaEvents;
  query GetTotalSupplyGaiaE : () -> GaiaEvents;
  query GetTransferRecords : () -> GaiaQueryEvents;
  query IsAdmin : () -> bool;
  query TokensToSwapOneVara : () -> GaiaQueryEvents;
  query TotalTokensCompany : (wallet: actor_id) -> GaiaQueryEvents;
  query TotalTokensEnergy : (wallet: actor_id) -> GaiaQueryEvents;
  query TotalTokensToSwap : () -> GaiaQueryEvents;
  query TotalTokensToSwapAsU128 : () -> GaiaQueryEvents;
};



`;

const accountName = 'Admin';
const accountMnemonic =process.env.MNEMONIC
// Definir la función para ejecutar el comando
//send tokens

// Almacenar las instancias para reutilizarlas
let sailsCalls = null;
let keyring = null;

const initializeConnection = async () => {
  try {
      if (!process.env.MNEMONIC) {
          throw new Error('MNEMONIC no está definido en las variables de entorno');
      }
      
      if (!sailsCalls || !keyring) {
          console.log('Inicializando conexión a la red y keyring...');
          sailsCalls = await sailsInstance(network, contractId, idl);
          keyring = await signerFromAccount(accountName, process.env.MNEMONIC);
          console.log('Conexión con Vara establecida correctamente');
          return { success: true };
      } else {
          console.log('Conexión y keyring ya inicializados.');
          return { success: true, message: 'Ya inicializado' };
      }
  } catch (e) {
      console.error('Error al inicializar conexión con Vara:', e);
      throw e; // Propaga el error para que pueda ser manejado por el llamador
  }
};

const executeCommand = async (service, method, callArguments) => {
  try {
      // Asegurarse de que la conexión y el keyring están inicializados
      // Ejecutar el comando utilizando la instancia existente
      const response = await sailsCalls.command(
          `${service}/${method}`,
          keyring,
          { callArguments }
      );

      console.log('Response:', response);
      return response;
  } catch (e) {
      console.error('Error while executing command:', e);
      throw new Error(`Error while executing command: ${e}`);
  }
};


const executeQueryForAll = async (service, method, callArguments) => {
  try {
    
      // Enviar la consulta al programa
      const response = await sailsCalls.query(
          `${service}/${method}`,
          { callArguments }
      );


      

      // Retornar la respuesta
      return response
  } catch (e) {
      console.error('Error while reading state:', e);
  }
};


// Definir la función para ejecutar la consulta
const executeQuery = async (req,res) => {
    try {
      const {service,method} = req.params
      const callArguments = Array.isArray(req.body) ? req.body : [];
        // Set the SailsCalls instance
        const sailsCalls = await sailsInstance(network, contractId, idl);

        // Enviar la consulta al programa
        const response = await sailsCalls.query(
            `${service}/${method}`,
            { callArguments }
        );

        console.log(callArguments);

        // Retornar la respuesta
        res.status(200).send(response)
    } catch (e) {
        console.error('Error while reading state:', e);
        res.status(400).send(e)
    }
};
const executeAllQueries = async (req, res) => {
  try {
    // Define todos los métodos de las queries que quieres ejecutar
    const methods = [
      'ContractTotalVarasStored',
      "GetAdmins",
      'GetAllProperties',
      'GetCarbonCertificates',
      'GetDevices',
      'GetEnergyProductionStats',
      'GetMitings',
      'GetSwapTotalsGaiaeToGaiaCompany',
      'GetTotalSupplyGaiaCompany',
      'GetTotalSupplyGaiaE',
      'GetTransferRecords',
      'TokensToSwapOneVara',
      'TotalTokensCompany',
      'TotalTokensEnergy',
      'TotalTokensToSwap',
      'TotalTokensToSwapAsU128'
    ];

    // Ejecutar todas las queries en paralelo
    const queryPromises = methods.map((method) => executeQueryForAll('GaiaService', method, []));
    const results = await Promise.all(queryPromises);

        // Ejecutar GetProducers
        const allProducers = await executeQueryForAll('GaiaService', 'GetProducers', []);

        // Obtener solo los últimos 100 productores
        const last100Producers = allProducers.producers.slice(-100);
    
        // Agregar los productores al resultado
        results.push({ producers: last100Producers, totalProducers: allProducers.length });
    
    

    // Devolver todos los resultados juntos
    res.status(200).send(results);
  } catch (e) {
    console.error('Error while executing queries:', e);
    res.status(400).send(e);
  }
};


//
const postService = async (req,res) =>{
  const {service,method} = req.params
  const callArguments = Array.isArray(req.body) ? req.body : [];
  try {
    const response = await executeCommand(service,method,callArguments)
    res.status(200).send(response)
  } catch (error) {
    res.status(400).send(error)
    
  }
}

module.exports = {
    executeCommand,
    executeQuery,
    initializeConnection ,
    postService,
    executeAllQueries
    
};