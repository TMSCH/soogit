/*-----------------------------------------------------------------------------------------------------
//  Global variables : playlist, ie TrackCollection
-----------------------------------------------------------------------------------------------------*/

var playlist = new Playlist();
/*
playlist.push({
    name: 'Rough Sleep',
    artist: 'Burial',
    videoTitle : 'Burial - Rough Sleep',
    videoId: 'XdvZLcYc8ag',
    durationInSec: 828,
    youtubeData: true
}, {silent : true});//*/

/*-----------------------------------------------------------------------------------------------------
//  Backbone router
-----------------------------------------------------------------------------------------------------*/

var AppRouter = Backbone.Router.extend({

    playlistController: null,

    routes: {
        ""                  : "initialize",
        "help"              : "help",
    },

    initialize: function () {
        var trackList = new TrackCollection();
        /*trackList.fetch({success: function(){
            $("#sidebar").html(new SidebarView({model: trackList}).el);
        }});*/
        $('#navbar').html(new NavbarView({model: trackList}).el);
        this.playlistController = new PlaylistView({model: playlist});
        $('#next-track-container').html(this.playlistController.el);
    },

	list: function() {
        var trackList = new TrackCollection();
        /*trackList.fetch({success: function(){
            $("#sidebar").html(new SidebarView({model: trackList}).el);
        }});*/
        $('#navbar').html(new NavbarView({model: trackList}).el);
    },

    help: function() {
        $('#main-container').append(new HelpView().el);
    },

});

utils.loadTemplate(['NavbarView', 'SearchListItemView', 'PlaylistView', 'HelpView'], function() {
    app = new AppRouter();
    Backbone.history.start();
});

jQuery(document).ready(function($) {

    //  transparency after 5000 delay
    //  Idle handle
    $.idleTimer(5000);
    $(document).bind("idle.idleTimer", function(){
        $('#top-bar, #next-track-container, #track-navbar').animate({opacity: 0.2}, 1000);
    });


    $(document).bind("active.idleTimer", function(){
        $('#top-bar, #next-track-container, #track-navbar').animate({opacity: 1});
    });

    //  Player mask
    $('#player-mask').css({'width': window.innerWidth + 'px', 'height': window.innerHeight + 'px'});
    /*$('#player-mask').click(function() {
        playVideo();
    });*/

    //  Search list container
    $('#search-list-container').css('height', window.innerHeight - 60 + 'px');

    setTimeout(startTracker, 1000);

});

function startTracker() {
    if (app){
        //  Tracker properties
        $('#tracker').draggable({
                axis: 'x',
                drag: app.playlistController.trackerTracker,
                stop: app.playlistController.trackerRelease,
        })
            .click(function(e){
                e.stopPropagation();
            })
            .draggable('disable')
            .css('opacity', 1).data('lastPosX', 0)
            .hover(app.playlistController.trackerHover, app.playlistController.trackerOut);

        //  Clicking on the bar of tracker
        $('#track-navbar').click(function(e) {
            if (playlist.currentTrack) {
                $('#tracker').css('left', e.pageX - 5);
                player.seekTo(Math.round(playlist.currentTrack.get('durationInSec') * e.pageX / (window.innerWidth - 10)), true);
            }
        });

        $(document).on('mouseup', function() {
            $('#tracker').draggable('disable');
            $('#tracker').css('opacity', 1);
            $('#player-mask').addClass('hidden');
            //app.playlistController.trackerRelease();
        });

        $(window).resize(function() {
            if (player !== undefined) player.setSize(window.innerWidth, window.innerHeight);
        });
    } else setTimeout(startTracker, 1000);
}