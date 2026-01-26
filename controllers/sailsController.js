const {
  sailsInstance,
  signerFromAccount,
} = require("../services/SailsService/utils");

//INFO CONTRACT
const network = "wss://testnet.vara.network"; // network, testnet
const contractId =
  "0xa234c1c4b6f0485825d40714a7505e2d423697c288c0298031d4e0d1273c669c";
const idl = `
type GaiaErrors = enum {
  MinTokensToAdd: u128,
  AdminExist,
  UserAlreadyExists,
  CantSwapTokens: struct {
    tokens_in_vft_contract: u256
  },
  CantSwapUserTokens: struct {
    user_tokens: u256,
    tokens_to_swap: u256,
  },
  ContractCantMint,
  CantSwapTokensWithAmount: struct {
    min_amount: u128,
    actual_amount: u128,
  },
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
  InvalidPropertyValue: struct {
    str,
    u256,
  },
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
  CantSwapVftWithAmount: struct {
    min_amount: u128,
    actual_amount: u128,
  },
  CompanyTokenContractIdNotSet,
  InsufficientBalanceEnergy: struct {
    required: u256,
    available: u256,
  },
  TransferFailed,
  BalanceCheckFailed,
  ApprovalFailed,
  BurnFailed,
  InvalidMinTokensToAdd,
  NotificationFailed,
  InvalidTokenAmount: struct {
    amount: u128,
    divisible_by: u128,
  },
  InvalidConfiguration: str,
  CertificateHashAlreadyUsed,
  CarbonCreditNotFound,
  GaiaCContractIdNotSet,
};

type PropertyName = enum {
  KwhPerToken,
  GaiaEToGaiaRate,
  MinConversionAmount,
  MaxDailyConversion,
  MinGaiaETransfer,
  MaxGaiaEPerKwh,
  ConversionCooldown,
  ConversionRateVftToCompany,
};

type ConfigurableConstants = struct {
  max_devices: u32,
  max_schedules: u32,
  max_mint_amount: u128,
  min_mint_amount: u128,
  max_records: u32,
  max_iterations: u32,
  max_time_range_ms: u64,
  max_daily_conversions: u32,
  max_carbon_credits: u32,
  max_future_minting_ms: u64,
  cooldown_period_ms: u64,
  max_transfer_limit: u128,
  max_real_transfer_limit: u128,
  max_real_company_tokens: u128,
  tokens_per_vara: u128,
  min_tokens_to_add: u128,
};

type GaiaQueryEvents = enum {
  ContractBalanceInVaras: u128,
  Mitings: vec MintingSchedule,
  Devices: vec Devices,
  TotalTokensUserEnergy: u128,
  TotalTokensUserCompany: u128,
  UserTotalTokensAsU128: u128,
  UserTotalTokens: u256,
  TotalTokensToSwap: u256,
  TotalTokensToSwapEnergyAndCompany: struct {
    u128,
    u128,
  },
  TotalTokensToSwapAsU128: u128,
  TokensToSwapOneVara: u128,
  NumOfTokensForOneVara: u128,
  Error: GaiaErrors,
  Producers: vec EnergyProduction,
  PropertiesFetched: GaiaProperties,
  CarbonCertificates: vec CarbonCertificates,
  CarbonCredits: vec CarbonCredit,
  TransferRecords: vec TransferRecord,
  UserInfo: struct {
    wallet: actor_id,
    gaia_e_balance: u128,
    gaia_company_balance: u128,
    devices: vec Devices,
    total_kwh: u128,
    total_gaia_e_minted: u128,
    carbon_certificates: vec CarbonCertificates,
    transfer_records: vec TransferRecord,
    minting_schedules: vec MintingSchedule,
  },
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
  conversion_rate_vft_to_company: u256,
};

type CarbonCertificates = struct {
  owner: actor_id,
  certificate_id: str,
  value: u256,
  issue_date: u64,
  expiry_date: u64,
};

type CarbonCredit = struct {
  project_id: str,
  co2_tonnes: u32,
  certificate_hash: str,
  verifier_name: str,
  gps_coords: str,
  owner: actor_id,
  timestamp_range: struct { u64, u64 },
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
  NewWithData : (vft_contract_id: opt actor_id, gaia_company_token: opt actor_id, gaia_C: opt actor_id, min_tokens_to_add: u128, tokens_per_vara: u128, gaia_e_to_gaia_rate: u256, min_conversion_amount: u256, max_daily_conversion: u256, min_gaia_e_transfer: u256, max_gaia_e_per_kwh: u256, kwh_por_token: u256, conversion_cooldown: u64);
};

service GaiaService {
  AddAdmin : (new_admin: actor_id) -> result (null, GaiaErrors);
  AddCarbonCertificate : (owner: actor_id, certificate_id: str, value: u256, issue_date: u64, expiry_date: u64) -> result (null, GaiaErrors);
  AddCompanyToken : (tokens_to_add: u128) -> result (null, GaiaErrors);
  AddDevice : (owner: actor_id, serial_number: str, location: str, type_device: str, device_brand: str) -> result (null, GaiaErrors);
  AddTokensToContract : (tokens_to_add: u128) -> result (null, GaiaErrors);
  ChangeCooldown : (conversion_cooldown: u64) -> result (null, GaiaErrors);
  ChangeProperty : (property: PropertyName, value: u256) -> result (null, GaiaErrors);
  ExecuteMintings : (time: u64) -> result (null, GaiaErrors);
  MintTokensToUser : (recipient: actor_id, amount: u256) -> result (null, GaiaErrors);
  RemoveAdmin : (admin_to_remove: actor_id) -> result (null, GaiaErrors);
  ScheduleMinting : (wallet: actor_id, amount: u128, minting_time: u64) -> result (null, GaiaErrors);
  SetMinTokensToAdd : (min_tokens_to_add: u128) -> result (null, GaiaErrors);
  SetTokensPerVara : (tokens_per_vara: u128) -> result (null, GaiaErrors);
  SetVftContractId : (new_vft_contract_id: actor_id) -> result (null, GaiaErrors);
  SwapGaiaEnergyToGaia : (from: actor_id, amount_of_vft: u128) -> result (null, GaiaErrors);
  SwapTokensByNumOfVaras : () -> result (null, GaiaErrors);
  SwapTokensToVaras : (amount_of_tokens: u128) -> result (null, GaiaErrors);
  TokenizeCarbonCredit : (project_id: str, co2_tonnes: u32, certificate_hash: str, verifier_name: str, gps_coords: str, recipient: actor_id, start_date: u64, end_date: u64) -> result (null, GaiaErrors);
  TransferGaiaCompanyToken : (from: actor_id, to: actor_id, amount: u128) -> result (null, GaiaErrors);
  TransferGaiaETokens : (from: actor_id, to: actor_id, amount: u128) -> result (null, GaiaErrors);
  TransferOwnership : (new_owner: actor_id) -> result (null, GaiaErrors);
  UpdateConfig : (new_config: ConfigurableConstants) -> result (null, GaiaErrors);
  query ContractTotalVarasStored : () -> GaiaQueryEvents;
  query GetAllProperties : () -> GaiaQueryEvents;
  query GetCarbonCredits : (owner: actor_id) -> GaiaQueryEvents;
  query GetConfig : () -> ConfigurableConstants;
  query GetDevices : () -> GaiaQueryEvents;
  query GetEnergyProductionStats : (producer: actor_id, start_time: u64, end_time: u64) -> result (struct { u256, u256 }, GaiaErrors);
  query GetMintings : () -> GaiaQueryEvents;
  query GetProducers : () -> GaiaQueryEvents;
  query GetSwapTotalsGaiaeToGaiaCompany : () -> GaiaQueryEvents;
  query GetTotalSupplyGaiaCompany : () -> result (u256, GaiaErrors);
  query GetTotalSupplyGaiaE : () -> result (u256, GaiaErrors);
  query GetTransferRecords : () -> GaiaQueryEvents;
  query GetUserInfo : (wallet: actor_id) -> result (GaiaQueryEvents, GaiaErrors);
  query TokensToSwapOneVara : () -> GaiaQueryEvents;
  query TotalTokensCompany : (wallet: actor_id) -> result (u128, GaiaErrors);
  query TotalTokensEnergy : (wallet: actor_id) -> result (u128, GaiaErrors);
  query TotalTokensToSwap : () -> result (u256, GaiaErrors);
  query TotalTokensToSwapAsU128 : () -> result (u128, GaiaErrors);

  events {
    VFTContractIdChanged: struct {
      old: opt actor_id,
      new: opt actor_id,
    };
    TokensSwapSuccessfullyEnergy: struct {
      total_tokens: u128,
      total_company_tokens: u128,
    };
    ApprovalSuccessful: struct {
      owner: actor_id,
      spender: actor_id,
      amount: u128,
    };
    RefundOfVaras: u128;
    VFTContractIdSet;
    CertificateAdded: str;
    AdminRemoved: actor_id;
    DevicesAdded: str;
    MinTokensToAddSet;
    TokensAdded: str;
    TokensBurned;
    SetTokensPerVaras;
    MintingScheduled: str;
    MintingExecuted: struct {
      successful: u32,
      failed: u32,
    };
    TotalSwapInVaras: u128;
    TokensSwapSuccessfully: struct {
      total_tokens: u128,
      total_varas: u128,
    };
    AdminAdded: actor_id;
    Error: GaiaErrors;
    TransferSuccessful: struct {
      from: actor_id,
      to: actor_id,
      amount: u128,
      timestamp: u64,
    };
    TotalSupplyRetrieved: u256;
    PropertyChanged: struct {
      str,
      u256,
    };
    CooldownChanged: struct {
      old_value: u64,
      new_value: u64,
    };
    OwnershipTransferred: struct {
      from: actor_id,
      to: actor_id,
    };
    ConfigUpdated: struct {
      old_config: ConfigurableConstants,
      new_config: ConfigurableConstants,
    };
    CarbonCreditTokenized: struct {
      token_id: u32,
      co2_tonnes: u32,
      owner: actor_id,
    };
    CarbonCreditTransferred: struct {
      token_id: u32,
      from: actor_id,
      to: actor_id,
    };
  }
};





`;

