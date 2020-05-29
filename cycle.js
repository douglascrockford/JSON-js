/*
    cycle.js
    2018-05-15

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

// The file uses the WeakMap feature of ES6.

/*jslint eval */

/*property
    $ref, decycle, forEach, get, indexOf, isArray, keys, length, push,
    retrocycle, set, stringify, test
*/

if (typeof JSON.decycle !== "function") {
    JSON.decycle = function decycle(object, replacer) {
        "use strict";

// Make a deep copy of an object or array, assuring that there is at most
// one instance of each object or array in the resulting structure. The
// duplicate references (which might be forming cycles) are replaced with
// an object of the form

//      {"$ref": PATH}

// where the PATH is a JSONPath string that locates the first occurance.

// So,

//      var a = [];
//      a[0] = a;
//      return JSON.stringify(JSON.decycle(a));

// produces the string '[{"$ref":"$"}]'.

// If a replacer function is provided, then it will be called for each value.
// A replacer function receives a value and returns a replacement value.

// JSONPath is used to locate the unique object. $ indicates the top level of
// the object or array. [NUMBER] or [STRING] indicates a child element or
// property.

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
                if(value&&value.constructor&&value.constructor.name){
                    var className=value.constructor.name;
                    
                    if((className!="Object")&&(className!="Boolean")&&(className!="Date")&&
                        (className!="Number")&&(className!="RegExp")&&(className!="String")&&
                        (className!="Set")&&(className!="Array")&&(className!="Map")){
                        value.$_constructorName=className;
                    }
                }

                old_path = objects.get(value);
                if (old_path !== undefined) {
                    return {$ref: old_path};
                }

// Otherwise, accumulate the unique value and its path.

                objects.set(value, path);

// If it is an array, replicate the array.

                if (Array.isArray(value)) {
                    nu = [];
                    value.forEach(function (element, i) {
                        nu[i] = derez(element, path + "[" + i + "]");
                    });
                } else {

// If it is an object, replicate the object.

                    nu = {};
                    Object.keys(value).forEach(function (name) {
                        nu[name] = derez(
                            value[name],
                            path + "[" + JSON.stringify(name) + "]"
                        );
                    });
                }
                return nu;
            }
            return value;
        }(object, "$"));
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

// The eval function is used to locate the values described by a PATH. The
// root object is kept in a $ variable. A regular expression is used to
// assure that the PATH is extremely well formed. The regexp contains nested
// * quantifiers. That has been known to have extremely bad performance
// problems on some browsers for very long strings. A PATH is expected to be
// reasonably short. A PATH is allowed to belong to a very restricted subset of
// Goessner's JSONPath.

// So,
//      var s = '[{"$ref":"$"}]';
//      return JSON.retrocycle(JSON.parse(s));
// produces an array containing a single element which is the array itself.

        var px = /^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\(?:[\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*")\])*$/;
        var evalList=[];

        (function rez(value) {

// The rez function walks recursively through the object looking for $ref
// properties. When it finds one that has a value that is a path, then it
// replaces the $ref object with a reference to the value that is found by
// the path.
            var className=value.$_constructorName;
            var newValue;
            if((className!=undefined)&&(className!="Object")&&(className!="Boolean")&&(className!="Date")&&
                (className!="Number")&&(className!="RegExp")&&(className!="String")&&
                (className!="Set")&&(className!="Array")&&(className!="Map")){
                try {
                    var newValue=new window[className]()
                    delete value.$_constructorName;
                    Object.keys(value).forEach(function (name) {
                        newValue[name]=value[name];
                    });
                } catch (e) {
                    console.log(e)
                }
            }
            
            if (value && typeof value === "object") {
                if (Array.isArray(value)) {
                    for (var i = 0; i < value.length; i++) {
                        var element=value[i];
                        var newElement
                        if(element){
                            var className=element.$_constructorName;
                            if((className!=undefined)&&(className!="Object")&&(className!="Boolean")&&(className!="Date")&&
                                (className!="Number")&&(className!="RegExp")&&(className!="String")&&
                                (className!="Set")&&(className!="Array")&&(className!="Map")){
                                try {
                                    newElement=new window[className]()
                                    delete element.$_constructorName;
                                    Object.keys(element).forEach(function (name) {
                                        newElement[name]=element[name];
                                    });
                                } catch (e) {
                                    console.log(e)
                                }
                            }
                        }
                        if (typeof element === "object" && element !== null) {
                            var path = element.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                try {
                                    evalList.push({value:value,name:i,path:path});
                                } catch (e) {
                                    console.log(e);
                                }
                            } else {
                                if(newElement){
                                    value[i]=rez(newElement);
                                }else{
                                    value[i]=rez(element);
                                }
                            }
                        }
                    }
                } else {
                    Object.keys(value).forEach(function (name) {
                        var code = value[name];
                        var newCode;
                        if(code){
                            var className=code.$_constructorName;
                            if((className!=undefined)&&(className!="Object")&&(className!="Boolean")&&(className!="Date")&&
                                (className!="Number")&&(className!="RegExp")&&(className!="String")&&
                                (className!="Set")&&(className!="Array")&&(className!="Map")){
                                try {
                                    newCode=new window[className]()
                                    delete code.$_constructorName;
                                    Object.keys(code).forEach(function (name) {
                                        newCode[name]=code[name];
                                    });
                                } catch (e) {
                                    console.log(e)
                                } 
                            }
                        }
                        if (typeof code === "object" && code !== null) {
                            var path = code.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                try {
                                    evalList.push({value:value,name:name,path:path});
                                    // value[name] = eval(path);
                                } catch (e) {
                                    console.log(e);
                                }
                            } else {
                                if(newCode){
                                    value[name]=rez(newCode);
                                }else{
                                    value[name]=rez(code);
                                }

                            }
                        }
                    });
                }
            }
            if(newValue){
                return newValue;
            }
            return value
        }($));
        evalList.forEach(function(e){
            e.value[e.name]=eval(e.path);
        })
        return $;
    };
}
