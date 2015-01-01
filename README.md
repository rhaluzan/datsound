# datsound
An app that I've created to aggregate music from my favourite YouTube channels so that I can just press play and shuffle through all of them.

========

Before starting scraping you must enter this into rethinkd console to create secondary indexes:
```
r.db('datsound').table('youtube').indexCreate('ytid')
```
