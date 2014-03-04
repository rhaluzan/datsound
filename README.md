datsound
========

Before starting scraping you must enter this into rethinkd console to create secondary indexes:
```
r.db('datsound').table('youtube').indexCreate('ytid')
```
