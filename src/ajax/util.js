(function(app){
    const util = app.namespace('ajax.util');
    
    // Basic non function
    util.noop = function noop() {};
    
    /**
     * @preserve jquery-param (c) 2015 KNOWLEDGECODE | MIT
     * https://github.com/knowledgecode/jquery-param/blob/master/jquery-param.js
     */
    // jQuery like param util
    // Fix Date object handling to return ISO String 
    util.param = function param (a) {
        var s = [];
        var add = function (k, v) {
            v = typeof v === 'function' ? v() : v;
            v = v === null ? '' : v === undefined ? '' : v instanceof Date ? v.toISOString() : v;
            s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
        };
        var buildParams = function (prefix, obj) {
            var i, len, key;
            if (prefix) {
                if (Array.isArray(obj)) {
                    for (i = 0, len = obj.length; i < len; i++) {
                        buildParams(
                            prefix + '[' + (typeof obj[i] === 'object' && obj[i] ? i : '') + ']',
                            obj[i]
                        );
                    }
                } else if (String(obj) === '[object Object]') {
                    for (key in obj) {
                        buildParams(prefix + '[' + key + ']', obj[key]);
                    }
                } else {
                    add(prefix, obj);
                }
            } else if (Array.isArray(obj)) {
                for (i = 0, len = obj.length; i < len; i++) {
                    add(obj[i].name, obj[i].value);
                }
            } else {
                for (key in obj) {
                    buildParams(key, obj[key]);
                }
            }
            return s;
        };
        return buildParams('', a).join('&');
    };


    /**
     * Utility functio for creating formData from object
     * 
     */
    util.formData = function formData(obj){
        let returnFormData = new FormData();
        if(String(obj) === '[object Object]' && obj.hasOwnProperty){
            for(let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    let value = obj[key];
                    if(value === null || value === undefined){
                        returnFormData.append(key, '');
                    } else if (value instanceof Date) {
                        returnFormData.append(key, value.toISOString());
                    } else if (String(value) === '[object Object]'  || Array.isArray(value)){
                        returnFormData.append(key, JSON.stringify(value));
                    } else {
                        returnFormData.append(key, value);
                    }
                }
            }
        } else if (obj.tagName && obj.tagName.toLowerCase() == 'form') {
            returnFormData = new FormData(obj);
        }

        return returnFormData;
    }

    // praseHeaders function modified to use mondern javascript methods
    // Copyright (c) 2014 David Björklund

    // This software is released under the MIT license:

    // Permission is hereby granted, free of charge, to any person obtaining a copy
    // of this software and associated documentation files (the "Software"), to deal
    // in the Software without restriction, including without limitation the rights
    // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    // copies of the Software, and to permit persons to whom the Software is
    // furnished to do so, subject to the following conditions:

    // The above copyright notice and this permission notice shall be included in
    // all copies or substantial portions of the Software.

    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    // THE SOFTWARE.

    util.parseHeaders = function parseHeaders (headers) {
        if (!headers)
          return {}
      
        let result = {};
        
        headers.toString().trim().split('\n').forEach(
            function (row) {
                let index = row.indexOf(':')
                  , key = row.slice(0, index).trim().toLowerCase()
                  , value = row.slice(index + 1).trim()
        
                if (typeof(result[key]) === 'undefined') {
                  result[key] = value
                } else if (isArray(result[key])) {
                  result[key].push(value)
                } else {
                  result[key] = [ result[key], value ]
                }
              }
        );
        return result;
    };

})(emory);