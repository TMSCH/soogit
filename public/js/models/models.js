window.Track = Backbone.Model.extend({

    url: "/tracks",

    idAttribute: "_id",

    potentialTracks: {},

    initialize: function () {
        //  Every time the model change we format the content
        this.on('change', this.format, this);
        this.format();
    },

    validate: function (attrs) {
        //  The title of the track/video cannot be empty
        /*if (attrs.title.length == 0) {
            return "You must enter a name";
        };*/
    },

    format: function() {
        //  Some formatting
        if (this.has('description'))
            if (this.get('description').length > 120)
                this.set('description', this.get('description').substr(0, 117) + '...');

        if (this.has('durationInSec'))
            this.set('duration', Math.floor(this.get('durationInSec') / 60) + 'min' + this.get('durationInSec') % 60);

        if (this.has('uploaded_raw'))
            this.set('uploaded', this.get('uploaded_raw').substr(0,10));
    },

    getYoutubeData: function(callback) {
        var self = this;
        searchVideos(
            {
                query: this.get('name') + ' ' + this.get('artist'),
                maxResults: 1
            },
            function(tracks) {
                console.log(tracks[0].toJSON());
                if (tracks == null || tracks.length == 0){
                    callback(false);
                    return;
                }

                $.each(tracks[0].toJSON(), function (key, val){
                    self.set(key, val);
                });
                callback(true);
                return;
            }
        );
    },

    defaults: {
        _id: null,
        name: ""
    }
});

window.TrackCollection = Backbone.Collection.extend({

    model: Track,

    url: "/tracks"

});

window.Playlist = TrackCollection.extend({

    beingGenerated: false,

    initialize: function() {
        this.on('reset', this.update, this);
        this.on('remove', this.update, this);
        this.on('add', this.update, this);
    },

    update: function() {
        if (this.length > 0) {
            if (! this.at(0).has('videoId')){
                this.trigger('get-video', 'start');
                var self = this;
                this.at(0).getYoutubeData(function(res){
                    if (res)
                        self.trigger('get-video', 'success');
                    else {
                        self.trigger('get-video', 'error');
                        self.shift();
                    }
                });
            }
            if (this.length == 1) {
                if (! this.beingGenerated) {
                    this.beingGenerated = true;
                    this.getSimilarTracks();
                }
            }
        } else this.trigger('empty');
    },

    getSimilarTracks: function() {
            this.trigger('update', 'start');

            //  Check for the information we have, according to that we'll ask a specific request
            if (this.at(0).has('mbid'))
                var url = 'playlistByMBID/' + encodeURIComponent(this.at(0).get('mbid'));
            else if (this.at(0).has('title'))
                var url = 'playlist/' + encodeURIComponent(this.at(0).get('title'));
            else if (this.at(0).has('artist'))
                var url = 'playlist/' + encodeURIComponent(this.at(0).get('artist')) + '+' + encodeURIComponent(this.at(0).get('name'));
            
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