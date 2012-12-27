window.PlaylistView = Backbone.View.extend({
	
	events: {
		"mouseover #next-track": "togglePlay",
		"mouseout #next-track": "removePlay",
		"click #next-track": "pressPlay",
	},

	initialize: function() {
		this.render();
		//this.model.on('reset', this.updatePlaylist, this);
		//this.model.on('remove', this.updatePlaylist, this);
		//this.model.on('reset', this.render, this);
		//this.model.on('remove', this.render, this);
		this.model.on('update', this.playlistUpdated, this);
		this.model.on('get-video', this.gettingVideo, this);
	},

	render: function() {
		if (this.model.length > 0){
			track = this.model.at(0).toJSON();
			track.onPlaylist = this.model.length;
		} else {
			track = {}
		}
		$(this.el).html(this.template(track));

		return this;
	},

	playlistUpdated: function(message) {
		this.render();
		if (message == 'start') {
			$('.playlist-loader, .playlist-info').removeClass('hidden');
			$('.playlist-info').html('Loading a playlist with similar tracks...');
		} else if (message == 'success') {
			$('.playlist-loader', this.el).addClass('hidden');
		} else if (message == 'error') {
			$('.playlist-loader').addClass('hidden');
	        $('.playlist-info').html('| We could not find similar tracks, sorry');
		}
	},

	gettingVideo: function(message) {
		if (message == 'start') {
			this.render();
		} else if (message == 'success') {
			this.render();
		} else if (message == 'error') {
			this.render();
		}
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
		if (this.model.length > 0)
			//this.model.shift();
			loadNextVideo(this.model.shift());
		else
			$('#trackname').focus();
	}
});