var mongo = require('mongodb'),
    http = require('http');

var dbname = 'youtube-playlist-db',
    collname = 'tracks';

var LastFMKey = '00fc6b549e4b34f2683592b31e018dde',
    LastFMURL = 'ws.audioscrobbler.com';

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db(dbname, server, {safe: true});

db.open(function(err, db) {
    if(!err) {
        console.log("Connected to '" + dbname + "' database");
        db.collection(collname, {safe:true}, function(err, collection) {
            if (err) {
                console.log("The '" + collname + "' collection doesn't exist. Creating it with sample data...");
                populateDB();
            }
        });
    }
});
/*
exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving wine: ' + id);
    db.collection(collname, function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};*/

exports.findAll = function(req, res) {
    db.collection(collname, function(err, collection) {
        collection.find({'ip': req.connection.remoteAddress}).toArray(function(err, items) {
            res.send(items);
        });
    });
};

exports.addTrack = function(req, res) {

    console.log("Getting track information from Youtube Data API");
    //  Getting the request information
    var track = req.body;
    track.ip = req.connection.remoteAddress;

    //  Creating the query
    var query = track.name.toLowerCase().replace(/ /g,"+");
    console.log("Query : " + query);

    //  Searching for videos through the Youtube Data API
    //  Options for the GET request
    var options = {
        host: 'gdata.youtube.com',
        port: 80,
        path: '/feeds/api/videos?q=' + query + '&max-results=1&alt=jsonc&v=2',
    };

    //  Gettin the response
    var global_response = res;
    http.get(options, function(res) {
        console.log("STATUS : " + res.statusCode);
        res.setEncoding('utf8');
        var data = "";
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function() {
            res = JSON.parse(data);
            var trackData = null;
            if (trackData = res.data.items[0]) {
                var track = {};
                track.videoId = trackData.id;
                track.name = trackData.title;
                track.ip = global_response.connection.remoteAddress;

                console.log('Adding track: ' + track.name + ' of youtube id ' + track.videoId);

                db.collection(collname, function(err, collection) {
                    collection.insert(track, {safe:true}, function(err, result) {
                        if (err) {
                            global_response.send({'error':'An error has occurred'});
                        } else {
                            console.log('Success: ' + JSON.stringify(result[0]));
                            global_response.send(result[0]);
                        }
                    });
                });

            } else {
                console.log("Could not retrieve valid data from the result");
            }
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
    /*
    console.log('Adding track: ' + JSON.stringify(track));
    db.collection(collname, function(err, collection) {
        collection.insert(track, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    });*/
}

exports.deleteTrack = function(req, res) {
    var id = req.params.id;
    console.log('Deleting track: ' + id);
    db.collection(collname, function(err, collection) {
        collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
}

/*--------------------------------------------------------------------------------------------------------------------*/
//  Search tracks on youtube using a string query and send them to the client
exports.searchTracks = function (req, res) {
    var query = req.params.query;

    searchVideos(query, function(err, results) {
        if (err){
            console.log("Problem when retrieving results from Youtube API");
            res.send({'error':'An error has occurred - ' + err});
        } else {
            console.log(results);
            res.send(results);
        }
    });
}

/*--------------------------------------------------------------------------------------------------------------------*/
//  Method which will send a list of tracks artist - track name so the client can load the videos
/*--------------------------------------------------------------------------------------------------------------------*/

/*--------------------------------------------------------------------------------------------------------------------*/
//  ISSUE : sometimes, for old tracks, it's difficult to find similar tracks
//  One possible solution could be to look for similar artists
/*--------------------------------------------------------------------------------------------------------------------*/

exports.generatePlaylistFromTrack = function (req, res) {
    //first we need to clean the name
    console.log('Beginning of the generation of playlist with the query : ' + req.params.track);

    getMetaData(req.params.track, function(track){

        if (track == null) {
            console.log('Weird error, should not happen');
            res.send(null);
        }

        console.log("The track is now considered to be : artist : " + track.artist + " - track : " + track.name);

        //  Once we got one track, with or without mbid, we request lastfm for similar tracks
        searchSimilarTracksByTrack(track, function(tracks){
            
            //  If could not retrieve tracks similar
            if (tracks == null) {
                console.log('Could not find similar tracks on Lastfm');
                res.send(null);
                return;
            }

            res.send(tracks);
            return;
        });

    });
}

exports.generatePlaylistFromTrackByMBID = function (req, res) {
    //first we need to clean the name
    console.log('Beginning of the generation of playlist from the track of mbid: ' + req.params.mbid);

    track = {mbid: req.params.mbid};

    searchSimilarTracksByTrack(track, function(tracks){
            
        //  If could not retrieve tracks similar
        if (tracks == null) {
            console.log('Could not find similar tracks on Lastfm');
            res.send(null);
            return;
        }

        res.send(tracks);
        return;
    });
}

/*--------------------------------------------------------------------------------------------------------------------*/
//  Function that get the results from a search query to Youtube API
/*--------------------------------------------------------------------------------------------------------------------*/

var getMetaData = function (tracknamePlain, callback) {
    //  We need to ask look for in last fm a track with the name from youtube
    //  First, we keep only what's interesting from the title (ie remove special character)

    var tracknameClean = clean(tracknamePlain);
    //  We suppose the youtube title is like 'artist' - 'title'
    var nameClean = clean(tracknamePlain.split('-')[1]);
    var artistClean = clean(tracknamePlain.split('-')[0]);

    //  Then we query lastfm and try to find the metadata
    //  We only look for tracks matching the title

    //  Let's try to add the first word of the artist inside the query,
    //  because for instance phunky data - fashion doesn't work even when retrieving 100 possible tracks....

    //  Works fine this way, we can reduce the number of tracks needed for match

    var options = {
        name: nameClean,
        artist: artistClean.split(' ')[0],
    }

    searchTrack (options, function (tracks){
        //  If no track was found
        if (tracks == null) {
            console.log('Impossible to find a track in Lastfm database according to youtube name');
            console.log('We then suppose the youtube title is like "artist" - "title"');

            var track = {
                name: nameClean,
                artist: artistClean
            }

            callback(track);
            return;
        }

        var i = 0;
        
        //  We compare the artist with the one we have for every track found
        while (tracks[i]) {
            //  Both the artist and the name should be close
            if (compare(artistClean, tracks[i].artist) && compare(nameClean, tracks[i].name)) {
                break;
            }
            i++;
        }
        console.log(tracks[i]);
        
        //  By default, first one
        if (! tracks[i]) i = 0;

        console.log(tracks[i]);

        //  Sending the track found for the youtube title
        callback(tracks[i]);
    });
};

var clean = function (text) {
    return text.replace(/\(original mix\)/i, '')
                //.replace(/(\(|\[|{).*(remix){0}(\)|\]|})/i,'')
                .replace(/(\(|\[|{).*(\)|\]|})/i,'')
                .replace(/(official video|lyrics|hdtv|hq|hd)/gi, '')
                .replace(/\.[\w\d]+$/i, '')
                .replace(/[^\w\d ]/g, '');
}

var compare = function (text1, text2) {
    text1 = text1.replace(/ {2,}/g, ' ').replace(/[^\w\d ]/g, '').trim().toLowerCase();
    text2 = text2.replace(/ {2,}/g, ' ').replace(/[^\w\d ]/g, '').trim().toLowerCase();
    var n1 = text1.split(' ');
    var n2 = text2.split(' ');
    var len1 = n1.length;
    var len2 = n2.length;
    var match = 0;

    for (var i = 0; i < len1; i++) {
        for (var j = 0; j < len2; j++) {
            if (n1[i] == n2[j]) {
                match++;
                break;
            }
        }
    }

    //  If at least half of the words are the same (hoping there's no redondant words)
    return (2 * match) / (len1 + len2) >= 0.5;
}

/*--------------------------------------------------------------------------------------------------------------------*/
//  Search lastfm for a track data
/*--------------------------------------------------------------------------------------------------------------------*/

var searchTrack = function (options, callback) {

    track = encodeURIComponent(options.name);
    artist = options.artist ? options.artist : '';

    console.log('Asking last fm for the track of title on youtube : ' + track + ' and artist first word : ' + artist);

    var options = {
        host: LastFMURL,
        port: 80,
        path: '/2.0/?method=track.search&limit=20&track=' + track + '&artist=' + artist + '&api_key=' + LastFMKey + '&format=json'
    };

    console.log('URL : ' + options.host + options.path);
    http.get(options, function(res) {
        console.log("STATUS : " + res.statusCode);
        res.setEncoding('utf8');
        var data = "";
        //  Handle of the chunks of data
        res.on('data', function (chunk) {
            data += chunk;
        })
        .on('end', function() {
            res = JSON.parse(data);
            console.log(res);
            if (res.results['opensearch:totalResults'] > 0) {
                var tracksMatched = res.results.trackmatches.track;
                var tracks = [];
                var maxPos = Math.min(res.results['opensearch:totalResults'], res.results['opensearch:itemsPerPage']);

                //  Handle the case of only one track received
                if (maxPos > 1) {
                    for (var i = 0; i < maxPos; i++) {
                        tracks[i] = {name: tracksMatched[i].name, artist: tracksMatched[i].artist, mbid: tracksMatched[i].mbid};
                    }
                } else {
                    tracks[0] = tracksMatched;
                }
                
                console.log('Tracks found on lastfm according to the query :');
                console.log(tracks);

                callback(tracks);
            } else {
                console.log('No track found on lastfm according to the query');
                callback(null);
            }
        });
    })
    //  If there is an error while doing the HTTP request
    .on('error', function(e) {
            console.log("Got error: " + e.message);
            callback(null);
    });
    return;
};

/*--------------------------------------------------------------------------------------------------------------------*/
//  Get the similar tracks to one track
/*--------------------------------------------------------------------------------------------------------------------*/

var searchSimilarTracksByTrack = function (track, callback) {
    console.log('Asking last fm for the tracks similar of the one found');

    var options = {
        host: LastFMURL,
        port: 80,
        path: '/2.0/?method=track.getSimilar&api_key=' + LastFMKey + '&format=json&limit=19'
    };

    if (track.mbid)
        options.path += '&mbid=' + encodeURIComponent(track.mbid);
    else
        options.path += '&artist=' + encodeURIComponent(track.artist) + '&track=' + encodeURIComponent(track.name);

    console.log('URL : ' + options.host + options.path);
    http.get(options, function(res) {
        console.log("STATUS : " + res.statusCode);
        res.setEncoding('utf8');
        var data = "";
        //  Handle of the chunks of data
        res.on('data', function (chunk) {
            data += chunk;
        })
        .on('end', function() {
            res = JSON.parse(data);
            console.log(res);
            if (!res.error){
                var tracksMatched = res.similartracks.track;

                //  If no similar
                if (res.similartracks['#text']) {
                    callback(null);
                    return;
                }

                var tracks = [];
                var i = 0;
                while (tracksMatched[i]) {
                    tracks[i] = {name: tracksMatched[i].name, artist: tracksMatched[i].artist.name, mbid: tracksMatched[i].mbid};
                    i++;
                }
                console.log('Tracks similar :');
                tracks = randomSort(tracks);
                console.log(tracks);

                callback(tracks);
            } else { // Error : could not find track
                console.log('The track was not found in lastfm database, impossible to get similar tracks');
                callback(null);
            }
        });
    })
    //  If there is an error while doing the HTTP request
    .on('error', function(e) {
            console.log("Got error: " + e.message);
            callback(null);
    });
    return;
};

var randomSort = function (list){
    var len = list.length;
    var result = [];
    while (len != 0) {
        var index = Math.floor(Math.random() * len); // Generate a random number between 0 and length of array
        result.push(list[index]);
        list.splice(index, 1);
        len--;
    }
    return result;
}

/*--------------------------------------------------------------------------------------------------------------------*/
// Populate database with sample data -- Only used once: the first time the application is started.
// You'd typically not find this code in a real-life app, since the database would already exist.
var populateDB = function() {

    var tracks = [
    {
        name: "Ricardo Villalobos - Alcachofa"
    },
    {
        name: "Django Django - Love's dart"
    }];

    db.collection(collname, function(err, collection) {
        collection.insert(tracks, {safe:true}, function(err, result) {});
    });

};

var storeTrack = function (data) {
    //  console.log(data);
    
}