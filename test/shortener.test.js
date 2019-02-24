const axios = require("axios");
const expect = require("chai").expect;

const url = "http://localhost/shortener/";

describe("Shortener service test", () => {
  describe("Default index page", () => {
    it("should return a default html", async () => {
      const res = await axios.get(url);
      expect(res.status).to.equal(200, "status in not ok");
      expect(res.data).to.include("Swarm City short url service");
    });
  });

  describe("Register POST", () => {
    const id = "SR7HkA9aWsSdjeB1vubQ";
    const params = {
      title: "item title",
      description: "item description",
      redirectUrl:
        "https://swarm.city/detail/0x9546d3f484ed056773c535de6c934240ff0b49f9/0x15b32cc18650e02a99841f29543257cd86056568b75dcfdd1e5dbe07f9b6a4ad"
    };
    it("should accept a post request to store params", async () => {
      const res = await axios.post(url, params);
      expect(res.status).to.equal(200, "status in not ok");
      expect(res.data).to.deep.equal({ id });
    });

    it("should retrieve a redirect html with the generated id", async () => {
      const res = await axios.get(url + id);
      expect(res.status).to.equal(200, "status in not ok");
      const errorMessage = "for-SEO HTML does not contain expected custom data";
      expect(res.data).to.include(params.title, errorMessage);
      expect(res.data).to.include(params.description, errorMessage);
      expect(res.data).to.include(params.redirectUrl, errorMessage);
    });

    it("should return error retrieving an unkown id", async () => {
      let res;
      try {
        res = await axios.get(url + "missing-id");
      } catch (e) {
        res = e.response;
      }
      expect(res.status).to.equal(404, "status in not ok");
      expect(res.data).to.include(
        "NotFoundError",
        "Error HTML should contain a detailed error message"
      );
    });
  });
});
