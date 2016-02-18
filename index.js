var fs = require('fs');
var PerunaController = require('./peruna-controller.js');
var nf = require('./node-factory.js');
var urlParser = require('./url-parser.js');

exports = module.exports = (function () {
	
	function Peruna () {
		this.__path = '';
		this.controllers = {};
		this.debug = true;
	}

	Peruna.prototype.log = function (data, err) {
		if (this.debug) {
			console.log('[peruna]' + data);
		}
	}

	Peruna.prototype.err = function (data) {
		console.log('\x1b[31m', '[peruna]' + data);
		console.log('\x1b[30m');
	}

	Peruna.prototype.path = function (path) {
		this.__path = path || '';
	}

	Peruna.prototype.render = function (path) {
		var that = this;

		return function (req, res, next) {
			res.render = function (filename) {
				var fp = Array(__dirname, that.__path, filename).join('/');
				fs.readFile(fp, 'utf-8', function (err, data) {
					if (err) {
						return res.send(err);
					} else {
						var html = that.parse(data, req, function (html) {
							return res.send(html);
						});
					}
				});
			}

			next();
		}
	}

	Peruna.prototype.setControllersPath = function (path) {
		this.controllersPath = path;
	}

	Peruna.prototype.initControllers = function (callback) {
		this.log('Initializing controllers.');
		var peruna = this;
		var fp = Array(__dirname, this.controllersPath).join('/');

		fs.readdir(fp, function (err, files) {
			files = files || [];

			files = files.join(' ').match(/[^\s]*\.js/g);

			for (var i in files) {
				var data = fs.readFileSync(fp + '/' + files[i], 'utf-8');
				eval(data);
			}

			callback();
		});
	}

	Peruna.prototype.controller = function (controller, callback) {
		this.log('Call to create controller ' + controller);
		this.controllers[controller] = new PerunaController();
		callback.call(this.controllers[controller], this.controllers[controller].scope);
		this.controllers[controller].emit('create');
	}

	Peruna.prototype.parse = function (html, req, callback) {
		this.log('Parsing html.');
		var that = this;
		this.initControllers(function () {
			html = that.removeComments(html);

			// find the used controller
			var regex = /<peruna.*?(?=controller=)(.*?(?=["'])['"].*?(?=['"])["'])/;
			var ctrls = html.match(regex);
			that.log(ctrls);
			
			if (!ctrls) {
				return callback(html);
			}


			var controller = ctrls[1];
			var cName = controller.replace(/['"]/g, '').split('=')[1];
			controller = that.controllers[cName] || {};

			that.initControllerEvents(controller);

			if (req.body) {
				controller.emit(req.method.toLowerCase(), req.body);
				controller.emit('data', req.body);
			}

			opts = controller.scope || opts;
			opts.request = req;

			html = that.initEmptyBlocks(html, opts);
			html = that.removeEmptyBlocks(html);
			html = that.initAllBlocks(html, opts);
			html = that.initAllBinds(html, opts);
			controller.emit('ready');
			callback(html);
		});
	}

	Peruna.prototype.initControllerEvents = function (controller) {
		this.log('Initializing controller events.');
		controller.on('data', function (data) {
			data = data || {};

			var scope = controller.scope;
			if (data.onsubmit && typeof scope[data.onsubmit] == 'function') {
				var submitFunc = data.onsubmit;
				delete data.onsubmit;
				scope[submitFunc].call(controller, data);
			}

		});
	}

	Peruna.prototype.initEmptyBlocks = function (html, opts) {
			var emptyBlocks = html.match(/<peruna[^>]*\/>/g);

			for (var i in emptyBlocks) {
				html = this.initSingleEmptyBlock(html, opts, emptyBlocks[i]);
			}

			return html;
	}

	Peruna.prototype.initSingleEmptyBlock = function (html, opts, block) {
		var attrs = block.match(/\w*[\s\S]=["'][\s\S][^"]*["']/g);
		var result = '';

		for (var i in attrs) {
			result += this.initDirectiveAttribute(attrs[i]);
		}

		return html.replace(block, result);
	}

	Peruna.prototype.initDirectiveAttribute = function (attr) {
		attr = attr.replace(/['"]/g, '');

		var cmd = attr.split(/\b=/)[0];
		var toEval = attr.split(/\b=/)[1];

		switch (cmd) {
			case 'include':
				return this.includeFile(toEval);
				break;
			case 'submit':
				return nf.create('input', {
					type: 'text',
					name: 'onsubmit',
					hidden: true,
					value: toEval
				}, true);
				break;
			default:
				return '';
		}
	}

	Peruna.prototype.includeFile = function (filename) {
		filename = filename || '';
		var fp = Array(__dirname, this.__path, filename).join('/');
		try {
			return fs.readFileSync(fp);
		} catch (e) {
			this.err('Unable to read file ' + fp);
			return '';
		}
	}

	Peruna.prototype.removeEmptyBlocks = function (html) {
		return html.replace(/<peruna[^>]*?(?=\/>)\/>/g, '');
	}

	Peruna.prototype.initAllBlocks = function (html, opts) {
		var blocks = html.match(/<peruna[^]*?(?=<\/peruna>)<\/peruna>/g);

		if (!blocks) {
			return html;
		}

		for (var i = 0; i < blocks.length; i++) {
			html = this.initSingleBlock(html, opts, blocks[i]);
		}

		return html;
	}

	Peruna.prototype.initSingleBlock = function (html, opts, block) {
		var attrs = block.match(/\w*[\s\S]=["'][\s\S][^"]*["']/g);
		for (var j = 0; j < attrs.length; j++) {
			
			attrs[j] = attrs[j].replace(/"/g, '');
			var cmd = attrs[j].split(/\b=/)[0];
			var toEval = attrs[j].split(/\b=/)[1];

			switch (cmd) {
				case 'hide':
					var hide = this.hasBlockToBeHidden(toEval, opts);
					html = hide ? html.replace(block, '') : html;

					// stop execution if the element has to be hidden
					if (hide) {
						return html;
					}
					break;
				case 'loop':
					toEval = toEval.replace(/["']/g, '');
					var result = '';
					var elements = block.replace(/(<|<\/)peruna[^>]*>/g, '');

					if (!toEval.match(/\w* in \w*/)) {
						var times = -1;
						if (times = parseInt(toEval)) {
							for (var i = 0; i < times; i++) {
								var params = opts;
								params.index = i;
								result += this.initAllBinds(elements, params);
							}
						}
					} else {
						var varName = toEval.split(' in ')[0];
						var objName = toEval.split(' in ')[1];

						var obj = opts[objName] || {};

						for (var n in obj) {
							var params = {};
							params[varName] = obj[n];
							var val = this.initAllBinds(elements, params);
							result += val;
						}
					}

					html = html.replace(block, result);		
					break;
			}
		}

		return html;
	}

	Peruna.prototype.hasBlockToBeHidden = function (param, opts) {
		if (param == 'true' || param == 'false') {
			return eval(param);
		} else {
			try {
				return opts[param];
			} catch (e) {
				return true;
			}
		}
	}

	Peruna.prototype.initAllBinds = function (html, opts) {
		var matches = html.match(/\[\[[^\]]*]]/g);
		if (!matches) {
			return html;
		}

		for (var i = 0; i < matches.length; i++) {
			var val = matches[i].replace(/[\[\]\s]/g, '');
			html = html.replace(matches[i], eval('opts.' + val));
		}

		return html;
	}

	Peruna.prototype.removeComments = function (html) {
		return html.replace(/<!--[^]*?(?=\-->)-->/g, '');
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