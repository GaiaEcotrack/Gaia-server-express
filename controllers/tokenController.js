const Generador = require('../models/generador');
const { faker } = require('@faker-js/faker');
const {GearApi , ProgramMetadata , GearKeyring ,GasInfo, decodeAddress,encodeAddress} = require('@gear-js/api');
const { reject } = require('async');



const gearApiInstance = new GearApi({ providerAddress: 'wss://testnet.vara-network.io' });

const gasToSpend = (gasInfo) => {
  const gasHuman = gasInfo.toHuman();
  const minLimit = gasHuman.min_limit?.toString() ?? "0";
  const parsedGas = Number(minLimit.replaceAll(',', ''));
  const gasPlusTenPorcent = Math.round(parsedGas + parsedGas * 0.10);
  const gasLimit = BigInt(gasPlusTenPorcent);
  return gasLimit;
}

const sendMessageContract = async (wallet, tokens, kw) => {
  try {
    const programIDFT = process.env.MAIN_CONTRACT_ID;
    const meta = process.env.MAIN_CONTRACT_METADATA;
    const metadata = ProgramMetadata.from(meta);

    const gas = await gearApiInstance.program.calculateGas.handle(
      decodeAddress('5CM3F7Rn2JNUTYfPLQ9a3L6mMVAiQQ2rWV1X2azmXyxTgmxF') ?? "0x00",
      programIDFT,
      {
        GetRewards: {
          tx_id: null,
          to:decodeAddress(wallet),
          tokens: Number(tokens),
          password:"E15597AF98B7CC76E088FE55EE4A2E7BA8C73CF71264C272FE1FABBAF5111BA6"
        },
      },
      0,
      false,
      metadata
    );

    const message = {
      destination: programIDFT,
      payload: {
        GetRewards: {
          tx_id: null,
          to:decodeAddress(wallet),
          tokens: Number(tokens),
          password:"E15597AF98B7CC76E088FE55EE4A2E7BA8C73CF71264C272FE1FABBAF5111BA6"
        },
      },
      gasLimit: gasToSpend(gas),
      value: 0,
    };
    console.log(gasToSpend(gas));
    


    const transferExtrinsic = await gearApiInstance.message.send(message, metadata);
    const {nonce} = await gearApiInstance.query.system.account("5CM3F7Rn2JNUTYfPLQ9a3L6mMVAiQQ2rWV1X2azmXyxTgmxF")

    const mnemonic = 'sun pill sentence spoil ripple october funny ensure illness equal car demise';
    const { seed } = GearKeyring.generateSeed(mnemonic);
    const keyring = await GearKeyring.fromSeed(seed, 'admin');

    return new Promise((resolve, reject) => {
      transferExtrinsic.signAndSend(keyring, {nonce: nonce}, ({ status }) => {
        if (status.isInBlock) {
          console.log("Transaction in the block");
        } else if (status.isFinalized) {
          console.log("Transaction completed");
          resolve(true);
        }
      }).catch(error => {
        console.error("Error al manejar evento de transacción:", error);
        reject(error);
      });
    });
  } catch (error) {
    console.error("Error en sendMessageContract:", error);
    throw error; // Propagar el error para manejarlo adecuadamente en el contexto superior
  }
};
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
  const { name , wallet , secret_name,installation_company,brand ,country,departament,municipality} = req.body;

  try {
    const newGenerador = new Generador({ name,wallet,secret_name,installation_company,brand,country,departament,municipality });
    await newGenerador.save();

    res.status(201).send('Usuario agregado correctamente');
  } catch (error) {
    res.status(500).send('Error al agregar usuario');
    console.log(error);
    
  }
};



