"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sailsInstance = exports.signerFromAccount = void 0;
const api_1 = require("@gear-js/api");
const SailsCalls_1 = __importDefault(require("./SailsCalls"));
/**
 * Returns Keyring to sign messages
 * Helper functions that returns a Keyring from an account name and account mnemonic
 * @param accountName acount name to get keyring
 * @param accountMnemonic account mnemonic to get keyring
 * @returns KeyringPair to sign messages (commands)
 */
const signerFromAccount = (accountName, accountMnemonic) => {
    return new Promise(async (resolve, reject) => {
        try {
            const signer = await api_1.GearKeyring.fromMnemonic(accountMnemonic, accountName);
            resolve(signer);
        }
        catch (e) {
            reject(e);
        }
    });
};
exports.signerFromAccount = signerFromAccount;
/**
 * Returns a SailsCalls instance
 * Helper functions that returns an instance of SailsCalls.
 * @param network network to connect (testnet o mainnet)
 * @param contractId contract id to send messages or queries
 * @param idl idl to set methods of a contract
 * @param accountName accouunt name in case to use vouchers
 * @param accountMnemonic account mnemonic in case to use vouchers (optional)
 * @returns SailsCalls instance
 */
const sailsInstance = (network, contractId, idl, accountName, accountMnemonic) => {
    return new Promise(async (resolve, reject) => {
        let sailsCalls = null;
        try {
            sailsCalls = await SailsCalls_1.default.new({
                network,
                contractId,
                idl
            });
        }
        catch (e) {
            reject(e);
            return;
        }
        try {
            if (accountName && accountMnemonic) {
                await sailsCalls.withAccountToSignVouchers(accountMnemonic, accountName);
            }
        }
        catch (e) {
            console.error('signer account for vouchers not set');
        }
        resolve(sailsCalls);
    });
};
exports.sailsInstance = sailsInstance;
