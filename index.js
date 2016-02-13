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

		var blocks = html.match(/<peruna[^]*>[^]*<\/peruna>/g);

		for (var i = 0; i < blocks.length; i++) {
			var attrs = blocks[i].match(/\w*[\s\S]=["'][\s\S][^"]*["']/g);

			for (var j = 0; j < attrs.length; j++) {
				
				attrs[j] = attrs[j].replace(/"/g, '');
				var cmd = attrs[j].split(/\b=/)[0];
				var toeval = attrs[j].split(/\b=/)[1];

				switch (cmd) {
					case 'hide':
						var hide;

						if (toeval == 'true' || toeval == 'false') {
							hide = eval(toeval);
						} else {
							hide = eval('opts.' + toeval);
						}

						html = hide ? html.replace(blocks[i], '') : html;
						break;

					case 'loop':
						toeval = toeval.replace(/["']/g, '');
						if (!toeval.match(/\w* in \w*/)) {
							break;
						}

						var varName = toeval.split(' in ')[0];
						var objName = toeval.split(' in ')[1];

						var obj = eval('opts.' + objName);
						if (!obj) {
							break;
						}

						var result = '';
						var elements = blocks[i].replace(/<peruna[^>]*>/, '');
						elements = elements.replace('</peruna>', '');


						for (var n = 0; n < obj.length; n++) {
							var params = {};
							params[varName] = obj[n];
							var val = this.initBinds(elements, params);
							result += val;
						}				

						html = html.replace(blocks[i], result);		

						break;

				}
			}

		}

		html = this.initBinds(html, opts);


		return html;
	}

	Peruna.prototype.initBinds = function (html, opts) {
		var matches = html.match(/{{[^}}]*}}/g);

		for (var i = 0; i < matches.length; i++) {
			var val = matches[i].replace(/[{}\s]/g, '');
			console.log(val);

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