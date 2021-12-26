const express = require("express");
const Web3 = require('web3')
const fs = require('fs')
const PNG = require('pngjs').PNG
const Contract = require('web3-eth-contract');
const contract = require("../sol/abis/Pixels.json")
const infuraUrl = `https://ropsten.infura.io/v3/${process.env.WEB3_INFURA_PROJECT_ID}`
const infuraWsUrl = `wss://ropsten.infura.io/ws/v3/${process.env.WEB3_INFURA_PROJECT_ID}`
const PORT = 3535;
const PNG_REBUILD_INTERVAL_SECONDS = 20
var DB_HAS_CHANGED = false
Contract.setProvider(infuraWsUrl);


const app = express();
const web3 = new Web3(infuraUrl)


var firebase_admin = require("firebase-admin");
var serviceAccount = require("../secrets/firebase_creds.json");
firebase_admin.initializeApp({
    credential: firebase_admin.credential.cert(serviceAccount),
    databaseURL: "https://polypaint-io-default-rtdb.europe-west1.firebasedatabase.app/"
});
var database = firebase_admin.database();
var PIXEL_TABLE = database.ref("Pixels");
var CACHED_DATABASE = []
for (let i = 0; i < 1000000; i++) {
    CACHED_DATABASE.push(0x2C2E43)
}

async function downloadDatabase() {
    PIXEL_TABLE.once("value", function(snapshot) {
        var downloadedArray = snapshot.val()
        for (const [key, value] of Object.entries(downloadedArray)) {
            if (key >= 0) {
                CACHED_DATABASE[key] = parseInt(value)
            }
        }
        console.log("Initial database download complete");
        updatePng(true)
    });
}



async function initWeb3() {
    const networkId = await web3.eth.net.getId()
    var deployedContract = new Contract(contract.abi, contract.networks[networkId].address);
    return { web3, networkId, contract: deployedContract }
}

async function run_blockchain_mirror() {
    web3_instance = await initWeb3()
    console.log(`Web3 up, network: ${web3_instance.networkId}, contract address: ${web3_instance.contract._address}`);
    console.log("Subscribing to contract...");
    subscribeToTopic(web3_instance)
}

async function subscribeToTopic(web3_instance) {
    const currBlockNo = await web3.eth.getBlockNumber()
    web3_instance.contract.events.PixelColourChanged({ fromBlock: currBlockNo })
        .on("connected", function(subscriptionId) {
            console.log("Connected, subscription id:", subscriptionId);
        })
        .on('data', function(event) {
            let pixelId = String(event.returnValues.pixelId)
            let newPixelColour = String(event.returnValues.newColour)
            console.log(`Got contract PixelColourChanged event. PixelId: ${pixelId}, new colour: ${newPixelColour}`);
            console.log("Updating db...");
            CACHED_DATABASE[pixelId] = newPixelColour
            PIXEL_TABLE.update({
                [pixelId]: newPixelColour
            })
            DB_HAS_CHANGED = true
        })
}

function splitArray(array, part) {
    var tmp = [];
    for (var i = 0; i < array.length; i += part) {
        tmp.push(array.slice(i, i + part));
    }
    return tmp;
}

async function updatePng(override = false) {
    if (DB_HAS_CHANGED || override) {
        console.log('updating image');
        image_grid = splitArray(CACHED_DATABASE, 1000)
        createPng(image_grid)
        DB_HAS_CHANGED = false
    }
}

async function pngUpdator() {
    setInterval(function() { updatePng() }, PNG_REBUILD_INTERVAL_SECONDS * 1000)
}

function createPng(imageData) {
    var png = new PNG({
        width: imageData[0].length,
        height: imageData.length,
        filterType: -1
    });
    for (var y = 0; y < png.height; y++) {
        for (var x = 0; x < png.width; x++) {
            var idx = (png.width * y + x) << 2;
            png.data[idx] = (imageData[y][x] & 0xff0000) >> 16
            png.data[idx + 1] = (imageData[y][x] & 0x00ff00) >> 8
            png.data[idx + 2] = (imageData[y][x] & 0x0000ff)
            png.data[idx + 3] = 255; // alpha (0 is transparent)
        }
    }

    png.pack().pipe(fs.createWriteStream('latest_map.png'));
    console.log('update done');
}

downloadDatabase()
run_blockchain_mirror()
pngUpdator()

app.get("/pixel_data.png", (req, res) => {
    res.sendFile(__dirname + '/latest_map.png');
})

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});