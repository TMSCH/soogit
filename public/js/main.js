/*-----------------------------------------------------------------------------------------------------
//  Global variables : playlist, ie TrackCollection
-----------------------------------------------------------------------------------------------------*/

var playlist = new Playlist();

/*-----------------------------------------------------------------------------------------------------
//  Backbone router
-----------------------------------------------------------------------------------------------------*/

var AppRouter = Backbone.Router.extend({

    routes: {
        ""                  : "initialize",
    },

    initialize: function () {
        var trackList = new TrackCollection();
        /*trackList.fetch({success: function(){
            $("#sidebar").html(new SidebarView({model: trackList}).el);
        }});*/
        $('#navbar').html(new NavbarView({model: trackList}).el);
        $('#next-track-container').html(new PlaylistView({model: playlist}).el);
    },

	list: function() {
        var trackList = new TrackCollection();
        /*trackList.fetch({success: function(){
            $("#sidebar").html(new SidebarView({model: trackList}).el);
        }});*/
        $('#navbar').html(new NavbarView({model: trackList}).el);
    },

});

utils.loadTemplate(['NavbarView', 'SearchListItemView', 'PlaylistView'], function() {
    app = new AppRouter();
    Backbone.history.start();
});