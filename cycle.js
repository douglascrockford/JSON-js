/*
    cycle.js
    2021-05-31

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    This code should be minified before deployment.
    See https://www.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

// The file uses the WeakMap feature of ES6.

/*property
    decycle, forEach, get, indexOf, isArray, keys, length, push,
    retrocycle, set, stringify, test
*/

if (typeof JSON.decycle !== "function") {


    JSON.decycle = function decycle(object, replacer) {
        "use strict";

// Make a deep copy of an object or array, assuring that there is at most
// one instance of each object or array in the resulting structure. The
// duplicate references (which might be forming cycles) are replaced with
// an object of the form

//      {"\u{91}$": PATH}

// where the PATH is a JSON path array that locates the first occurance.

// So,

//      var a = [];
//      a[0] = a;
//      return JSON.stringify(JSON.decycle(a));

// produces the string '[{"\u{91}$":[]}]'.

// If a replacer function is provided, then it will be called for each value.
// A replacer function receives a value and returns a replacement value.

// JSONPath is used to locate the unique object. [] indicates the top level of
// the object or array. [NUMBER] or [STRING] indicates a child element or
// property.

// The marker is used to indicate that a value is a reference to an object.
// The chosen marker is unlikely to be used in normal JSON data.
        var marker = '\u{91}$';

        var objects = new WeakMap();     // object to path mappings

        return (function derez(value, path) {

// The derez function recurses through the object, producing the deep copy.

            var old_path;   // The path of an earlier occurance of value
            var nu;         // The new object or array

// If a replacer function was provided, then call it to get a replacement value.

            if (replacer !== undefined) {
                value = replacer(value);
            }

// typeof null === "object", so go on if this value is really an object but not
// one of the weird builtin objects.

            if (
                typeof value === "object"
                && value !== null
                && !(value instanceof Boolean)
                && !(value instanceof Date)
                && !(value instanceof Number)
                && !(value instanceof RegExp)
                && !(value instanceof String)
            ) {

// If the value is an object or array, look to see if we have already
// encountered it. If so, return a {"$ref":PATH} object. This uses an
// ES6 WeakMap.

                old_path = objects.get(value);
                if (old_path !== undefined) {
                    var obj = {};
                    obj[marker] = old_path;
                    return obj;
                }

// Otherwise, accumulate the unique value and its path.

                objects.set(value, path);

// If it is an array, replicate the array.

                if (Array.isArray(value)) {
                    nu = [];
                    value.forEach(function (element, i) {
                        nu[i] = derez(element, path.concat(i));
                    });
                } else {

// If it is an object, replicate the object.

                    nu = {};
                    Object.keys(value).forEach(function (name) {
                        nu[name] = derez(
                            value[name],
                            path.concat(name)
                        );
                    });
                }
                return nu;
            }
            return value;
        }(object, []));
    };
}


if (typeof JSON.retrocycle !== "function") {
    JSON.retrocycle = function retrocycle($) {
        "use strict";

// Restore an object that was reduced by decycle. Members whose values are
// objects of the form
//      {$ref: PATH}
// are replaced with references to the value found by the PATH. This will
// restore cycles. The object will be mutated.

// The dotwalk function is used to locate the values described by a PATH. The
// root object is kept in a $ variable. A PATH is an array of strings that
// are either property names or array indices and that are used to locate
// the target value.

// So,
//      var s = '[{"\u{91}$":[]}]';
//      return JSON.retrocycle(JSON.parse(s));
// produces an array containing a single element which is the array itself.

        var marker = '\u{91}$';

        function dotwalk(object, path) {

// The dotwalk function walks through the object using the path array.
// So, if the path is ["a", "b", 3], then it will return
// object.a.b[3].

            if (!path.length) return object;
            return dotwalk(object[path.shift()], path);
        }

        (function rez(value) {

// The rez function walks recursively through the object looking for marker 
// properties. When it finds one that has a value that is a path, then it
// replaces the object with a reference to the value that is found by
// the path.

            function processElement(parent, name, value) {
                if (typeof value === "object" && value !== null) {
                    var path = value[marker];
                    if (Array.isArray(path)) {
                        parent[name] = dotwalk($, path);
                    } else {
                        rez(value);
                    }
                }
            }

            if (value && typeof value === "object") {
                if (Array.isArray(value)) {
                    value.forEach(function (element, i) {
                        processElement(value, i, element);
                    });
                } else {
                    Object.keys(value).forEach(function (name) {
                        var item = value[name];
                        processElement(value, name, item);
                    });
                }
            }
        }($));
        return $;
    };
}
