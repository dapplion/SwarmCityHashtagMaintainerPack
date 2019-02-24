const axios = require("axios");
const expect = require("chai").expect;
const Web3 = require("web3");

const baseUrl = process.env.BASE_URL || "http://localhost";
const url = `${baseUrl}/faucet/`;

/**
 * This test will create a throw away account, request fund to the faucet and return them
 * The end result should be an account with exactly 0 ETH.
 */

// Create a new account for requesting and returning funds
const web3 = new Web3("https://kovan.infura.io");
const testAccount = web3.eth.accounts.create();
const testAddress = testAccount.address;
const testPrivateKey = testAccount.privateKey;
console.log(
  `Test account. In case the test goes wrong you can claim this eth by using the following private key:\n testAddress: ${testAddress}\n testPrivateKey: ${testPrivateKey}`
);

/**
 * This test will execute a real tx on kovan. For this it needs:
 * - The private key of a kovan account with kovan ETH
 * - That the faucet service is configured to listen to a valid node
 * - That the faucet has access to a valid private key, and its public key is known to this test
 */

describe("Shortcode service test", () => {
  describe("Default index page", () => {
    it("should return a default html", async () => {
      const res = await axios.get(url);
      expect(res.status).to.equal(200, "status in not ok");
      expect(res.data).to.include("Swarm City faucet service");
    });
  });

  let faucetAddress;
  let faucetTxHash;

  describe("Faucet status", () => {
    it("should return a faucet status", async function() {
      this.timeout(30 * 1000);
      const res = await axios.get(url + "status");
      expect(res.status).to.equal(200, "status in not ok");
      expect(res.data).to.be.an("object");
      expect(res.data).to.have.property("blockNumber");
      expect(res.data).to.have.property("faucetBalance");
      expect(res.data).to.have.property("faucetAddress");
      console.log("Faucet status", res.data);
      expect(res.data.faucetAddress).to.be.a("string");
      expect(parseInt(res.data.refillsLeft)).to.be.greaterThan(
        0,
        "Not enough funds in the faucet!"
      );
      faucetAddress = res.data.faucetAddress;
    });
  });

  describe("Request faucet funds", () => {
    it("should get funds from the faucet, and then return them", async () => {
      const res = await axios.get(url + testAddress);
      expect(res.status).to.equal(200, "status in not ok");
      expect(res.data).to.be.an("object");
      expect(res.data).to.have.property("hash");
      expect(res.data).to.have.property("url");
      expect(res.data.hash).to.be.a("string");
      expect(res.data.url).to.be.a("string");
      console.log(`Successfully requested funds! ${res.data.url}`);
      faucetTxHash = res.data.hash;
    }).timeout(30000);

    // Return the funds to the faucet
    // Needs regular function to call this.timeout
    after(async function() {
      this.timeout(2 * 60 * 1000);
      console.log("Waiting for the faucet tx to be mined...");
      let faucetTxReceipt;
      while (!faucetTxReceipt) {
        faucetTxReceipt = await web3.eth.getTransactionReceipt(faucetTxHash);
        await pause(2 * 1000);
      }
      console.log("Faucet tx mined!");
      const faucetTxObj = await web3.eth.getTransaction(faucetTxHash);
      const available = web3.utils.toBN(faucetTxObj.value);
      const gasPrice = web3.utils.toWei("1", "gwei");
      const gasLimit = 21000;
      const fee = web3.utils.toBN(gasPrice).mul(web3.utils.toBN(gasLimit));
      const value = available.sub(fee).toString(10);

      console.log(
        `Returning ${web3.utils.fromWei(
          value
        )} ETH from ${testAddress} to faucet ${faucetAddress}`
      );

      // Prepare tx
      // Web3 method takes care of the nonce, chainId and gasPrice automatically
      // https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#signtransaction
      if (!faucetAddress) throw Error("faucetAddress is not defined!");
      const tx = await web3.eth.accounts.signTransaction(
        { to: faucetAddress, value, gasPrice, gasLimit },
        testPrivateKey
      );
      // Broadcast tx
      const rawTx = tx.rawTransaction;
      console.log(`Broadcasting raw tx... (may take 30-60s)`);
      // Using .sendSignedTransaction as a promise resolves on the receipt when mined.
      const receipt = await web3.eth.sendSignedTransaction(rawTx);
      console.log(`Funded faucet sender! hash ${receipt.transactionHash}`);
    });
  });
});

function pause(ms) {
  return new Promise(r => setTimeout(r, ms));
}
