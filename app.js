
/**
 * Module dependencies.
 */

var express = require('express'),
    http = require('http'),
    api = require('./routes/api');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  //  app.set('views', __dirname + '/views');
  app.use(express.logger('dev'));  /* 'default', 'short', 'tiny', 'dev' */
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  //  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', api.findAll);
app.get('/tracks', api.findAll);
app.post('/tracks', api.addTrack);
app.get('/playlist/:track', api.generatePlaylistFromTrack);
app.post('playlist', api.generatePlaylistFromTracklist);
app.get('/search-tracks/:query', api.searchTracks)
app.delete('/tracks/:id', api.deleteTrack);

app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
