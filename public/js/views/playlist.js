window.PlaylistView = Backbone.View.extend({
	
	events: {
		"click .play-it": "pressPlay",
		"click .delete-track": 'deleteNextTrack',
	},

	initialize: function() {
		this.render();
		//this.model.on('reset', this.updatePlaylist, this);
		//this.model.on('remove', this.updatePlaylist, this);
		//this.model.on('reset', this.render, this);
		//this.model.on('remove', this.render, this);
		playlist.on('update', this.playlistUpdated, this);
		playlist.on('get-video', this.gettingVideo, this);
		playlist.on('empty', this.render, this);
	},

	render: function() {
		if (this.model.length > 0){
			track = this.model.at(0).toJSON();
			track.onPlaylist = this.model.length;
		} else if(this.model.beingGenerated) {
			track = {loadingPlaylist: true}
		} else {
			track = {};
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
	        $('.playlist-info').html('We could not find similar tracks, sorry');
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

	pressPlay: function() {
		if (this.model.length > 0)
			loadNextVideo(this.model.shift());
		else
			$('#trackname').focus();
	},

	deleteNextTrack: function() {
		if (this.model.length > 0){
			console.log('Deleting next track');
			this.model.shift();
		}
	}
});