const Generador = require('../models/generador');
const {GearApi , ProgramMetadata , GearKeyring ,GasInfo, decodeAddress,encodeAddress} = require('@gear-js/api')


const gasToSpend = (gasInfo) => {
  const gasHuman = gasInfo.toHuman();
  const minLimit = gasHuman.min_limit?.toString() ?? "0";
  const parsedGas = Number(minLimit.replaceAll(",", ""));
  const gasPlusTenPorcent = Math.round(parsedGas + parsedGas * 0.1);
  const gasLimit = BigInt(gasPlusTenPorcent);
  return gasLimit;
};


const sendMessageContract = async(wallet,tokens,kw)=>{
  const gearApi = await GearApi.create({ providerAddress: 'wss://testnet.vara-network.io' });
  const programIDFT = process.env.MAIN_CONTRACT_ID
  const meta = process.env.MAIN_CONTRACT_METADATA
  const metadata = ProgramMetadata.from(meta);
  const generadorUser = await Generador.find();

  const gas = await gearApi.program.calculateGas.handle(
    decodeAddress(wallet) ?? "0x00",
    programIDFT,
    { GetRewards: {
      "tx_id":null,
      "tokens": tokens,
      "password": "E15597AF98B7CC76E088FE55EE4A2E7BA8C73CF71264C272FE1FABBAF5111BA6",
      "transactions": {
          "to": decodeAddress(wallet),
          "amount": tokens,
          "kw": kw,
          "surplus": 10
      }
  } },
    0,
    true,
    metadata
  );

  const message= {
    destination: programIDFT, // programId
    payload: {
      getrewards:{
        "tx_id":null,
        "tokens": tokens,
        "password": "E15597AF98B7CC76E088FE55EE4A2E7BA8C73CF71264C272FE1FABBAF5111BA6",
        "transactions": {
            "to": decodeAddress(wallet),
            "amount": tokens,
            "kw": kw,
            "surplus": 10
        }
    },
    },
    gasLimit: gasToSpend(gas),
    value: 0,
  };

  async function signer() {
    // Create a message extrinsic
    const transferExtrinsic = await gearApi.message.send(message, metadata);
    const mnemonic = 'sun pill sentence spoil ripple october funny ensure illness equal car demise';
    const { seed } = GearKeyring.generateSeed(mnemonic);
  
    const keyring = await GearKeyring.fromSeed(seed, 'admin');
    

    await transferExtrinsic.signAndSend(keyring, (event) => {

      try {
        console.log("Successful transaction");
      } catch (error) {
        console.log("error");

      }
    });

}
try {

  await signer()
} catch (error) {
  console.error(error);
}

}

// Controlador para registrar los kW generados por un usuario
const generateKW = async (req, res) => {
  const { userId, kw } = req.body;

  try {
    const generador = await Generador.findById(userId);

    if (!generador) {
      return res.status(404).send('Usuario no encontrado');
    }

    generador.generatedKW += kw;
    await generador.save();

    res.send('kW registrados correctamente');
  } catch (error) {
    res.status(500).send('Error al registrar kW');
  }
};

// Controlador para obtener los tokens de un usuario
const getUserTokens = async (req, res) => {
  const { userId } = req.params;

  try {
    const generador = await Generador.findById(userId);

    if (!generador) {
      return res.status(404).send('Usuario no encontrado');
    }

    res.json({ tokens: generador.tokens });
  } catch (error) {
    res.status(500).send('Error al obtener los tokens del usuario');
  }
};

// Controlador para obtener todos los usuarios
const getAllUsers = async (req, res) => {
  try {
    const generadores = await Generador.find();
    res.json(generadores);
  } catch (error) {
    res.status(500).send('Error al obtener los usuarios');
  }
};

// Controlador para agregar un nuevo usuario
const addUser = async (req, res) => {
  const { name , wallet , secret_name } = req.body;

  try {
    const newGenerador = new Generador({ name,wallet,secret_name });
    await newGenerador.save();

    res.status(201).send('Usuario agregado correctamente');
  } catch (error) {
    res.status(500).send('Error al agregar usuario');
  }
};

const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const deletedUser = await Generador.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).send('Usuario no encontrado');
    }
    res.send('Usuario eliminado correctamente');
  } catch (error) {
    res.status(500).send('Error al eliminar usuario');
  }
};

// Función para actualizar los tokens de los usuarios
const updateTokens = async () => {
  try {
    const generadores = await Generador.find();

    for (const generador of generadores) {
      generador.tokens += generador.generatedKW;
      generador.generatedKW = 0;
      await generador.save();
    }

    console.log('Tokens actualizados correctamente');
  } catch (error) {
    console.error('Error al actualizar tokens', error);
  }
};

module.exports = {
  generateKW,
  getUserTokens,
  getAllUsers,
  addUser,
  updateTokens,
  deleteUser,
  sendMessageContract
};
