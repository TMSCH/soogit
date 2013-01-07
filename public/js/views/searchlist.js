window.NavbarView = Backbone.View.extend({

	count: 0,

	searchListItems: [],

	suggestQueries: [],

	lastSearch: '',

	panelMoving: false,
	
	events: {
		"click #search-track": "newSearch",
		"keypress #trackname": "isSubmit",
		"mouseout #search-list-container": "hideEvent",
		"mouseout .navbar": "hideEvent",
		"mouseover #search-list-container": "show",
		"click #trackname": "isNotEmpty",
		"click #search-list td": "hide",
		"paste #trackname" : "pastedInput",
        "input #trackname" : "queryChanged",
        "autocompleteselect #trackname" : "newSearch",
	},

	initialize: function() {
		this.count = 0;
		this.render();
		this.model.on('add', this.refresh, this);
		this.model.on('remove', this.refresh, this);
	},

	render: function() {
		$(this.el).html(this.template());
		$('#trackname', this.el).autocomplete({
			source: this.suggestQueries,
		}).tooltip();
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

			//	Mosueover effect of the add to playlist icon
			$( "#search-list .add-to-playlist" ).hover(
				function() {
					$( this ).addClass( "ui-state-hover" );
				},
				function() {
					$( this ).removeClass( "ui-state-hover" );
				}
			);

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
		if (! this.panelMoving){
			var self = this;
			this.panelMoving = true;
			$('#search-list-container', this.el).addClass('retracted')
									.animate({'right': '-350px', 'opacity': '0.50'}, 300, 'swing', function(){self.panelMoving = false});
		}
	},

	show: function (e) {
		if ($('#search-list-container', this.el).hasClass('retracted') && this.model.length > 0) {
			if (! this.panelMoving) {
				var self = this;
				this.panelMoving = true;
				$('#search-list-container', this.el).removeClass('retracted')
								.removeClass('hidden')
								.animate({'right': '0px', 'opacity': '1'}, 300, 'swing', function(){self.panelMoving = false});
				$('#trackname').autocomplete('close');
			}
		} else if (this.model.length == 0) {
			$('#trackname').tooltip('open');
		}
	},

	isNotEmpty: function(e) {
		$('#trackname').tooltip('open');
		if ($(e.target).val() != '') this.show();
	},

	isSubmit: function (e) {
		if (e.keyCode === 13){
			$('#trackname').autocomplete('close');
			this.newSearch();
		}
	},

	pastedInput: function () {
		var self = this;
		setTimeout(function() {
			//	If the pasted value is a link
			if ($('#trackname').val().match(/youtube.com/i)) {
				//	The loader cause we have to show it's working
				$('.search-loader').removeClass('hidden');

				var track = new Track({
					//	We retrieve the video id
					videoId: $('#trackname').val().substr($('#trackname').val().indexOf('v=') + 2, 11),
				});
				//console.log(track.get('videoId'));
				
				//	Then we have to wait a little so the youtube data are gathered
				setTimeout(function(){
					if (track) { //	If the track still exists, ie youtube data are retrieved
						playlist.reset(track);
						loadNextVideo(playlist.shift());
						$('.search-loader').addClass('hidden');
						$('#trackname').val('');
					}
				}, 1000);
			} else
				self.newSearch();
		}, 4);
	},

	queryChanged: function() {
        //	AUTO COMPLETE :::::: http://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=QUERY
        //
        //	Answers formatting, js file containing a JSON :
        //	window.google.ac.h(["cherokee tak",[["cherokee take care of you",0,[]],
        //	["cherokee take care of you remix",0,[]],["cherokee take",0,[]],["cherokee take care of you live",0,[]],
        //	["cherokee take off",0,[]],["piper cherokee take off",0,[5]]],{"k":1,"q":"WnwK5SSeBruIXriutemVq24xsW4"}])
		//

		$('#trackname').tooltip('close');

		if (this.lastSearch != $("#trackname", this.el).val())
			$('#trackname').autocomplete('enable');

		this.count++;

        if (this.count > 2) {
        	this.count = 0;
        	var query = $("#trackname", this.el).val();

			var url = 'http://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=' + encodeURIComponent(query);
			var self = this;
			if (this.lastSearch != $("#trackname", this.el).val()) {
				$.ajax(url, {
					dataType: 'jsonp',
					success: function (data) {
						if (typeof data[1] !== undefined){
							self.suggestQueries = [];
							$.each(data[1], function (key, val){
								self.suggestQueries.push(val[0]);
							});
						}
						$('#trackname', self.el).autocomplete( 'option', {source: self.suggestQueries} );
					}
				});
			}
		}
	},

	/*-----------------------------------------------------------------------------------------------------
	// Search videos on Youtube API with the query specified in the input 'trackname'
	-----------------------------------------------------------------------------------------------------*/

	newSearch: function () {
		$('#trackname').autocomplete('disable');
		//console.log(query);

		//	If the query has changed
		if ($("#trackname", this.el).val() != this.lastSearch){
			this.lastSearch = $("#trackname", this.el).val();
			
			$('#search-track', this.el).removeClass('searching-needed');
			//	We display the search loader
			$('.search-loader').removeClass('hidden');

	        var self = this;
	        searchVideos(
	        {
	        	query: $("#trackname", this.el).val().replace(/[^\w\d]/gi, ' ').replace(/ {2,}/gi, ' ').trim(),
	        	maxResults: 20
	        },
	        function(tracks){
	        	$('.search-loader').addClass('hidden');

	        	if (tracks == null) {
	        		//	Tooltip to say we haven't found any videos
	        		$('#trackname').attr('title', 'No video found');
	        		$('#trackname').tooltip('open');
	        		return null;
	        	}

	        	//	Adding the result to the model
	        	self.model.reset();
	        	self.model.trigger('remove');
	        	self.model.addTracksFromYoutube(tracks);
	        	return;
	        });
	    } else if (this.model.length == 0) {
	    	$('#trackname').attr('title', 'No video found');
	        $('#trackname').tooltip('open');
	    }
    },

});

