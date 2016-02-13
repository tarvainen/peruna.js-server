var fs = require('fs');
var domparser = require('./domparser');

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
			res.render = function (filename, opts) {
				fs.readFile(Array(__dirname, that.__path, filename).join('/'), 'utf-8', function (err, data) {
					if (err) {
						return res.send(err);
					} else {
						var html = that.parse(data, opts);
						return res.send(html);
					}
				});
			}

			next();
		}
	}

	Peruna.prototype.parse = function (html, opts) {
		opts = opts || {};

		html = this.initBinds(html, opts);

		console.log(html);
		var blocks = html.match(/<peruna[^]*>[^]*<\/peruna>/g);


		for (var i = 0; i < blocks.length; i++) {
			var attrs = blocks[i].match(/(\w*[\s\S]="[^]*")/g);


			for (var j = 0; j < attrs.length; j++) {
				attrs[j] = attrs[j].replace(/["']/g, '');

				console.log(attrs[j]);
				var cmd = attrs[j].split(/=/)[0];
				var toeval = attrs[j].split(/=/)[1];

				switch (cmd) {
					case 'hide':
						var hide;
						console.log(toeval);
						if (toeval == 'true' || toeval == 'false') {
							hide = eval(toeval);
						} else {
							hide = eval('opts.' + toeval);
						}

						html = hide ? html.replace(blocks[i], '') : html;
						break;

				}
			}

		}

		return html;
	}

	Peruna.prototype.initBinds = function (html, opts) {
		var matches = html.match(/{{\s\w*\s}}/g);

		for (var i = 0; i < matches.length; i++) {

			var val = matches[i].replace(/{/g, '').replace(/}/g, '').replace(/\s/g, '');

			html = html.replace(matches[i], eval('opts.' + val));
		}

		return html;
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