/*-----------------------------------------------------------------------------------------------------
//  Youtube Player API
-----------------------------------------------------------------------------------------------------*/

var HEIGHT = window.innerHeight;
var WIDTH = window.innerWidth;

var tag = document.createElement('script');
tag.src = "//www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

console.log('api loaded');

var player = null;

function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
	    height: HEIGHT,
	    width: WIDTH,
	    //videoId: 'XdvZLcYc8ag',
	    playerVars: {
	    	'controls': 0,
	    	'showinfo': 0,
	    },
	    events: {
	      'onReady': onPlayerReady,
	      'onStateChange': onPlayerStateChange,
	      'onError' : onPlayerError,
	    }
	});
}

//
//	PLAYER EVENTS
//

function onPlayerReady(event) {
    $('#player-container .player-loader').remove();
    app.playlistController.playerReady();
}

function onPlayerStateChange(event) {
	app.playlistController.playerStateChanged(event.data);
}

function onPlayerError() {
	app.playlistController.playerError();
}

//
//	PLAYER CONTROLS
//

function playVideo() {
	if (player != null) {
		player.playVideo();
	}
}

function pauseVideo() {
	if (player != null) {
		player.pauseVideo();
	}
}

function loadAndPlayVideo(id) {
	if (player != null) {
		//console.log('ok');
		player.loadVideoById(id);
		player.playVideo();
	}
}

function loadNextVideo(track) {
	if (player != null) {
		if (track.get('videoId')) {
			console.log('Loading next one on the playlist... ID: ' + track.get('videoId'));
			player.loadVideoById(track.get('videoId'));
		}
	}
}