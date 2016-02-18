var fs = require('fs');
var PerunaController = require('./peruna-controller.js');
var nf = require('./node-factory.js');
var urlParser = require('./url-parser.js');
var logger = require('./logger.js');
const EventEmitter = require('events');
const util = require('util');

exports = module.exports = (function () {
	
	function PerunaTemplate (viewPath, controllersPath, req) {
		this.__path = viewPath;
		this.controllersPath = controllersPath;
		this.controllers = {};
		this.debug = true;
		this.req = req;
	}

	util.inherits(PerunaTemplate, EventEmitter);

	PerunaTemplate.prototype.render = function (filename) {
		var that = this;
		var fp = Array(__dirname, that.__path, filename).join('/');
		fs.readFile(fp, 'utf-8', function (err, data) {
			if (err) {
				console.log(err);
				that.emit('error', err);
			} else {
				that.html = data;

				that.parse(function () {
					that.emit('ready', that.html);
				});
			}
		});		
	}

	PerunaTemplate.prototype.controller = function (controller, callback) {
		logger.log('Call to create controller ' + controller);
		this.controllers[controller] = new PerunaController();
		callback.call(this.controllers[controller], this.controllers[controller].scope);
		this.controllers[controller].emit('create');
	}

	PerunaTemplate.prototype.initControllers = function (callback) {
		logger.log('Initializing controllers.');
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

	PerunaTemplate.prototype.parse = function (callback) {
		logger.log('Parsing html.');
		var that = this;
		this.initControllers(function () {
			that.removeComments();

			// find the used controller
			var regex = /<%.*?(?=controller=)(.*?(?=["'])['"].*?(?=['"])["'])/;
			var ctrls = that.html.match(regex);
			
			if (!ctrls) {
				return callback();
			}


			var controller = ctrls[1];
			var cName = controller.replace(/['"]/g, '').split('=')[1];
			controller = that.controllers[cName] || {};
			that.controller = controller;

			that.initControllerEvents();

			if (that.req.body) {
				controller.emit(that.req.method.toLowerCase(), that.req.body);
				controller.emit('data', that.req.body);
			}

			var opts = controller.scope || opts;
			opts.request = that.req;
			that.opts = opts;

			that.initEmptyBlocks();
			that.removeEmptyBlocks();
			that.initAllBlocks();
			that.html = that.initAllBinds(that.html, that.opts);
			that.initHtmlBlocks();
			controller.emit('ready');
			callback();
		});
	}

	PerunaTemplate.prototype.initControllerEvents = function () {
		logger.log('Initializing controller events.');
		var that = this;
		this.controller.on('data', function (data) {
			data = data || {};

			var scope = that.controller.scope;
			if (data.onsubmit && typeof scope[data.onsubmit] == 'function') {
				var submitFunc = data.onsubmit;
				delete data.onsubmit;
				scope[submitFunc].call(that.controller, data);
			}

		});
	}

	PerunaTemplate.prototype.initEmptyBlocks = function () {
		var emptyBlocks = this.html.match(/<%[^>]*\%>/g);

		for (var i in emptyBlocks) {
			var newBlock = this.initAllBinds(emptyBlocks[i], this.opts);
			this.html = this.html.replace(emptyBlocks[i], newBlock);
			this.initSingleEmptyBlock(newBlock);
		}
	}

	PerunaTemplate.prototype.initSingleEmptyBlock = function (block) {
		var attrs = block.match(/\w*[\s\S]=["'][\s\S][^"]*["']/g);
		var result = '';

		for (var i in attrs) {
			result += this.initDirectiveAttribute(attrs[i]);
		}

		this.html = this.html.replace(block, result);
	}

	PerunaTemplate.prototype.initDirectiveAttribute = function (attr) {
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

	PerunaTemplate.prototype.includeFile = function (filename) {
		filename = filename || '';
		var fp = Array(__dirname, this.__path, filename).join('/');
		try {
			return fs.readFileSync(fp);
		} catch (e) {
			logger.err('Unable to read file ' + fp);
			return '';
		}
	}

	PerunaTemplate.prototype.removeEmptyBlocks = function () {
		this.html = this.html.replace(/<%[^>]*?(?=\/>)\/>/g, '');
	}

	PerunaTemplate.prototype.initAllBlocks = function (html, opts) {
		var blocks = this.html.match(/<%[^]*?(?=<\/%>)<\/%>/g);

		if (!blocks) {
			return;
		}

		for (var i = 0; i < blocks.length; i++) {
			this.initSingleBlock(blocks[i]);
		}
	}

	PerunaTemplate.prototype.initSingleBlock = function (block) {
		var attrs = block.match(/\w*[\s\S]=["'][\s\S][^"]*["']/g);
		for (var j = 0; j < attrs.length; j++) {
			
			attrs[j] = attrs[j].replace(/"/g, '');
			var cmd = attrs[j].split(/\b=/)[0];
			var toEval = attrs[j].split(/\b=/)[1];

			switch (cmd) {
				case 'hide':
					var hide = this.hasBlockToBeHidden(toEval);
					this.html = hide ? this.html.replace(block, '') : this.html;

					// stop execution if the element has to be hidden
					if (hide) {
						return;
					}
					break;
				case 'loop':
					toEval = toEval.replace(/["']/g, '');
					var result = '';
					var elements = block.replace(/(<|<\/)%[^>]*>/g, '');

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

					this.html = this.html.replace(block, result);		
					break;
			}
		}
	}

	PerunaTemplate.prototype.initHtmlBlocks = function () {
		var matches = this.html.match(/<(?!%)[^>]*>/g);

		for (var i = 0; i < matches.length; i++) {
			this.initSingleHtmlBlock(matches[i]);
		}
	}

	PerunaTemplate.prototype.initSingleHtmlBlock = function (block) {
		var attrs = block.match(/.*?(?=\=)*=["'][\s\S][^"]*["']/g) || [];
		var name = (block.match(/name=['"](.*?(?=["']))/) || '')[1];
		var value = (block.match(/value=['"](.*?(?=["']))/) || '')[1];
		for (var i = 0; i < attrs.length; i++) {
			var attr = attrs[i].replace(/["'\s()]/g, '').split('=');
			switch (attr[0]) {
				case 'p-click-server':
					if (this.opts.request.body[name]) {
						if (typeof this.opts[attr[1]] == 'function') {
							this.opts[attr[1]].call({
								name: name,
								value: value
							});
						}
					}
					break;
			}
		}
	}

	PerunaTemplate.prototype.hasBlockToBeHidden = function (param) {
		if (param == 'true' || param == 'false') {
			return param == 'true';
		} else {
			try {
				return this.opts[param];
			} catch (e) {
				return true;
			}
		}
	}

	PerunaTemplate.prototype.initAllBinds = function (html, opts) {
		html = html || '';
		var matches = html.match(/\[\[[^\]]*]]/g);
		if (!matches) {
			return html;
		}

		for (var i = 0; i < matches.length; i++) {
			var val = matches[i].replace(/[\[\]\s]/g, '');
			var elems = val.split('.');
			if (elems && elems.length > 0) {
				for (var j in elems) {
					elems[j] = '["' + elems[j] + '"]';
				}

				val = elems.join('');

				html = html.replace(matches[i], eval('opts' + val) || '');
			}
		}
		return html;
	}

	PerunaTemplate.prototype.removeComments = function () {
		this.html = this.html.replace(/<!--[^]*?(?=\-->)-->/g, '');
	}

	PerunaTemplate.prototype.escape = function (str) {
		return str.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}

	return PerunaTemplate;

}).call(this);