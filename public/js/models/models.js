window.loadingVideoFromYoutube = false;

window.Track = Backbone.Model.extend({

    url: "/tracks",

    idAttribute: "_id",

    potentialTracks: {},

    initialize: function (attrs, options) {
        //  Every time the model change we format the content
        this.on('change', this.format, this);
        this.format();
        //  Now we check what data we have : if we don't have youtube data then we load them :
        if (attrs != null) {
            if ((this.has('name') && this.has('artist')) || this.has('videoId')) {
                var self = this;
                this.getYoutubeData(function(res){
                    if (! res) {//  If we could not load a video from Youtube, we cannot keep it in the playlist
                        console.log('Removing one track which youtube data could not be found');
                        self.destroy(); //  Does not seem to work
                    }
                });
            } else { //   No youtube data, no name and artist, but some data given : we can't use that !
                this.destroy();
            }
        }
    },

    validate: function (attrs) {
        //  The title of the track/video cannot be empty
        /*if (attrs.title.length == 0) {
            return "You must enter a name";
        };*/
    },

    format: function() {
        //  Some formatting
        if (this.has('durationInSec'))
            this.set('duration', Math.floor(this.get('durationInSec') / 60) + 'min' + this.get('durationInSec') % 60);
    },

    /*-----------------------------------------------------------------------------------------------------
    //  This method will parse JSONC data received by Youtube to fit our model
    -----------------------------------------------------------------------------------------------------*/

    addDataFromYoutube: function(data) {
        if (data != null) {
            this.set({
                'videoId': data['id'],
                'uploaded': data['uploaded'],
                'category': data['category'],
                'videoTitle': data['title'],
                'description': data['description'],
                'img': data['thumbnail']['sqDefault'],
                'durationInSec': data['duration'],
                'views': data['viewCount'],
                'youtubeData': true,
            });
        }
    },

    getYoutubeData: function(callback) {
        var self = this;
        if (! this.has('videoId')) {
            searchVideos(
                {
                    query: this.get('name') + ' ' + this.get('artist'),
                    maxResults: 1
                },
                function(tracks) {
                    if (tracks == null || tracks.length == 0){
                        self.set('youtubeDataError', 'true');
                        callback(false);
                        return;
                    }
                    console.log(tracks[0]);
                    //  We parse the data
                    self.addDataFromYoutube(tracks[0]);
                    
                    callback(true);
                    return;
                }
            );
        } else if (! this.has('youtubeData')) {
            $.getJSON('https://gdata.youtube.com/feeds/api/videos/' + this.get('videoId') + '?v=2&alt=jsonc', function(data) {
                if (data.data) {
                    self.addDataFromYoutube(data.data);
                    callback(true);
                    return;
                } else self.destroy(); //   Error while retrieving video : the id must be wrong
            })
        }
    },

    defaults: {
        _id: null,
        name: ""
    }
});

window.TrackCollection = Backbone.Collection.extend({

    model: Track,

    url: "/tracks",

    /*-----------------------------------------------------------------------------------------------------
    //  Specific loader from raw youtube data : it's better to parse here according to the model we chose
    //  And the type of data we received (json, jsonc...)
    //
    //  We chose to use the JSONC type, because it's simpler to parse yeah
    -----------------------------------------------------------------------------------------------------*/

    addTracksFromYoutube: function(tracks) {
        var len = tracks.length;
        if (tracks != null) {
            for (var i = 0; i < len; i++) {
                var track = new Track();
                //  We use the method from our model to parse Youtube data
                track.addDataFromYoutube(tracks[i]);
                this.add(track, {silent: true});
            };
            this.trigger('add');
        }
    },

});

window.Playlist = TrackCollection.extend({

    beingGenerated: false,

    initialize: function() {
        this.on('reset', this.update, this);
        this.on('remove', this.update, this);
        this.on('add', this.update, this);
    },

    /*-----------------------------------------------------------------------------------------------------
    //  Some cursors to navigate in the playlist :
    //  This way we can store past tracks
    -----------------------------------------------------------------------------------------------------*/

    /*-----------------------------------------------------------------------------------------------------
    //  When there's no more track in the playlist, load similar tracks
    -----------------------------------------------------------------------------------------------------*/

    update: function() {
        if (this.length > 0) {
            if (this.length == 1) {
                if (! this.beingGenerated) {
                    this.beingGenerated = true;
                    this.getSimilarTracks();
                }
            }
        } else this.trigger('empty');
    },

    /*-----------------------------------------------------------------------------------------------------
    //  Send a get request to the server that will get similar tracks to the next one on the playlist
    -----------------------------------------------------------------------------------------------------*/

    getSimilarTracks: function() {
            this.trigger('update', 'start');

            //  Check for the information we have, according to that we'll ask a specific request
            if (this.at(0).has('mbid'))
                var url = 'playlistByMBID/' + encodeURIComponent(this.at(0).get('mbid'));
            else if (this.at(0).has('videoTitle'))
                var url = 'playlist/' + encodeURIComponent(this.at(0).get('videoTitle'));
            else if (this.at(0).has('artist'))
                var url = 'playlist/' + encodeURIComponent(this.at(0).get('artist')) + '-' + encodeURIComponent(this.at(0).get('name'));
            
            var self = this;

            console.log('Requesting similar tracks...');
            $.ajax({
                url: url,
                success: function(data){
                    if (data != null) {
                        console.log("Succesfully retrieved similar tracks");

                        //  We got similar tracks. Now we must store them in the playlist
                        var i = 0;
                        var track;
                        while (data[i]){
                            track = new Track({name: data[i].name, artist: data[i].artist, mbid: data[i].mbid});
                            //console.log(track);
                            if (track != null) self.push(track, {silent: true});
                            i++;
                        }
                        self.trigger('add');
                        self.beingGenerated = false;
                        self.trigger('update', 'success');
                    } else {
                        console.log("Could not retrieve similar tracks...");
                        self.beingGenerated = false;
                        self.trigger('update', "error");
                    }
                    
                },
                error: function() {
                    console.log('Error when retrieving similar tracks');
                    self.beingGenerated = false;
                    self.trigger('update', "error");
                }
            });
    }
});