var config = module.exports;
var PRODUCTION = process.env.NODE_ENV === "production";

config.express = {
  port: process.env.EXPRESS_PORT || 1337,
  ip: "0.0.0.0"
};

//config.db same deal
//config.email etc
//config.log
