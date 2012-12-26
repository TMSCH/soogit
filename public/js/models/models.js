window.Track = Backbone.Model.extend({

    url: "/tracks",

    idAttribute: "_id",

    potentialTracks: {},

    initialize: function () {
    },

    validate: function (attrs) {
        if (attrs.name.length == 0) {
            return "You must enter a name";
        };
    },

    searchOneVideo: function(callback) {
        var self = this;
        this.searchVideos(1, function() {
            //console.log(self.potentialTracks);
            if (self.potentialTracks[0] == null || self.potentialTracks == {}) return null;

            $.each(self.potentialTracks[0], function (key, val){
                self.set(key, val);
            });
            callback();
        });
    },

    /*-----------------------------------------------------------------------------------------------------
    // Search videos on Youtube API with the query specified in the input 'trackname'
    -----------------------------------------------------------------------------------------------------*/

    searchVideos: function (maxResults, callback) {
        maxResults = typeof maxResults !== undefined ? maxResults : 1;

        query = this.get('name') + ' ' + this.get('artist');
        query = query.toLowerCase().replace(/ /g,"+");
        
        if (!query)
            return null;
        
        console.log("Query to Youtube API : " + query);

        //  Searching for videos through the Youtube Data API
        //  Options for the GET request
        var url = 'http://gdata.youtube.com/feeds/api/videos';

        var res = null;
        var self = this;

        //  Getting the response from Youtube API
        $.ajax({
            url: url,
            data: {q: query,
                    'max-results': maxResults,
                    alt: 'jsonc',
                    v: '2'},

            success: function(res){
                var i = 0;
                self.potentialTracks = {};

                console.log("Query successfully retrieved.");
                while (trackData = res.data.items[i]) {
                    var track = {
                        videoId: trackData.id,
                        name: trackData.title,
                        img: trackData.thumbnail.sqDefault,
                        duration: trackData.duration,
                        views: trackData.viewCount,
                        dateUpload: trackData.uploaded.substr(0, 10),
                        description: trackData.description,
                        i: i
                    }
                    if (trackData.description.length > 120)
                        track.description = trackData.description.substr(0, 117) + '...';

                    self.potentialTracks[i] = track;
                    i++;
                }
                callback();
                return;
            },

            error: function() {
                callback();
                return null;
            }
        });
        
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