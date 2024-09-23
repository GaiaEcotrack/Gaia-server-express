const { sailsInstance, signerFromAccount } = require('../services/SailsService/utils');



//INFO CONTRACT 
const network = 'wss://testnet.vara.network'; // network, testnet
const contractId = '0xed711dc0106be9afd1501018c9fbae2d02cc34b661a6970ad32862e9e168ad51';
const idl = `type MiniDexsEvents = enum {
  RefundOfVaras: u128,
  VFTContractIdSet,
  DevicesAdded: str,
  MinTokensToAddSet,
  TokensAdded,
  SetTokensPerVaras,
  MintingScheduled: str,
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
  TotalTokensUserEnergy: u128,
  TotalTokensUserCompany: u128,
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
  NewWithData : (vft_contract_id: opt actor_id, gaia_company_token: opt actor_id, min_tokens_to_add: u128, tokens_per_vara: u128);
};

service GaiaService {
  AddCompanyToken : (tokens_to_add: u128) -> MiniDexsEvents;
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
  TransferFromTokensCompany : (from: actor_id, to: actor_id, amount: u128) -> MiniDexsEvents;
  TransferFromTokensEnergy : (from: actor_id, to: actor_id, amount: u128) -> MiniDexsEvents;
  TransferTokensCompany : (recipient: actor_id, amount: u128) -> MiniDexsEvents;
  TransferTokensToUser : (recipient: actor_id, amount: u128) -> MiniDexsEvents;
  query ContractTotalVarasStored : () -> MiniDexsQueryEvents;
  query GetDevices : () -> MiniDexsQueryEvents;
  query GetMitings : () -> MiniDexsQueryEvents;
  query TokensToSwapOneVara : () -> MiniDexsQueryEvents;
  query TotalTokensCompany : (wallet: actor_id) -> MiniDexsQueryEvents;
  query TotalTokensEnergy : (wallet: actor_id) -> MiniDexsQueryEvents;
  query TotalTokensToSwap : () -> MiniDexsQueryEvents;
  query TotalTokensToSwapAsU128 : () -> MiniDexsQueryEvents;
};


`;

const accountName = 'Admin';
const accountMnemonic = 'sun pill sentence spoil ripple october funny ensure illness equal car demise';
// Definir la función para ejecutar el comando
//send tokens

// Almacenar las instancias para reutilizarlas
let sailsCalls = null;
let keyring = null;

const initializeConnection = async () => {
    if (!sailsCalls || !keyring) { // Solo inicializar si no están ya instanciados
        console.log('Inicializando conexión a la red y keyring...');
        sailsCalls = await sailsInstance(network, contractId, idl);
        keyring = await signerFromAccount(accountName, accountMnemonic);
    } else {
        console.log('Conexión y keyring ya inicializados.');
    }
};

const executeCommand = async (service, method, callArguments) => {
  try {
      // Asegurarse de que la conexión y el keyring están inicializados
      await initializeConnection();

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
        

        console.log('Response:', response);

        // Retornar la respuesta
        res.status(200).send(response)
    } catch (e) {
        console.error('Error while reading state:', e);
        res.status(400).send(e)
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
};