const accountName = "Admin";
const accountMnemonic = process.env.MNEMONIC;
// Definir la función para ejecutar el comando
//send tokens

// Almacenar las instancias para reutilizarlas
let sailsCalls = null;
let keyring = null;

const getSails = async () => {
  if (
    !sailsCalls ||
    !sailsCalls.api ||
    !sailsCalls.api.isConnected
  ) {
    console.log("🔄 Reconectando a Vara...");

    sailsCalls = await sailsInstance(network, contractId, idl);
    keyring = await signerFromAccount(accountName, process.env.MNEMONIC);

    console.log("✅ Conectado a Vara");
  }

  return { sailsCalls, keyring };
};
const initializeConnection = async () => {
  try {
    if (!process.env.MNEMONIC) {
      throw new Error("MNEMONIC no está definido");
    }

    if (!sailsCalls || !keyring) {
      console.log("Inicializando conexión a la red y keyring...");
      sailsCalls = await sailsInstance(network, contractId, idl);
      keyring = await signerFromAccount(accountName, process.env.MNEMONIC);
      console.log("Conexión con Vara establecida correctamente");
    }

    return { success: true };
  } catch (e) {
    console.error("❌ Error al inicializar conexión con Vara:", e);
    return { success: false, error: e.message }; // ✅ NO throw
  }
};

