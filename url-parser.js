exports = module.exports = (function () {

	function UrlParser () {

	}

	UrlParser.prototype.parse = function (req, res, next) {
		var url = req.originalUrl.replace(/[?\/]/g, '').split('&');
		if (!url) {
			return req.body = {};
		}

		var body = {};

		for (var i in url) {
			var paramName = url[i].split('=')[0];
			var value = url[i].split('=')[1];
			body[paramName] = value;
		}

		return req.body = body;
	}

	return new UrlParser();
	
}).call(this);