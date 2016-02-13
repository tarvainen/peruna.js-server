exports = module.exports = (function () {
	
	function Document (html) {
		this.html = html;
		this.elements = [];
	}

	Document.prototype.toString = function () {
		var result = '';
		for (var i = 0; i < this.elements.length; i++) {
			result += this.elements[i].toString();
		}

		return result;
	}

	Document.prototype.getElementById = function (id) {
		var matches = this.html.match(/<\w* id="kissa">([^<*]*)<\/\w*>/);
		console.log(matches);
		return matches;
	}

	return Document;

}).call(this);