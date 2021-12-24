const express = require("express");
const Web3 = require('web3')
const Contract = require('web3-eth-contract');
const contract = require("../sol/abis/Pixels.json")
const infuraUrl = `https://ropsten.infura.io/v3/${process.env.WEB3_INFURA_PROJECT_ID}`
const infuraWsUrl = `wss://ropsten.infura.io/ws/v3/${process.env.WEB3_INFURA_PROJECT_ID}`
const PORT = 3535;
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

async function downloadDatabase() {
    PIXEL_TABLE.once("value", function(snapshot) {
        CACHED_DATABASE = snapshot.val();
        console.log("Initial database download complete");
    });
}
downloadDatabase()


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
        })
}

run_blockchain_mirror()



app.get("/api", (req, res) => {
    res.json({ message: "Hello from server!" });
});

app.get("/pixel_data", (req, res) => {
    res.json({ success: true, data: CACHED_DATABASE });
})

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});