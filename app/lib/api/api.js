var express = require('express');
var app = module.exports = express();

var r = require('rethinkdb'),
        util = require('util'),
        assert = require('assert');
var _ = require('underscore');
var http = require("http");
var async = require("async");

console.log('***** NEW *****')
var connection = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;

    r.db('datsound').tableList().run(connection, function(err, result) {
        if(!_.contains(result, 'youtube')) {
            r.db('datsound').tableCreate('youtube').run(connection, function(err, result) {
                if (err) throw err;
                console.log(JSON.stringify(result, null, 2));
            });
        }
    });

});

app.get('/api/:channel/:skip', function(req, res) {
    var skip;
    console.log(req.params.skip);
    if(!req.params.skip) {
        skip = 0;
    } else {
        skip = parseInt(req.params.skip);
    }

    async.parallel({
        videos: function(callback){
            r.db('datsound')
             .table('youtube')
             .filter({'channel': req.params.channel})
             .orderBy(r.desc("uploaded"))
             .skip(skip)
             .limit(5)
             .run(connection, function(err, cursor) {
                if (err) throw err;
                cursor.toArray(function(err, result) {
                    if (err) throw err;
                    callback(null, result);
                    // res.json(result);
                });
            });
        },
        count: function(callback){
            r.db('datsound')
             .table('youtube')
             .filter({'channel': req.params.channel})
             .count()
             .run(connection, function(err, cursor) {
                if (err) throw err;
                callback(null, cursor);
                // res.json(cursor);
            });
        }
    },
    function(err, results) {
        res.json({
            count: results.count,
            videos: results.videos
        });
    });

});

app.get('/api/getChannelList', function(req, res) {
    var skip;
    console.log(req.params.skip);
    if(!req.params.skip) {
        skip = 0;
    } else {
        skip = parseInt(req.params.skip);
    }

    r.db('datsound')
     .table('youtube')
     .pluck('channel')
     .distinct()
     .run(connection, function(err, cursor) {
        if (err) throw err;
        cursor.toArray(function(err, result) {
            if (err) throw err;
            res.json(result);
        });
    });

});
