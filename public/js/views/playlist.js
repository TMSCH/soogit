window.NextTrackView = Backbone.View.extend({
	
	events: {
		"mouseover #next-track": "togglePlay",
		"mouseout #next-track": "removePlay",
		"click #next-track": "pressPlay",
	},

	initialize: function() {
		this.render();
		this.model.on('add', this.updatePlaylist, this);
		this.model.on('remove', this.updatePlaylist, this);
	},

	render: function() {
		var track = null;
		if (this.model.length > 0){
			track = this.model.at(0).toJSON();
		} else {
			track = {name: "No track in the playlist : add another one !"}
		}
		$(this.el).html(this.template(track));
		return this;
	},

	updatePlaylist: function() {
		if (this.model.length == 1){
			var url = 'playlist/' + this.model.at(0).get('name');
			var self = this;
			$.ajax({
	            url: url,
	            success: function(data){
	            	console.log(data);
	            	
	            	//	We got similar tracks. Now we must store them in the playlist with their associated Youtube information
	            	var i = 0;
	            	var toAddToPlaylist = [];
	            	var track;
	            	while (data[i]){
	            		track = new Track({name: data[i].name, artist: data[i].artist});
	            		//console.log(track);
	            		if (track != null) toAddToPlaylist.push(track);
	            		i++;
	            	}
	            	self.model.add(toAddToPlaylist);
	            },
	            error: function() {
	            	console.log('Error when retrieving similar tracks');
	            }
	        });
		} else if (this.model.length > 1) {
			if (! this.model.at(0).has('videoId')){
				this.model.at(0).searchOneVideo(function(){});
			}
		}
		this.render();
	},

	togglePlay: function(){
		if (this.model.length > 0) {
			$('#next-track .next-one').addClass('hidden');
			$('#next-track .play-it').removeClass('hidden');
		}
	},

	removePlay: function(){
		if (this.model.length > 0) {
			$('#next-track .next-one').removeClass('hidden');
			$('#next-track .play-it').addClass('hidden');
		}
	},

	pressPlay: function() {
		loadNextVideo();
	}
});