window.NavbarView = Backbone.View.extend({

	count: 0,
	
	events: {
		"click #search-track": "searchVideos",
		"keypress #trackname": "isSubmit",
		"mouseout #search-list-container": "hideEvent",
		"mouseout .navbar": "hideEvent",
		"mouseover #search-list-container": "show",
		"click #trackname": "isNotEmpty",
		"click #search-list td": "addTrack",
        //"input #trackname" : "queryChanged",
        //"blur #trackname" : "searchVideos",
        //"click .search" : "addTrack"
	},

	initialize: function() {
		this.count = 0;
		this.render();
		this.model.on('add', this.refresh, this);
	},

	render: function() {
		$(this.el).html(this.template());

		return this;
	},

	/*-----------------------------------------------------------------------------------------------------
	//	When some tracks are received from the search they must be displayed
	//	This function refreshes the videos results in the right place
	-----------------------------------------------------------------------------------------------------*/

	refresh: function() {
		$('#search-list', this.el).html("");
		var len = this.model.length;

		//	Perform a refresh only if there is videos
		if (len > 0){
			this.show();
			for (var i = 0; i < len; ++i) {
				$('#search-list', this.el).append(new SearchListItemView({model: this.model.at(i)}).render().el);
			}
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
			this.searchVideos();
		}
	},

	queryChanged: function() {
		this.count++;
        var query = $("#trackname", this.el).val();
        if (this.count % 10 == 0 || query[query.length - 1] == " ") this.searchVideos();
	},

	/*-----------------------------------------------------------------------------------------------------
	// Search videos on Youtube API with the query specified in the input 'trackname'
	-----------------------------------------------------------------------------------------------------*/

	searchVideos: function () {
		$('#search-list-container', this.el).removeClass('hidden');
        query = $("#trackname", this.el).val().toLowerCase().replace(/ /g,"+");
        
        if (!query)
            return null;
        
        console.log("Query to Youtube API : " + query);

        //  Searching for videos through the Youtube Data API
        //  Options for the GET request
        var maxResults = 10;
        var url = 'http://gdata.youtube.com/feeds/api/videos';//?q=' + query + '&max-results=' + maxResults + '&alt=jsonc&v=2';

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
            	self.model.reset();
            	//console.log(JSON.stringify(res));
            	console.log("Query successfully retrieved.");
	            while (trackData = res.data.items[i]) {
	                var track = new Track({
	                    videoId: trackData.id,
	                    name: trackData.title,
	                    img: trackData.thumbnail.sqDefault,
	                    duration: trackData.duration,
	                    views: trackData.viewCount,
	                    dateUpload: trackData.uploaded.substr(0, 10),
	                    description: trackData.description,
	                    i: i
	                });
	                if (trackData.description.length > 120)
	                	track.set('description', trackData.description.substr(0, 117) + '...');
	                self.model.add(track);
	                //$("#search-results", this.el).append(new TrackListItemView({model: track}).render().el);
	                i++;
	            }
            },

            error: function() {
                return null;
            }
        });
        
    },

    addTrack: function(e) {
    	elt = e.target;
    	while (elt.nodeName != 'TR')
    		elt = elt.parentNode;
    	
    	var i = $(elt).data('id');
		
		//	We reset the playlist so the first track is the one selected
		playlist.reset();
    	playlist.add(this.model.at(i));

    	//	Then we can hide the search bar, and reset the trackname (is it useful?)
    	this.hide();
    },

    playTrack: function(e) {
    	var i = $(e.target.parentNode).data('id');

    	$('#player').html(new PlayerView({model: this.model.at(i)}).el);
    },

});

window.SearchListItemView = Backbone.View.extend({

	initialize: function() {
	},

	render: function() {
		$(this.el).html(this.template(this.model.toJSON()));
		return this;
	}
});