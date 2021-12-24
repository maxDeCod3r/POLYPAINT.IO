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
    // const web3_ws = new Web3(infuraWsUrl)


var admin = require("firebase-admin");
var serviceAccount = require("../secrets/firebase_creds.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://polypaint-io-default-rtdb.europe-west1.firebasedatabase.app/"
});

async function initWeb3() {
    const networkId = await web3.eth.net.getId()
    console.log(contract.networks[networkId].address);
    var deployedContract = new Contract(contract.abi, contract.networks[networkId].address);
    return { web3, networkId, contract: deployedContract }
}

var db = admin.database();
var ref = db.ref("Pixels");
ref.once("value", function(snapshot) {
    console.log(snapshot.val());
});

// async function updateEntirePixelDatabase(web3Session) {
//     var totalElements = await web3Session.contract.methods._totalPixels().call()
//     var pixels = []
//     console.log(`Total elements = ${totalElements}`);
//     totalElements = 5
//     for (let i = 0; i < totalElements; i++) {
//         const color = await web3Session.contract.methods._pixelColours(i).call()
//         if (i % 100 == 0) { console.log(`Progress: ${i} / ${totalElements}`); }
//         pixels.push(color)
//     }
//     console.log("pixels: ", pixels);
//     return pixels
// }

async function run() {
    web3_instance = await initWeb3()
    console.log(`On network: ${web3_instance.networkId}`);
    console.log("Subbing to contract...");
    subToTopic(web3_instance)
}

async function subToTopic(web3_instance) {
    const currBlockNo = await web3.eth.getBlockNumber()
    web3_instance.contract.events.PixelColourChanged({ fromBlock: currBlockNo })
        .on("connected", function(subscriptionId) {
            console.log("connected", subscriptionId);
        })
        .on('data', function(event) {
            console.log("\n", event.returnValues.pixelId); // same results as the optional callback above
            console.log(event.returnValues.newColour); // same results as the optional callback above
        })
        .on('changed', function(event) {
            console.log("Changed:", event);
        })
        .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
            console.log("Err:", error);
        });
}

run()




app.get("/api", (req, res) => {
    res.json({ message: "Hello from server!" });
});

app.get("/pixel_data", (req, res) => {

})

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});