/*-----------------------------------------------------------------------------------------------------
//  Global variables : playlist, ie TrackCollection
-----------------------------------------------------------------------------------------------------*/

var playlist = new TrackCollection(new Track({name: "Burial - Street Halo"}));

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
        $('#next-track-container').html(new NextTrackView({model: playlist}).el);
    },

	list: function() {
        var trackList = new TrackCollection();
        /*trackList.fetch({success: function(){
            $("#sidebar").html(new SidebarView({model: trackList}).el);
        }});*/
        $('#navbar').html(new NavbarView({model: trackList}).el);
    },

});

utils.loadTemplate(['NavbarView', 'SearchListItemView', 'NextTrackView'], function() {
    app = new AppRouter();
    Backbone.history.start();
});