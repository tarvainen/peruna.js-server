exports = module.exports = (function () {

	function UrlParser () {

	}

	UrlParser.prototype.parse = function () {
		var that = this;
		return function (req, res, next) {
			if (req.method == 'POST') {
				that.parsePost(req, res, next);
			} else if (req.method == 'GET') {
				that.parseGet(req, res, next);
			}
		}
	}

	UrlParser.prototype.parseUrlString = function (urlString) {
		var url = urlString.split('&');

		if (!url) {
			return req.body = {};
		}

		var body = {};

		for (var i in url) {
			var paramName = url[i].split('=')[0];
			var value = url[i].split('=')[1];
			body[paramName] = value;
		}

		return body;
	}

	UrlParser.prototype.parseGet = function (req, res, next) {
		var url = req.originalUrl.replace(/[?\/]/g, '');
		req.body = this.parseUrlString(url);
		return next();
	}

	UrlParser.prototype.parsePost = function (req, res, next) {
		var that = this;
		var url = '';

		req.on('data', function (data) {
			url += data;
		});

		req.on('end', function () {
			req.body = that.parseUrlString(url);
			console.log(req.body);
			return next();
		});
	}

	return new UrlParser();
	
}).call(this);