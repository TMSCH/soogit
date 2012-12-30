window.HelpView = Backbone.View.extend({
	
	events: {
		'click .mask, .close, #help-container': 'close',
	},

	initialize: function() {
		this.render();
	},

	render: function() {
		$(this.el).html(this.template());
		return this;
	},

	close: function(e) {
		e.stopPropagation();
		if ($(e.target).hasClass('close') || $(e.target).hasClass('mask') || $(e.target).is("#help-container")) {
			app.navigate('');
			this.remove();
		}
	},
});