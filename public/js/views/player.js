/*-----------------------------------------------------------------------------------------------------
//  Youtube Player API
-----------------------------------------------------------------------------------------------------*/

var WIDTH = 853;
var HEIGHT = 480;

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
	      'onStateChange': onPlayerStateChange
	    }
	});
}

function onPlayerReady(event) {
    //event.target.playVideo();
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
    	console.log('Video ended');
    	loadNextVideo();
    }
}

function loadNextVideo() {
	//	If the playlist is not empty
	if (playlist.length != 0) {
		//	Taking the first track in the playlist
		var track = playlist.shift();
		if (track.get('videoId')) {
			console.log('Loading next one on the playlist... ID: ' + track.get('videoId'));
			player.loadVideoById(track.get('videoId'));
		}
	}
}