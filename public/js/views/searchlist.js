window.NavbarView = Backbone.View.extend({

	count: 0,

	searchListItems: [],

	lastSearch: '',
	
	events: {
		"click #search-track": "newSearch",
		"keypress #trackname": "isSubmit",
		"mouseout #search-list-container": "hideEvent",
		"mouseout .navbar": "hideEvent",
		"mouseover #search-list-container": "show",
		"click #trackname": "isNotEmpty",
		"click #search-list td": "hide",
        "input #trackname" : "queryChanged",
	},

	initialize: function() {
		this.count = 0;
		this.render();
		this.model.on('add', this.refresh, this);
		this.model.on('remove', this.refresh, this);
	},

	render: function() {
		$(this.el).html(this.template());
		this.refresh();
		return this;
	},

	/*-----------------------------------------------------------------------------------------------------
	//	When some tracks are received from the search they must be displayed
	//	This function refreshes the videos results in the right place
	-----------------------------------------------------------------------------------------------------*/

	refresh: function() {
		var len = this.model.length;

		//	Perform a refresh only if there is videos
		if (len > 0){
			//	We show the searchlist
			$('#search-list-container', this.el).removeClass('hidden');
			this.show();

			//	We get the number of already loaded views
			var lenLoaded = this.searchListItems.length;

			//	Add the new search results to the search-list div
			//console.log('Updating the search results...');
			for (var i = lenLoaded; i < len; i++) {
				//console.log('Loading result number ' + i);
				this.searchListItems.push(new SearchListItemView({model: this.model.at(i)}));
				$('#search-list', this.el).append(this.searchListItems[i].render().el);
			}
		} else {
			//We remove all the old views
			//console.log('Removing all the search results views');
			$('#search-list', this.el).html("");
			for (var i = 0; i < this.searchListItems.length; i++)
			{
				this.searchListItems[i].remove();
			}
			this.searchListItems = [];
		}
	},


	hideEvent: function(e) {

		//	Checking to see if the mouse is actually leaving the layer of the container
		var reltg = (e.relatedTarget) ? e.relatedTarget : e.toElement;

		//	If not going out of window
		if (reltg != null && reltg.nodeName != 'HTML') {
			//	Verifying all the parent nodes, the node being entered mustn't be a child of the container
			while ( ($(reltg).attr('id') != 'search-list-container' && ! $(reltg).hasClass('navbar') ) && reltg.nodeName != 'BODY') {
				reltg = reltg.parentNode;
			}
			if ($(reltg).attr('id') == 'search-list-container' || $(reltg).hasClass('navbar')) return;
		}
		this.hide();
	},

	hide: function() {
		$('#search-list-container', this.el).animate({'right': '-380px', 'opacity': '0.50'}).addClass('retracted');//.addClass('hidden');
	},

	show: function (e) {
		if ($('#search-list-container', this.el).hasClass('retracted')) {
			$('#search-list-container', this.el).animate({'right': '0px', 'opacity': '1'}).removeClass('retracted').removeClass('hidden');
		}
	},

	isNotEmpty: function(e) {
		if ($(e.target).val() != '') this.show();
	},

	isSubmit: function (e) {
		if (e.keyCode === 13){
			this.newSearch();
		}
	},

	queryChanged: function() {
		this.count++;
        var query = $("#trackname", this.el).val();
        if (query.match(/ $/)){
        	this.newSearch();
        } else {
        	$('#search-track', this.el).addClass('searching-needed');
        }
	},

	/*-----------------------------------------------------------------------------------------------------
	// Search videos on Youtube API with the query specified in the input 'trackname'
	-----------------------------------------------------------------------------------------------------*/

	newSearch: function () {
		var query = $("#trackname", this.el).val().trim();

		//	If the query has changed
		if (query != this.lastSearch){
			
			$('#search-track', this.el).removeClass('searching-needed');
			this.lastSearch = query;
			//	We display the search loader
			$('.search-loader').removeClass('hidden');

	        var self = this;
	        searchVideos(
	        {
	        	query: $("#trackname", this.el).val().trim(),
	        	maxResults: 20
	        },
	        function(tracks){
	        	$('.search-loader').addClass('hidden');

	        	if (tracks == null) return null;

	        	//	Adding the result to the model
	        	self.model.reset();
	        	self.model.trigger('remove');
	        	self.model.add(tracks);
	        	return;
	        });
	    }
    },

});

window.SearchListItemView = Backbone.View.extend({

	events: {
		'click tr': 'addTrackToPlaylist'
	},

	initialize: function() {
	},

	render: function() {
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	},

	addTrackToPlaylist: function() {
		//	We reset the playlist so the first track is the one selected
		playlist.reset(this.model);
	}
});

	/*-----------------------------------------------------------------------------------------------------
    //	Search videos on Youtube API with the query specified in the 'options' object
    //	Options can specify a limit of number of results (maxResults)
    //
    //	The results will be returned as an array of Track if there is more than 1 video,
    //	or just as a Track if there is 1 result
    -----------------------------------------------------------------------------------------------------*/

window.searchVideos = function(options, callback) {

		query = options.query.toLowerCase().replace(/ /g,"+");
		maxResults = typeof options.maxResults !== undefined ? options.maxResults : 1;

        if (!query) {
        	console.log('No query specified');
        	callback(null);
        }
        
        //console.log("Query to Youtube API : " + query);

        //  Searching for videos through the Youtube Data API
        //  Options for the GET request
        var url = 'http://gdata.youtube.com/feeds/api/videos';

        //  Getting the response from Youtube API
        $.ajax({
            url: url,
            data: {q: query,
                    'max-results': maxResults,
                    alt: 'jsonc',
                    v: '2'},

            success: function(res){
                var i = 0;
                tracks = [];

                console.log("Query to Youtube API successfully retrieved.");
                while (trackData = res.data.items[i]) {
                    var track = new Track({
                        videoId: trackData.id,
                        title: trackData.title,
                        img: trackData.thumbnail.sqDefault,
                        durationInSec: trackData.duration,
                        views: trackData.viewCount,
                        uploaded_raw: trackData.uploaded.substr(0, 10),
                        description: trackData.description,
                        youtubeData: true,
                    });

                    tracks.push(track);
                    i++;
                }

                if (i == 0){ //	Rare case we hope
                	console.log('No result were returned with youtube query.')
                	callback(null);
                }
                else
                	callback(tracks);
                return;
            },

            error: function() {
            	console.log('Error while querying Youtube API');
                callback(null);
                return;
            }
        });
}