const updateUser = async (req, res) => {
  const userId = req.params.id;
  const updates = req.body;

  try {
    const user = await Generador.findById(userId);
    if (!user) {
      return res.status(404).send('Usuario no encontrado');
    }

    // Actualizar solo las propiedades recibidas en la solicitud
    for (let key in updates) {
      if (user[key] !== undefined) {
        user[key] = updates[key];
      }
    }

    await user.save();

    res.status(200).send('Usuario actualizado correctamente');
  } catch (error) {
    res.status(500).send('Error al actualizar usuario');
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
const deleteAllUsers = async (req, res) => {
  try {
    await Generador.deleteMany({});
    res.status(200).send('Todos los usuarios han sido eliminados');
  } catch (error) {
    res.status(500).send('Error eliminando usuarios: ' + error.message);
  }
};

const updateUsersWallet = async (req, res) => {
  try {
    // Actualiza solo los documentos que no tienen la propiedad wallet
    const result = await Generador.updateMany(
      { wallet: { $exists: false } }, // Filtro para usuarios sin la propiedad wallet
      {
        $set: {
          wallet: "5HTJkawMqHSvVRi2XrE7vdTU4t5Vq1EDv2ZDeWSwNxmmQKEK",
        }
      }
    );
    res.status(200).json({ message: 'Usuarios actualizados' });
    console.log(`Usuarios actualizados: ${result.nModified}`);
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando usuarios', error });
    console.error('Error actualizando usuarios:', error);
  }
};

// controlador para filtrar usuarios segun empresa instaladora
const getUsersByInstaller = async (req, res) => {
  const { installation_company } = req.params;

  try {
    const generadores = await Generador.find({ installation_company });

    if (!generadores.length) {
      return res.status(404).send('No se encontraron usuarios para la empresa instaladora proporcionada');
    }

    res.json(generadores);
  } catch (error) {
    res.status(500).send('Error al obtener usuarios por empresa instaladora');
  }
};


// controlador para filtrar usuarios el pais
const getUserByCountry = async (req, res) => {
  const { country } = req.params;

  try {
    const generadores = await Generador.find({ country });

    if (!generadores.length) {
      return res.status(404).send('No se encontraron usuarios en el país seleccionado');
    }

    // Sumar los `generatedKW` de todos los usuarios filtrados
    const totalKW = generadores.reduce((sum, generador) => sum + (generador.generatedKW || 0), 0);

    const totalC02 = generadores.reduce((sum, generador) => sum + (generador.c02 || 0), 0);

    const totalRated = generadores.reduce((sum, generador) => sum + (generador.rated_power || 0), 0);

    res.json({ usuarios: generadores, totalKW ,totalC02 , totalRated  });
  } catch (error) {
    res.status(500).send(`Error al obtener usuarios por país: ${error.message}`);
  }
};


// controlador para filtrar usuarios segun el departamento
const getUserByDepartament = async (req, res) => {
  const { departament } = req.params;

  try {
    const generadores = await Generador.find({ departament });

    if (!generadores.length) {
      return res.status(404).send('No se encontraron usuarios en el departamento seleccionado');
    }
    // Sumar los `generatedKW` de todos los usuarios filtrados
    const totalKW = generadores.reduce((sum, generador) => sum + (generador.generatedKW || 0), 0);

    const totalC02 = generadores.reduce((sum, generador) => sum + (generador.c02 || 0), 0);

    const totalRated = generadores.reduce((sum, generador) => sum + (generador.rated_power || 0), 0);

    res.json({ usuarios: generadores, totalKW ,totalC02 , totalRated  });
  } catch (error) {
    res.status(500).send('Error al obtener usuarios por departamento',error);
  }
};

// Controlador para crear 100 usuarios
const createUsers = async (req, res) => {
  const users = [];
  const company = ["Fibra_Andina","Green_House","Proselec","Fullenergysolar"]
  const secretNames = ["Monitoreo_3", "Monitoreo_2", "Monitoreo_Hoymiles"];
  const wallets =["5CM3F7Rn2JNUTYfPLQ9a3L6mMVAiQQ2rWV1X2azmXyxTgmxF","5CwBHsfFRpSwA4zFgJC7RDdAZXckqSiHS8PQtYQ81SBjCWeS","5FWNZQuDEbLSgT9KKzbQjFiiLhyxWfDAyusFvd7tshWKbo1U","5HTJkawMqHSvVRi2XrE7vdTU4t5Vq1EDv2ZDeWSwNxmmQKEK","5G8mzxiCCW4VALGRGdaqGPfrMLp7CeaVfk5XwPhDDaDyGEgE"]
  const brand = ["Hoymiles","Growatt"]

  for (let i = 0; i < 100; i++) {
    users.push({
      name: faker.name.fullName(),
      wallet: wallets[Math.floor(Math.random() * wallets.length)],
      secret_name: secretNames[Math.floor(Math.random() * secretNames.length)],
      installation_company:company[Math.floor(Math.random() * company.length)],
    });
  }

  try {
    for (const user of users) {
      await addUser({ body: user }, { status: (code) => ({ send: (message) => console.log(message) }) });
    }
    res.status(200).send('100 usuarios creados con éxito');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al crear usuarios');
  }
};
const countUsers = async (req, res) => {
  try {
    const count = await Generador.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).send('Error al contar usuarios');
  }
};

module.exports = {
  generateKW,
  getUserTokens,
  getAllUsers,
  addUser,
  updateTokens,
  deleteUser,
  sendMessageContract,
  updateUser,
  getUsersByInstaller,
  createUsers,
  countUsers,
  deleteAllUsers,
  getUserByCountry,
  getUserByDepartament,
  updateUsersWallet
};
