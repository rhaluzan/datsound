#!/usr/bin/env node

var config = require("./config.js");
var express = require("express");
var app = express();
var log = require("winston").loggers.get("app:server");

var scrape = require('./lib/scrape/scrape.js');
var api = require('./lib/api/api.js');

// app.set("views", __dirname);

app.use(scrape);
app.use(api);
app.use(express.static(__dirname + '/public'));

app.listen(config.express.port, config.express.ip, function (error) {
  if (error) {
    log.error("Unable to listen for connections", error);
    process.exit(10);
  }
  log.info("express is listening on http://" + config.express.ip + ":" + config.express.port);
});

app.get('/', function(req, res){
    // var body = 'Hello World';
    // res.setHeader('Content-Type', 'text/plain');
    // res.setHeader('Content-Length', Buffer.byteLength(body));
    // res.end(body);
    res.sendfile('./public/index.html');
});
