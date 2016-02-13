var Document = require('./document');
var Element = require('./element');

exports = module.exports = (function () {
	function DomParser () {

	}

	DomParser.prototype.parse = function (html) {
		var document = new Document(html);
		document.getElementById('kissa');
		return document;
	}

	return new DomParser();
}).call(this);