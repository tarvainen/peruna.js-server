# DEPRECATED

Development of this library has been ended decades ago. Please don't use bullshit this anymore. Pull requests and issues will be just ignored because I simply have no time for this. 

Package from the npm will not be removed.

# peruna.js-server
The first no-bullshit JS framework for server side!

## Installation
Download files to your project node_modules and require files in your server.js. In your server.js file the content below.

    var express = require('express');
    var peruna = require('peruna.js-server');
    var app = express();
    var urlParser = require('urlparser');
    
    peruna.setViewPath('public/pages');
    peruna.setControllersPath('public/js/');
    
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

    <!-- Add the controller as the very first thing on your template file. -->
    <% controller="mainController" %>
    
    <!DOCTYPE html>
    
    <html>
    
    <head>
    	<title>[[ title ]]</title>
    	<link rel="stylesheet" href="/css/style.css" />
    </head>
    
    <body>
    	<!-- The whole thing must be wrapped inside one form tag. -->
    	<form>
    
    		<% include="nav.html" %><!-- Includes the nav.html file to this location. -->
    
    		<p>GET PARAM 'text': [[ request.body.text ]]</p>
    
    		<input type="text" name="text" value="[[ request.body.text ]]"/>
    		<input type="submit" value="Send!"/>
    
    		<h1>Button [[ button ]] pressed!</h1>
    
    		<input type="submit" name="btn1" p-click-server="handleClick()" value="button1"/>
    
    		<input type="submit" name="btn2" p-click-server="handleClick()" value="button2"/>
    
    		<input type="submit" name="btn3" p-click-server="handleClick()" value="button3"/>
    
    	</form>
    
    </body>
    
    </html>

You have also to create your index.js with the next content.

    peruna.controller('mainController', function (scope) {
    	
    	scope.title = 'The page title';

    	scope.handleClick = function () {
    		scope.button = this.value;
    		console.log('The button clicked!');
    	}
    	
    	this.on('init', function () {
    	    console.log('peruna.js init');
    	});
    	
    	this.on('get', function (data) {
    	    console.log('got something GET data');
    	});
    	
    	this.on('post', function (data) {
    	    console.log('got something POST data');
    	});
    	
    	this.on('data', function (data) {
    	    console.log('got just something data');
    	});
    	
    });
    
