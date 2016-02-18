var PerunaTemplate = require('./peruna-template.js');

exports = module.exports = (function () {
	
	function Peruna () {
		this.__path = '';
	}

	Peruna.prototype.setControllersPath = function (path) {
		this.cPath = path;
	}

	Peruna.prototype.setViewPath = function (path) {
		this.__path = path || '';
	}

	Peruna.prototype.render = function (path) {
		var that = this;

		return function (req, res, next) {
			res.render = function (filename) {
				var tmp = new PerunaTemplate(that.__path, that.cPath, req);
				tmp.on('ready', function (html) {
					return res.send(html);
				});

				tmp.on('error', function (err) {
					res.status(200).send({
						msg: err
					});
				});

				tmp.render(filename);
			}

			next();
		}
	}

	return new Peruna();

}).call(this);