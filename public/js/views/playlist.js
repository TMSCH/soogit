window.PlaylistView = Backbone.View.extend({

	playerState: null,

	events: {
		"click .play-it": "play",
		"click .pause-it": "pause",
		"click .delete-track": 'deleteNextTrack',
		"click .next-track-button": 'nextTrack',
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
		
		if (playlist.currentTrack != null) {
			data.currentTrack = playlist.currentTrack.toJSON();
		}


		if (this.playerState != null) {
			if (this.playerState == YT.PlayerState.UNSTARTED || this.playerState == YT.PlayerState.PAUSED)
				data.state = 'paused';
			else
				data.state = 'playing';
		} else {
			data.state = "paused";
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

	play: function() {
		playVideo();
	},

	pause: function() {
		pauseVideo();
	},

	nextTrack: function() {
		if (playlist.length > 0) loadAndPlayVideo(playlist.nextTrack());
		else $('#trackname').focus();
	},

	deleteNextTrack: function() {
		if (this.model.length > 0){
			console.log('Deleting next track');
			playlist.shift();
		}
	},

	//
	//	TRACKER
	//	
	//	>>> NEED TO IMPLEMENT THE BUFFER STATUS, QUITE USEFUL... player.getVideoLoadedFraction() <<<
	//

	trackerMoving: false,
	bufferMoving: false,

	videoStartingSec: 0,

	trackerInit: function() {
		$('#tracker').css('left', '0px');
	},

	trackerStartMoving: function() {
		$('#track-navbar, #tracker').removeClass('hidden');

		this.trackerMoving = true;
		this.trackerMovement();
	},

	trackerMovement: function() {
		var self = this;

			setTimeout(function() {
				if (self.trackerMoving) {
					var positionX =  player.getCurrentTime() / playlist.currentTrack.get('durationInSec') * (window.innerWidth - 10);
					positionX = Math.round(positionX);
					//console.log(positionX);
					$('#tracker').css('left', positionX + 'px');

					self.trackerMovement();
				}
			}, 1000);
	},

	trackerStopMoving: function() {
		this.trackerMoving = false;
		$('#tracker').draggable('disable');
	},

	trackerHover: function() {
		if (playlist.currentTrack){
		    $('#tracker').css({
		        'width': '12px',
		        'height': '11px',
		    });
		    $('#tracker').draggable('enable');
		}
	},

	trackerOut: function() {
		$('#tracker').css({
	        'width': '10px',
	        'height': '9px',
	    });
	},

	trackerRelease: function(e, ui) {
		$('#player-mask').addClass('hidden');
		if (ui && playlist.currentTrack) {
			$('#tracker').data('lastPosX', ui.position.left);
			player.seekTo(Math.round(playlist.currentTrack.get('durationInSec') * ui.position.left / (window.innerWidth - 10)), true);
		}
	},

	trackerTracker: function(e, ui) {
		$('#player-mask').removeClass('hidden');
		if (ui && playlist.currentTrack) {
			if (Math.abs(ui.position.left - $('#tracker').data('lastPosX')) > 20) {
				$('#tracker').data('lastPosX', ui.position.left);
				player.seekTo(Math.round(playlist.currentTrack.get('durationInSec') * ui.position.left / (window.innerWidth - 10)), true);
			}
		}
	},

	bufferInit: function() {
		var loadedFraction = player.getVideoLoadedFraction();

		//	If the loaded fraction is very close to where the track current time is (5 sec)
		if (loadedFraction * playlist.currentTrack.get('durationInSec') >= player.getCurrentTime()
			&& loadedFraction * playlist.currentTrack.get('durationInSec') <= player.getCurrentTime() + 5){
			//console.log(loadedFraction);
			this.videoStartingSec = player.getCurrentTime();
			//	If no loop controlling the buffer yet
			if (! this.bufferMoving) this.bufferMovement();
			this.bufferMoving = true;
		}
	},

	bufferMovement: function() {
		var self = this;

			setTimeout(function() {
				if (self.bufferMoving) {
					//	We compute the position and the width of the buffer
					var positionX = self.videoStartingSec / playlist.currentTrack.get('durationInSec') * (window.innerWidth - 10);
					positionX = Math.round(positionX);
					
					var width = (player.getVideoLoadedFraction() - self.videoStartingSec / playlist.currentTrack.get('durationInSec')) * (window.innerWidth - 10);
					width = Math.round(width);
					
					$('#tracker-buffer').css({
						'left': positionX + 'px',
						'width': width + 'px',
					});

					self.bufferMovement();
				}
			}, 1000);
	},

	//
	//	PLAYER EVENTS HANDLING
	//

	playerReady: function() {
	},

	playerStateChanged: function(state) {
		switch (state) {
			case YT.PlayerState.ENDED:
				this.trackerStopMoving();
				this.trackerInit();
				if (playlist.length > 0) loadAndPlayVideo(playlist.nextTrack());
				break;
			case YT.PlayerState.PAUSED:
				this.trackerStopMoving();
				break;
			case YT.PlayerState.PLAYING:
				this.bufferInit();
				this.trackerStartMoving();
				break;
			case YT.PlayerState.BUFFERING:
				this.bufferInit();
				this.trackerStopMoving();
				break;
			case YT.PlayerState.CUED:
				this.trackerStopMoving();
				break;
		}
		this.playerState = state;
		this.render();
	},

	playerError: function() {
	},
});