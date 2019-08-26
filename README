JSON in JavaScript


Douglas Crockford
douglas@crockford.com

2019-08-25


JSON is a light-weight, language independent, data interchange format.
See http://www.JSON.org/

JSON became a built-in feature of JavaScript when the ECMAScript Programming
Language Standard - Fifth Edition was adopted by the ECMA General Assembly
in December 2009.


json2.js: This file creates a JSON property in the global object, if there
isn't already one, setting its value to an object containing a stringify
method and a parse method. The parse method uses the eval method to do the
parsing, guarding it with several regular expressions to defend against
accidental code execution hazards. On current browsers, this file does nothing,
preferring the built-in JSON object. There is no reason to use this file unless
fate compels you to support IE8, which is something that no one should ever
have to do again.

cycle.js: This file contains two functions, JSON.decycle and JSON.retrocycle,
which make it possible to encode cyclical structures and dags in JSON, and to
then recover them. This is a capability that is not provided by ES5. JSONPath
is used to represent the links. [http://GOESSNER.net/articles/JsonPath/]