window.SearchListItemView = Backbone.View.extend({

	events: {
		'click .add-to-playlist, td' : 'addTrackToPlaylist', // The order of the .add-to-playlist and td is important !!!
	},

	initialize: function() {
	},

	render: function() {
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	},

	addTrackToPlaylist: function(e) {
		e.stopPropagation();
		//	We reset the playlist so the first track is the one selected
		playlist.reset(this.model);
		console.log($(e.currentTarget).hasClass('add-to-playlist'));
		//	We check whether the 'add-to-playlist' link has been clicked, if not we load the video
		if (! $(e.currentTarget).hasClass('add-to-playlist'))
			loadNextVideo(playlist.shift());
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
            dataType: 'jsonp',
            data: {q: query,
                    'max-results': maxResults,
                    alt: 'jsonc',
                    v: '2'},

            success: function(res){
                var i = 0;
                tracks = [];

                //res = JSON.parse(res);

                console.log("Query to Youtube API successfully retrieved.");
                console.log(res);
                if (res.data.items) {
	                /*while (trackData = res.data.items[i]) {
	                    var track = new Track({
	                        videoId: trackData.id,
	                        title: trackData.title,
	                        img: trackData.thumbnail.sqDefault,
	                        durationInSec: trackData.duration,
	                        views: trackData.viewCount,
	                        uploaded_raw: trackData.uploaded,
	                        description: trackData.description,
	                        youtubeData: true,
	                    });

	                    tracks.push(track);
	                    i++;
	                }
	                callback(tracks);*/
	                callback(res.data.items);
	            } else {
	            	console.log("No results from the query...");
	            	callback(null);
	            }
            },

            error: function() {
            	console.log('Error while querying Youtube API');
                callback(null);
                return;
            }
        });
}