const executeCommand = async (service, method, callArguments = []) => {
  try {
    const { sailsCalls, keyring } = await getSails();

    return await sailsCalls.command(
      `${service}/${method}`,
      keyring,
      { callArguments }
    );
  } catch (e) {
    console.error("❌ Error command:", e.message);
    throw e;
  }
};

const executeQueryForAll = async (service, method, callArguments = []) => {
  try {
    const { sailsCalls } = await getSails();

    return await sailsCalls.query(
      `${service}/${method}`,
      { callArguments }
    );
  } catch (e) {
    console.error(`❌ Error en query ${method}:`, e.message);
    return null;
  }
};
// Definir la función para ejecutar la consulta
const executeQuery = async (req, res) => {
  try {
    const { service, method } = req.params;
    const callArguments = Array.isArray(req.body) ? req.body : [];
    // Set the SailsCalls instance
    const sailsCalls = await sailsInstance(network, contractId, idl);

    // Enviar la consulta al programa
    const response = await sailsCalls.query(`${service}/${method}`, {
      callArguments,
    });

    console.log(callArguments);

    // Retornar la respuesta
    res.status(200).send(response);
  } catch (e) {
    console.error("Error while reading state:", e);
    res.status(400).send(e);
  }
};
const executeAllQueries = async (req, res) => {
  try {
    const methods = [
      "ContractTotalVarasStored",
      "GetAllProperties",
      "GetConfig",
      "GetDevices",
      "GetMintings",
      "GetProducers",
      "GetSwapTotalsGaiaeToGaiaCompany",
      "GetTransferRecords",
      "TokensToSwapOneVara",
      "TotalTokensToSwap",
      "TotalTokensToSwapAsU128",
    ];

    const results = {};

    await Promise.all(
      methods.map(async (method) => {
        const response = await executeQueryForAll("GaiaService", method, []);
        results[method] = response;
      }),
    );

    // Ejemplo: limitar producers si vienen muchos
    if (results.GetProducers?.Producers) {
      results.GetProducers.Producers =
        results.GetProducers.Producers.slice(-100);
    }

    res.status(200).send(results);
  } catch (e) {
    console.error("Error while executing queries:", e);
    res.status(400).send(e);
  }
};

const executeDynamicQueries = async (queries) => {
  if (!sailsCalls) {
    throw new Error("Sails no inicializado. Llamá a initializeConnection()");
  }

  const queriesArray = Array.isArray(queries) ? queries : [queries];
  const result = {};

  await Promise.all(
    queriesArray.map(async ({ service, method, args = [] }) => {
      try {
        const response = await sailsCalls.query(
          `${service}/${method}`,
          { callArguments: args }
        );

        result[method] = {
          ok: true,
          data: response,
        };
      } catch (error) {
        result[method] = {
          ok: false,
          error: error?.message || String(error),
        };
      }
    })
  );

  return result;
};

const executeQueriesController = async (req, res) => {
  try {
    const result = await executeDynamicQueries(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//
const postService = async (req, res) => {
  const { service, method } = req.params;
  const callArguments = Array.isArray(req.body) ? req.body : [];
  try {
    const response = await executeCommand(service, method, callArguments);
    res.status(200).send(response);
  } catch (error) {
    res.status(400).send(error);
  }
};

module.exports = {
  executeCommand,
  executeQuery,
  initializeConnection,
  postService,
  executeAllQueries,
  executeQueryForAll,
  executeQueriesController,
};
