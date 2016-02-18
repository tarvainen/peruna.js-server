exports = module.exports = (function () {
	
	function Logger () {
		this.debug = true;
	}

	Logger.prototype.log = function (data) {
		if (this.debug) {
			console.log('[peruna]' + data);
		}
	}

	Logger.prototype.err = function (data) {
		console.log('\x1b[31m', '[peruna]' + data);
		console.log('\x1b[30m');
	}

	return new Logger();
}).call(this);