# peruna.js-server
The first no-bullshit JS framework for server side!

## Installation
Download files to your project node_modules and require files in your server.js. In your server.js file the content below.

    var express = require('express');
    var peruna = require('peruna-server');
    var app = express();
    var urlParser = require('urlparser');
    
    peruna.path('public/pages');
    peruna.setControllersPath('public/js/');
    
    app.use('/views', express.static(__dirname + '/public/pages/'));
    app.use(urlParser.parse());
    app.use(peruna.render('/views'));
    
    app.use('/', function (req, res, next) {
    	res.render('index.html');
    });
    
    app.listen(3000, function () {
    	console.log('App listening on ' + 3000);
    }); 

## Usage
Add peruna controller as the very first element in to your html file.
    <peruna controller="mainController" />

    <html>
      <head>
        <title>[[ title ]]</title>
      </head>
    
      <body>
        
        // use object or array to loop
        <peruna loop="value in vals">
        	<p>[[ value ]]</p>
        </peruna>
        
        // just use value for loop
        <peruna loop="4">
        	<p>The index value is [[ index ]]</p>
        </peruna>
      
        <p>GET params: [[ request.body.text ]]</p>
      
        <form method="GET">
          // function to call on server
        	<peruna submit="handleData"/>
        	<input type="text" name="text" value="[[ request.body.text || '']]"/>
        	<input type="submit" value="Send!"/>
        </form>
      
      </body>
    </html>

Also you have to create your index.js with the next content.

    peruna.controller('mainController', function (scope) {
    	
    	scope.title = 'The page title';
    	scope.vals = [];
    	
    	for (var i = 0; i < 10; i++) {
    		scope.vals.push(i);
    	}
    
    	scope.handleData = function (data) {
    		console.log('got some GET data!');
    	}
    
    	this.on('init', function () {
    		// called on controller initialization
    	});
    
    	this.on('data', function (data) {
        // general function called on data receive
    	});
    
    	this.on('get', function (data) {
        // called always on GET data receive
    	});
    
    });
    
