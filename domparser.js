var Document = require('./document');
var Element = require('./element');

exports = module.exports = (function () {
	function DomParser () {

	}

	DomParser.prototype.parse = function (html) {

		var document = new Document();

		var e = new Element();
		e.nodeName = 'p';
		document.elements.push(e);
		return document.toString();
	}

	return new DomParser();
}).call(this);