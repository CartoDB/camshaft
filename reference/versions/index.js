var versions = {
    "0.1.0": require("./0.1.0/reference.json"),
    "0.2.0": require("./0.2.0/reference.json"),
    "0.3.0": require("./0.3.0/reference.json"),
    "0.4.0": require("./0.4.0/reference.json"),
    "0.4.1": require("./0.4.1/reference.json")
};

versions.latest = versions["0.4.1"];
module.exports = versions;
