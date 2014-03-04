var express = require('express');
var app = module.exports = express();

var r = require('rethinkdb'),
        util = require('util'),
        assert = require('assert');
var _ = require('underscore');
var http = require("http");
var async = require("async");

// disable all template engines
app.engine('.html', require('ejs').__express);
app.set("views", __dirname + '/../views/');
app.set('view engine', 'html');
app.locals.$ = require('native-view-helpers');

var connection = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;

    r.db('datsound').tableList().run(connection, function(err, result) {
        if(!_.contains(result, 'scraping')) {
            r.db('datsound').tableCreate('scraping').run(connection, function(err, result) {
                if (err) throw err;
                console.log(JSON.stringify(result, null, 2));
            });
        }
    });

});

// List of youtube channel to scrape
var channels = ['majesticcasual',
                'thvbgd',
                'thesoundyouneed1',
                'MrRevillz',
                'SelectedBase',
                'HumanprofityCasual',
                'DelicieuseMusique',
                'FhinqMusic',
                'soundisstyle',
                'LaBelleChannel'];

app.get('/scrape', function(req, res) {

    var rdata = [];

    async.each(channels, function(channel, callback) {
        console.log('Processing channel ' + channel);
        async.parallel({
            youtubedb: function(callback) {
                r.db('datsound')
                 .table('youtube')
                 .filter({'channel': channel})
                 .count().run(connection, function(err, result) {
                    callback(null, result);
                });
            },
            timestamp: function(callback) {
                r.db('datsound')
                 .table('scraping')
                 .filter({'channel': channel})
                 .orderBy(r.desc('datetime')).run(connection, function(err, result) {
                    if(result && result[0]) {
                        callback(null, result[0].datetime);
                    } else {
                        callback(null);
                    }
                });
            }
        }, function(err, results) {
            rdata.push({
                name: channel,
                count: results.youtubedb,
                timestamp: results.timestamp
            });
            callback();
        });
    }, function(err) {
        // if any of the saves produced an error, err would equal that error
        if( err ) {
            // One of the iterations produced an error.
            // All processing will now stop.
            console.log('A channel failed to process.');
        } else {
            console.log('All channels have been processed successfully.');
            res.render('scrape', { channels: rdata });
        }
    });

});

app.get('/scrape/:uid', function(req, res) {
    if(_.contains(channels, req.params.uid)) {
        scrapeYouTube('http://gdata.youtube.com/feeds/api/users/' + req.params.uid + '/uploads?v=2&alt=json&max-results=50&start-index=1', req.params.uid);
    }
    function scrapeYouTube(startIndex, channelId) {
        console.log('Starting to scrape some dataz for', channelId);
        var url = startIndex;
        var db = r.db('datsound').table('youtube');
        http.get(url, function(res) {
            var body = '';
            res.on('data', function(chunk) {
                body += chunk;
            });

            res.on('end', function() {
                var data = JSON.parse(body);
                var song = [];

                // TODO: check if already in db, then go scraping
                async.each(data.feed.entry, function(element, callback) {
                    var thumbnails = [];
                    // console.log(element.media$group.yt$videoid.$t);
                    db.getAll(element.media$group.yt$videoid.$t, {index:'ytid'})
                      .count()
                      .run(connection, function(err, result) {
                        if(result === 0) {
                            // console.log('THIS SONG IS NOT ADDED, ADD IT NOW!', element.media$group.yt$videoid.$t);

                            async.each(element.media$group.media$thumbnail, function(thumbnail, callback) {
                                 thumbnails.push({
                                    url: thumbnail.url,
                                    name: thumbnail.yt$name,
                                });
                                callback();
                            }, function(err) {
                                if( err ) {
                                    console.log('Thumbnails for ',
                                                element.media$group.yt$videoid.$t,
                                                'failed to process successfully.');
                                } else {
                                    console.log('Thumbnails for ',
                                                element.media$group.yt$videoid.$t,
                                                'processed successfully.');
                                    song.push({
                                        channel: channelId,
                                        ytid: element.media$group.yt$videoid.$t,
                                        title: element.title.$t,
                                        description: element.media$group.media$description$t,
                                        thumbnails: thumbnails,
                                        uploaded: element.media$group.yt$uploaded.$t,
                                        duration: element.media$group.yt$duration.seconds,
                                        // disliked: element.yt$rating['numDislikes'],
                                        // likes: element.yt$rating['numLikes'],
                                        // ratingAvg: element.gd$rating['average'],
                                        views: element.yt$statistics.viewCount
                                    });
                                }
                            });

                        }
                        callback();
                    });

                }, function(err) {
                    if( err ) {
                        console.log('Current set failed to process.');
                    } else {
                        console.log('Current set was processed successfully.');
                        // console.log(song);
                        db.insert(song)
                          .run(connection, function(err, result) {
                            if (err) throw err;
                            console.log(JSON.stringify(result, null, 2));
                        });
                    }
                });

                if(data.feed.link[7].rel === 'next') {
                    console.log(data.feed.link[7].href);
                    scrapeYouTube(data.feed.link[7].href, channelId);
                }
                else if(data.feed.link[8]) {
                    if(data.feed.link[8].rel === 'next') {
                        console.log(data.feed.link[8].href);
                        scrapeYouTube(data.feed.link[8].href, channelId);
                    }
                } else {
                    var scrape = [{
                                channel: channelId,
                                datetime: new Date()
                            }];

                    r.db('datsound').table('scraping').insert(scrape)
                      .run(connection, function(err, result) {
                        if (err) throw err;
                        // console.log(JSON.stringify(result, null, 2));
                        console.log('Scraping finished.');
                    });
                }

            });
        }).on('error', function(e) {
              console.log("Got error: ", e);
        });
    }
    var body = 'Scraping ' + req.params.uid;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', Buffer.byteLength(body));
    // res.end(body);
    res.redirect('/scrape');
});

app.get('/scrape/delete/:uid', function(req, res) {
    console.log(req.params.uid);
    if(_.contains(channels, req.params.uid)) {
        r.db('datsound')
         .table('youtube')
         .filter({'channel': req.params.uid})
         .delete()
         .run(connection, function(err, result) {
            console.log('Deleted ', req.params.uid, ' entries.');
        });
    }
    res.redirect('/scrape');
});
