exports = module.exports = (function () {
	
	function Keksi () {

	}

	Keksi.prototype.parse = function () {
		return function (req, res, next) {
			var cookies = {};
			var cookieStr = req.headers.cookie;
			var cookieArray = cookieStr.split(';');

			for (var i in cookieArray) {
				var parts = cookieArray[i].split('=');
				cookies[parts[0]] = parts[1];
			}

			req.cookies = cookies;

			return next();
		}
	}

	return new Keksi();
	
}).call(this);