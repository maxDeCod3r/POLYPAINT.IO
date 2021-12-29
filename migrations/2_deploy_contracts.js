const Pixels = artifacts.require("Pixels");
const baseURI = "https://polypaint.io/nft/"
module.exports = function(deployer) {
    deployer.deploy(Pixels, baseURI);
};