window.PlaylistView = Backbone.View.extend({

	events: {
		"click .play-it": "pressPlay",
		"click .pause-it": "pressPause",
		"click .delete-track": 'deleteNextTrack',
		"click .next-track-button": 'pressNext',
	},

	initialize: function() {
		this.render();

		//	Any change in the playlist happens we render the playlist
		this.listenTo(playlist, "change", this.render);
		this.listenTo(playlist, 'remove', this.render);

		//	Some messages received by the playlist
		playlist.on('update', this.playlistUpdated, this);
		playlist.on('get-video', this.gettingVideo, this);
		playlist.on('playerStateChange', this.render, this);
		playlist.on('empty', this.render, this);
	},

	render: function(options) {
		data = {};
		console.log(playlist.currentTrack);
		if (playlist.currentTrack != null) {
			data.currentTrack = playlist.currentTrack.toJSON();
		}


		//	Handling player state
		if (options && options.pressPause)
			data.state = 'paused';
		else if (options && options.pressPlay)
			data.state = 'playing';
		else if (player !== undefined) {
			var playerState = player.getPlayerState();
			if (playerState == YT.PlayerState.UNSTARTED || playerState == YT.PlayerState.PAUSED)
				data.state = 'paused';
			else
				data.state = 'playing';
		} else {
			data.state="paused";
		}

		if (this.model.length > 0){
			data.nextTrack = this.model.at(0).toJSON();
			data.onPlaylist = this.model.length;
		} else if(this.model.beingGenerated) {
			data.loadingPlaylist = true;
		} else if (options && options.loadingPlaylistError) {
			data.loadingPlaylistError = true;
		} else {
			data.playlistEmpty = true;
		}
		$(this.el).html(this.template(data));

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
	        if (playlist.length == 0) {	//	If we just added a track to the playlist which did not retrieve any similar tracks
	        	console.log('Error...');
	        	this.render({loadingPlaylistError: true});
	        	var self = this;
	        	setTimeout(function(){
	        		self.render();
	        	}, 2000); //	After 2 seconds we remove the message
	        }
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
		if (player !== undefined) {
			player.playVideo();
			playlist.playing = true;
		}
		this.render({pressPlay: true});
	},

	pressPause: function() {
		if (player !== undefined) {
			player.pauseVideo();
			playlist.playing = false;
		}
		this.render({pressPause: true});
	},

	pressNext: function() {
		if (playlist.length > 0) playlist.playNext();
		else $('#trackname').focus();
		this.render();
	},

	deleteNextTrack: function() {
		if (this.model.length > 0){
			console.log('Deleting next track');
			playlist.shift();
		}
	}
});