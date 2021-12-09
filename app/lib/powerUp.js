const Web3 = require('web3');
const rpcUrl = 'ws://127.0.0.1:8545'
const web3 = new Web3(rpcUrl)

const my_address = '0xD396Ef4A05597702040099C34ef0fcaa4C5FbbCf'

const abi = require('../../build/contracts/PowerUp.json').abi

const contract_address = '0x665625DD17e6e7BAe40CF8613C51F6fe27d07bBc'

const powerUp = new web3.eth.Contract(abi, contract_address, { from: my_address})

module.exports = {powerUp, web3}