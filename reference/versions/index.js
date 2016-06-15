var versions = {
    "0.1.0": require("./0.1.0/reference.json"),
    "0.2.0": require("./0.2.0/reference.json"),
    "0.3.0": require("./0.3.0/reference.json"),
    "0.4.0": require("./0.4.0/reference.json"),
    "0.6.0": require("./0.6.0/reference.json"),
    "0.7.0": require("./0.7.0/reference.json"),
    "0.9.0": require("./0.9.0/reference.json"),
    "0.10.0": require("./0.10.0/reference.json"),
    "0.14.0": require("./0.14.0/reference.json"),
    "0.15.0": require("./0.15.0/reference.json"),
    "0.16.0": require("./0.16.0/reference.json"),
    "0.17.0": require("./0.17.0/reference.json")
};

versions.latest = versions["0.17.0"];
module.exports = versions;
