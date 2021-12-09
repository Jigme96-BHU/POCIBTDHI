const ganache = require('ganache-cli');
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const upload = require('./lib/upload');
const Web3 = require('web3');
const {powerUp, web3} = require('./lib/powerUp');
const { number } = require('yargs');
dotenv.config({ path: './.env'});

const port = process.env.PORT || 1000;
const eth_port = process.env.ETH_PORT || 8545
const network_id = process.env.NETWORK_ID || 5777
let blockchain

const details = async (hash, blockNumber, event = undefined)=>{
    const timestamp = (await web3.eth.getBlock(blockNumber)).timestamp
    const date = (new Date(timestamp * 1000)).toISOString().split('T')[0]
    const events = await powerUp.getPastEvents('powerAdded',{fromBlock:blockNumber, toBlock:blockNumber})
    if(!event) event = events.find(i => i.returnValues.hash === hash)
    const station = event.returnValues.station
    const value = Number(event.returnValues.value) / 1000000
    const total = Number(event.returnValues.total) / 1000000
    const unit = 'GWh'
    return { date, station, value, hash, total, unit, block: blockNumber, transaction: event.transactionIndex }
}

const ganacheServer = ganache.server({
    deterministic: true, 
    mnemonic: 'buzz carbon minute major tackle price green dutch latin window extend sadness',
    db_path: __dirname + '/db',
    network_id
})

ganacheServer.listen(eth_port,(err,chain)=>{
    if(err) return console.error(err)
    blockchain = chain
    console.log(Object.keys(blockchain.accounts))
})

const app = express();

app.use(express.static(__dirname + '/public'));
app.set('json spaces', 4);

app.get('/stations',async(req,res)=>{
    const station = []
    let number = 1
    for (const address in blockchain.accounts){
        station.push({
            station:`station ${number++}`,
            address,
            total: (await powerUp.methods.total().call({from: address })/ 1000000)
        })
    }
    res.json(station)
})

app.post('/verify',upload, async (req,res)=>{

    if(req.uploadError)
        return res.status(400).json({
            success:false,
            message: req.uploadError
        })

    const hash = web3.utils.keccak256(req.file.buffer);

    const blockNumber = Number(await powerUp.methods.validate(hash).call())

    if(blockNumber <= 0)
        return res.status(200).json({
            success:true,
            varified: false,
            message: 'given image is not part of blockchain'
        })
    res.status(200).json({
        success:true,
        verified:true,
        details: await details(hash, blockNumber)
    })
})

app.post('/add',upload,async(req,res) =>{
    if (req.uploadError || req.file.buffer.length === 0)
        return res.status(400).json({
            success:false,
            message: req.uploadError || 'invalid file data'
        })

    const hash =  Web3.utils.keccak256(req.file.buffer);
    const blockNumber = Number(await powerUp.methods.validate(hash).call())
    if (blockNumber > 0)
        return res.status(400).json({
            success:false,
            message: 'given image is already part of the blockchain',
            details: await details(hash, blockNumber)
        })
    if (!req.body.value) return res.status(400).json({
        success: false,
        message: 'value of power generated in GWH is required'
    })

    try{
        const value = Number(req.body.value)
        
        const address = req.body.address || '0xD396Ef4A05597702040099C34ef0fcaa4C5FbbCf'

        const result = await powerUp.methods.add(value,hash).send({from: address})
        res.status(201).json({
            success: true,
            details: await details(hash, result.blockNumber, result.event)
        })

    }catch (err){
        return res.status(400).json({
            success: false,
            message: err.message || err
        })
    }
})


app.listen(port,()=>{
    console.log(`app started at port ${port}`);
});