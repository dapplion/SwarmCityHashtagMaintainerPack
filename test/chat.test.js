const axios = require("axios");
const io = require("socket.io-client");
const WebSocketClient = require("websocket").client;
const crypto = require("crypto");
const expect = require("chai").expect;

/**
 * The purpose of this test is to do an integration test of the websocket server
 * - It will setup two clients: "sender" and "receiver"
 * - The sender will initialize a chatObject in the level db
 * - Then, the sender will emit a message
 */

const url = "http://localhost/chat/";

const options = {
  transports: ["websocket"],
  forceNew: true,
  reconnection: false
};

// Randomize to avoid data collisions with other tests.
// It's hard to clean the level db during a test
function randomHexString(bytes) {
  return "0x" + crypto.randomBytes(bytes).toString("hex");
}
const hashtagAddress = randomHexString(20);
const itemHash = randomHexString(32);

let sender, receiver;

describe("Chat service test", () => {
  describe("Default index page", () => {
    it("should return a default html", async () => {
      const res = await axios.get(url);
      expect(res.status).to.equal(200, "status in not ok");
      expect(res.data).to.include("Swarm City chat service");
    });
  });

  describe("Websocket chat", () => {
    beforeEach(function(done) {
      // connect two io clients
      sender = io(url, options);
      receiver = io(url, options);

      // finish beforeEach setup
      done();
    });

    afterEach(function(done) {
      // disconnect io clients after each test
      sender.disconnect();
      receiver.disconnect();
      done();
    });

    it("should send and receive a message", function(done) {
      const accessKeys = [
        "sender-secret-access-key",
        "receiver-secret-access-key"
      ];
      const message = "secret-message";

      // Subscribe to new messages
      let senderFirstMessage = true;
      let receiverFirstMessage = true;
      sender.on("chatChanged", chatObject => {
        if (senderFirstMessage) {
          expect(chatObject).to.have.property("accessKeys");
          expect(chatObject.accessKeys).to.include("sender-secret-access-key");
        } else {
          expect(chatObject).to.have.property("messages");
          expect(chatObject.messages).to.include(message);
        }
        senderFirstMessage = false;
      });
      receiver.on("chatChanged", chatObject => {
        if (receiverFirstMessage) {
          expect(chatObject).to.have.property("accessKeys");
          expect(chatObject.accessKeys).to.include(
            "receiver-secret-access-key"
          );
        } else {
          expect(chatObject).to.have.property("messages");
          expect(chatObject.messages).to.include(message);
          done();
        }
        receiverFirstMessage = false;
      });

      // Emit a subscribe
      sender.emit(
        "subscribe",
        { hashtagAddress, itemHash, accessKeys },
        res => {
          expect(res.error).to.be.null;
          receiver.emit("subscribe", { hashtagAddress, itemHash }, res => {
            expect(res.error).to.be.null;
            // Emit a new message
            sender.emit(
              "message",
              { hashtagAddress, itemHash, message },
              res => {
                expect(res.error).to.be.null;
              }
            );
          });
        }
      );
    });
  });
});
