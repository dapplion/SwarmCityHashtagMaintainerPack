const axios = require("axios");
const expect = require("chai").expect;

const baseUrl = process.env.BASE_URL || "http://localhost";
const url = `${baseUrl}/shortcode/`;

describe("Shortcode service test", () => {
  describe("Default index page", () => {
    it("should return a default html", async () => {
      const res = await axios.get(url);
      expect(res.status).to.equal(200, "status in not ok");
      expect(res.data).to.include("Swarm City shortcode service");
    });
  });

  const data = {
    publicKey: "0x7297342934234g2y3g4uy2g3u4y2g3u4yg2u34"
  };
  let shortcode;

  describe("Register POST", () => {
    it("should accept a post request to store params", async () => {
      const config = {
        headers: { "Content-Type": "text/plain" }
      };
      const res = await axios.post(url, JSON.stringify(data), config);
      expect(res.status).to.equal(200, "status in not ok");
      expect(res.data).to.be.an("object");
      expect(res.data).to.have.property("shortcode");
      shortcode = res.data.shortcode;
      expect(shortcode).to.be.a("string");
      expect(shortcode.length).to.equal(5);
    });

    it("should retrieve a data of a shortcode", async () => {
      const res = await axios.get(url + shortcode);
      expect(res.status).to.equal(200, "status in not ok");
      expect(res.data).to.be.a("string");
      const _data = JSON.parse(res.data);
      expect(_data).to.be.a("object");
      expect(_data).to.deep.equal(data);
    });

    it("should return error retrieving an unkown id", async () => {
      let res;
      try {
        res = await axios.get(url + "missing-shortcode");
      } catch (e) {
        res = e.response;
      }
      expect(res.status).to.equal(404, "status in not ok");
      expect(res.data).to.include(
        "Shortcode not found",
        "Error HTML should contain a detailed error message"
      );
    });
  });
});
