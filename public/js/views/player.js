/*-----------------------------------------------------------------------------------------------------
//  Youtube Player API
-----------------------------------------------------------------------------------------------------*/

var HEIGHT = window.innerHeight - 120;
var WIDTH = Math.round(HEIGHT * 640 / 360);

var tag = document.createElement('script');
tag.src = "//www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var track = new Track({videoId: 'XdvZLcYc8ag', name: 'Burial - Rough Sleeper'});
console.log('api loaded');

var player;

function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
	    height: HEIGHT,
	    width: WIDTH,
	    videoId: 'XdvZLcYc8ag',
	    events: {
	      'onReady': onPlayerReady,
	      'onStateChange': onPlayerStateChange,
	      'onError' : onPlayerError,
	    }
	});
}

function onPlayerReady(event) {
    //event.target.playVideo();
    $('#player-container .player-loader').remove();
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
    	console.log('Video ended');
    	if (playlist.length > 0)
    		loadNextVideo(playlist.shift());
    }
}

function onPlayerError() {
	loadNextVideo(playlist.shift());
}

function loadNextVideo(track) {
	if (track.get('videoId')) {
		console.log('Loading next one on the playlist... ID: ' + track.get('videoId'));
		player.loadVideoById(track.get('videoId'));
	}
}