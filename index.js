var fs = require('fs');

exports = module.exports = (function () {
	
	function Peruna () {
		this.__path = '';
	}

	Peruna.prototype.path = function (path) {
		this.__path = path || '';
	}

	Peruna.prototype.render = function (path) {

		var that = this;

		return function (req, res, next) {
			res.render = function (filename) {
				fs.readFile(Array(__dirname, that.__path, filename).join('/'), 'utf-8', function (err, data) {
					if (err) {
						return res.send(err);
					} else {
						return res.send(that.escape(data.toString()));
					}
				});
			}

			next();
		}
	}

	Peruna.prototype.escape = function (str) {
		return str.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}

	return new Peruna();
}).call(this);