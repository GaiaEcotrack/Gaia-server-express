const { mnemonicGenerate } = require('@polkadot/util-crypto');
const { Keyring } = require('@polkadot/keyring');

async function createWallet(req, res) {
  try {
    // 1. Generar el mnemónico
    const mnemonic = mnemonicGenerate();

    // 2. Crear keyring
    const keyring = new Keyring({ type: 'sr25519' });

    // 3. Crear el par de claves desde el mnemónico
    const pair = keyring.addFromMnemonic(mnemonic);

    // 4. Exportar datos en JSON (ESTO es lo correcto)
    const json = pair.toJson();

    return res.json({
      address: pair.address,
      mnemonic,
      json
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createWallet };
