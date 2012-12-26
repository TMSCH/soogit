window.SidebarView = Backbone.View.extend({

    count: 0,

    currentSearch: null,

    initialize: function () {
        this.render();
        this.model.on("add", this.render, this);
        this.count = 0;
    },

    events: {
        "click #add-track": "searchVideos",
        "input #trackname" : "queryChanged",
        "click .search" : "addTrack"
    },

    render: function () {
        /*var tracks = this.model.models;
        var len = tracks.length;

        for (var i = 0; i < len; i++) {
            $('#tracklist-container', this.el).append("<li>" + tracks[i].get('name') + "</li>");
        }*/

        $(this.el).html(this.template());

        return this;
    },

    addTrack: function(event) {
        console.log("Adding a new track...");
        var i = $(event.currentTarget).attr('data-id');
        var self = this;
        console.log(JSON.stringify(this.currentSearch));
        var track = new Track(this.currentSearch[i]);
        track.set('type', 'tracklist');
        
        track.save({}, {
            success: function(model) {
                self.model.add(model);
                $("#tracklist-container", this.el).removeClass("hidden");
                $("#search-results", this.el).addClass("hidden");
                $("#trackname", this.el).attr('value', '');
                this.currentSearch = null;
            },
            error: function(model, error) {
                alert(error);
            }
        });
    },

    queryChanged: function() {
        this.count++;
        var query = $("#trackname", this.el).val();
        if (this.count % 10 == 0 || query[query.length - 1] == " ")
            this.searchVideos();
    },
    /*
    loadPropositions: function () {
        var self = this;
        $("#tracklist-container", this.el).addClass("hidden");
        $("#search-results", this.el).removeClass("hidden");
        $.ajax({
            url: "/search-tracks/" + $("#trackname", this.el).val()
        }).done(function(data){
            self.currentSearch = data;
            var i = 0;
            var track = null;
            console.log(JSON.stringify(data));
            $("#search-results", this.el).html("");
            while (data[i] && i < 20) {
                $("#search-results", this.el).append(new TrackListItemView({model: data[i]}).render().el);
                i++;
            }
        });
    },*/

    searchVideos: function () {
        query = $("#trackname", this.el).val().toLowerCase().replace(/ /g,"+");
        
        if (!query)
            return null;
        
        console.log("Query to Youtube API : " + query);

        //  Searching for videos through the Youtube Data API
        //  Options for the GET request
        var maxResults = 10;
        var url = 'http://gdata.youtube.com/feeds/api/videos';//?q=' + query + '&max-results=' + maxResults + '&alt=jsonc&v=2';

        var res = null;

        //  Getting the response from Youtube API
        $.ajax({
            url: url,
            data: {q: query,
                    'max-results': maxResults,
                    alt: 'jsonc',
                    v: '2'},
            success: this.displayResults,
            error: function() {
                return null;
            }
        });
        console.log(JSON.stringify(this.currentSearch));
        
    },

    displayResults: function (res) {
        //  Analyzing the answer
        
        //  if there is no item n° 1
        if (! res.data.items[0]) {
            console.log("Could not retrieve valid data from the result");
            return null;
        }

        //  Else we have at least one result
        else {
            //if (this.currentSearch !== null) this.currentSearch.remove();
            var searchList = new TrackCollection();
            $("#search-results", this.el).html("");
            $("#tracklist-container", this.el).addClass("hidden");
            $("#search-results", this.el).removeClass("hidden");
            var i = 0;
            var trackData = null;
            while (trackData = res.data.items[i]) {
                var track = {
                    videoId: trackData.id,
                    name: trackData.title,
                    img: trackData.thumbnail.sqDefault,
                    duration: trackData.duration,
                    views: trackData.viewCount,
                    dateUpload: trackData.uploaded,
                    description: trackData.description,
                    i: i
                };
                searchList.push(new Track(track));
                //$("#search-results", this.el).append(new TrackListItemView({model: track}).render().el);
                i++;
            }
            $('#search-list').html(new SearchListView({model: searchList}).render().el);
            //   console.log(JSON.stringify(this.currentSearch));
        }
    }
});

window.TrackListItemView = Backbone.View.extend({
    
    tagName : "li",

    initialize: function() {

    },

    render: function() {
        $(this.el).html(this.template(this.model));
        return this;
    }
});