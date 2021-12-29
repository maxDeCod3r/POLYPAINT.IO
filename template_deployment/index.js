const functions = require('firebase-functions');
const express = require("express");
const Web3 = require('web3')
const fs = require('fs')
const path = require('path')
const PNG = require('pngjs').PNG
const Contract = require('web3-eth-contract');
const contract = require("./sol/abis/Pixels.json")
const WEB3_INFURA_PROJECT_ID = "c24b3cac772d4f2a874a18cded57af37"
const infuraUrl = `https://polygon-mumbai.infura.io/v3/${WEB3_INFURA_PROJECT_ID}`
Contract.setProvider("wss://ws-mumbai.matic.today/"); // For Polygon mainnet: wss://ws-mainnet.matic.network/
const PORT = 80;
const PNG_REBUILD_INTERVAL_SECONDS = 5
var DB_HAS_CHANGED = false

const app = express();
const web3 = new Web3(infuraUrl)

app.use('/', express.static(path.join(__dirname, 'build')))

var firebase_admin = require("firebase-admin");
var serviceAccount = require("./secrets/firebase_creds.json");
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
    console.log('Network ID:', networkId);
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

function long2ShortCoord(coord) {
    x = coord % 1000
    y = Math.floor(coord / 1000)
    return { x, y }
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

    png.pack().pipe(fs.createWriteStream('/tmp/latest_map.png'));
    console.log('update done');
}

downloadDatabase()
run_blockchain_mirror()
pngUpdator()

app.get("/pixel_data.png", (req, res) => {
    res.sendFile('/tmp/latest_map.png');
})

app.get("/pixel_data.raw", (req, res) => {
    res.send({ success: true, data: CACHED_DATABASE })
})

app.get("/nft/:token_id", (req, res) => {
    try {
        const req_id = parseInt(req.params.token_id).toString()
        if (req_id < 1000000) {
            const xypos = long2ShortCoord(req_id)
            const nft_colour_hex = '#' + CACHED_DATABASE[req_id].toString(16)
            const nft_colour_raw = CACHED_DATABASE[req_id].toString(16)
            return_data = {
                name: "POLYPAINT.IO Block",
                description: "A single block on the polypaint.io canvas with a changeable hex colour",
                image: "https://polypaint.io/nft_artwork.png",
                background_color: nft_colour_raw,
                attributes: {
                    colour: nft_colour_hex,
                    positionX: xypos.x,
                    positionY: xypos.y
                }
            }
            res.send(return_data)
        } else {
            res.send({ error: "Invalid URI" })
        }
    } catch (e) {
        console.log('error: ', e.message);
        res.send({ error: e.message })
    }
})

app.get("/nft_artwork.png", (req, res) => {
    res.sendFile(__dirname + '/nft_artwork.png');
})

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
})

exports.app = functions.https.onRequest(app)