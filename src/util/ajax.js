(function(app){
    const ajax = app.namespace('util.ajax');
    
    // Basic non function
    ajax.noop = function noop() {};
    
    /**
     * @preserve jquery-param (c) 2015 KNOWLEDGECODE | MIT
     * https://github.com/knowledgecode/jquery-param/blob/master/jquery-param.js
     */
    // jQuery like param util
    // Fix Date object handling to return ISO String 
    ajax.param = function param (a) {
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

    ajax.formData = function formData(obj){
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

    // JSONP with Promise return
    ajax.jsonp = function jsonp(url, options) {
        options = options || {};
    
        const id = options.callbackFn || app.namespace('util.random').randomFnName();
        const callback = options.callbackParam || 'callback';
        const timeout = options.timeout ? options.timeout : 15000;
        const target = document.getElementsByTagName('script')[0] || document.head;
        const data = options.data || {};
        const Promise = app.namespace('util').promise;
        let script;
        let timer;
        let cleanup;
        let cancel;
        let promise;
    
        cleanup = function() {
            // Remove the script tag.
            if (script && script.parentNode) {
                script.parentNode.removeChild(script);
            }
    
            window[id] = ajax.noop;
    
            if (timer) {
                clearTimeout(timer);
            }
        };
        
        promise = new Promise(function(resolve, reject) {
            if (timeout) {
                timer = setTimeout(function() {
                    cleanup();
                    reject(new Error('Timeout'));
                }, timeout);
            }
    
            window[id] = function(data) {
                cleanup();
                resolve(data);
            };
    
            // Add querystring component
            url += (~url.indexOf('?') ? '&' : '?') + callback + '=' + encodeURIComponent(id) + (Object.keys(data).length !== 0 ? ajax.param(data) : '') ;
            url = url.replace('?&', '?');
    
            // Create script.
            script = document.createElement('script');
            script.src = url;
            //Fix for cache issue
            setTimeout(function(){target.parentNode.insertBefore(script, target);},1);
        
            cancel = function() {
                if (window[id]) {
                    cleanup();
                    reject(new Error('Canceled'));
                }
            };
    
        });
    
        return {
            promise: promise,
            cancel: cancel
        };
    };

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

    const ParseHeaders = function parseHeaders (headers) {
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

    //Based on 
    /*
    * Copyright 2015 Scott Brady
    * MIT License
    * https://github.com/scottbrady/xhr-promise/blob/master/LICENSE
    */
    // Extended to fix JSON POST and add return parsing options
    
    ajax.request = (function() {
        function XMLHttpRequestPromise() {}
      
        XMLHttpRequestPromise.DEFAULT_CONTENT_TYPE = 'application/x-www-form-urlencoded; charset=UTF-8';

        XMLHttpRequestPromise.DEFAULTS = {
            method: 'GET',
            data: null,
            headers: {},
            async: true,
            username: null,
            password: null,
            withCredentials: false,
            returnType: 'auto',
            sendAsFormData : false,
        };

        XMLHttpRequestPromise.URL_METHODS = [
            // Method that must encode URL data
            'GET',
            'HEAD',
            'OPTIONS',
        ];
        XMLHttpRequestPromise.FORM_METHOS = [
            // Methods that must encode as formData or string value
            'POST',
            'PUT',
            'DELETE',
            'PATCH'
        ];
        
        // Unsupported values
        // 'CONNECT'
        // 'TRACE'
        XMLHttpRequestPromise.VALID_METHODS = XMLHttpRequestPromise.URL_METHODS.concat(XMLHttpRequestPromise.FORM_METHOS);
      
      
        /*
         * XMLHttpRequestPromise.send(options) -> Promise
         * - options (Object): URL, method, data, etc.
         *
         * Create the XHR object and wire up event handlers to use a promise.
         */
             
        XMLHttpRequestPromise.prototype.send = function(options) {
            // Inject localize Promise function
            const Promise = app.namespace('util').promise;
            options = Object.assign({}, XMLHttpRequestPromise.DEFAULTS, options);
            return new Promise((function(_this) {
                return function(resolve, reject) {
                var e, header, ref, value, xhr;
                _this._xhr = xhr = new XMLHttpRequest;
                _this.options = options;
                if (!XMLHttpRequest) {
                    _this._handleError('browser', reject, null, "browser doesn't support XMLHttpRequest");
                    return;
                }
                if (typeof options.url !== 'string' || options.url.length === 0) {
                    _this._handleError('url', reject, null, 'URL is a required parameter');
                    return;
                }
                // Add error handling for invalid methods
                if (XMLHttpRequestPromise.VALID_METHODS.indexOf(options.method) < 0 ) {
                    _this._handleError('method', reject, null, 'Method ' + options.method +' is an invalid method.');
                    return;
                }
                // Move to fix order error
                //_this._xhr = xhr = new XMLHttpRequest;
                xhr.onload = function() {
                    // Change to response, keeping responseText value
                    var response;
                    _this._detachWindowUnload();
                    try {
                        response = _this._getResponseData();
                    } catch (_error) {
                        _this._handleError('parse', reject, null, 'invalid response');
                        return;
                    }
                    return resolve({
                        url: _this._getResponseUrl(),
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseText: xhr.responseText,
                        response : response,
                        headers: _this._getHeaders(),
                        xhr: xhr
                    });
                };
                xhr.onerror = function() {
                    return _this._handleError('error', reject);
                };
                xhr.ontimeout = function() {
                    return _this._handleError('timeout', reject);
                };
                xhr.onabort = function() {
                    return _this._handleError('abort', reject);
                };
                _this._attachWindowUnload();
                // MUTATE URL if URL Method
                if(_this.constructor.URL_METHODS.indexOf(options.method) > -1 && (options.data != null)){
                    options.url += (~options.url.indexOf('?') ? '&' : '?') + (Object.keys(options.data).length !== 0 ? ajax.param(options.data) : '') ;
                    options.url = options.url.replace('?&', '?');
                }
                xhr.open(options.method, options.url, options.async, options.username, options.password);
                if (options.withCredentials) {
                    xhr.withCredentials = true;
                }
                if ((options.data != null) && !options.headers['Content-Type'] && !options.sendAsFormData) {
                    options.headers['Content-Type'] = _this.constructor.DEFAULT_CONTENT_TYPE;
                }
                ref = options.headers;
                for (header in ref) {
                    value = ref[header];
                    xhr.setRequestHeader(header, value);
                }
                try {
                    // Be a bit smarter about data handling
                    //Special cases for JSON and XML
                    if(options.headers['Content-Type'] && 
                    ( options.headers['Content-Type'].indexOf('application/json') > -1 || options.headers['Content-Type'].indexOf('text/xml') > -1)
                    ){
                        if (options.headers['Content-Type'].indexOf('application/json') > -1 && typeof options.data === 'object') {
                            return xhr.send(JSON.stringify(options.data));
                        } else if (options.headers['Content-Type'].indexOf('text/xml') > -1 && typeof options.data === 'object') {
                            return xhr.send((new XMLSerializer).serializeToString(options.data));
                        }
                    } 
                    // FormData send
                    else if ((options.data != null) && options.sendAsFormData && !options.headers['Content-Type']) {
                        return xhr.send(ajax.formData(options.data));
                    } 
                    // One of the standard form methods
                    else if(_this.constructor.FORM_METHOS.indexOf(options.method) > -1){
                        // Do special if urlendcoded
                        if(options.headers['Content-Type'].indexOf('application/x-www-form-urlencoded')) {
                            return xhr.send(ajax.param(options.data));
                        } 
                        // Otherwise use native string method
                        else {
                            return xhr.send(options.data);
                        }
                    } 
                    // Should be one of the URL methods remove data from body
                    else {
                        return xhr.send();
                    }
                    
                } catch (_error) {
                    e = _error;
                    return _this._handleError('send', reject, null, e.toString());
                }
                };
            })(this));
        };
      
      
        /*
         * XMLHttpRequestPromise.getXHR() -> XMLHttpRequest
         */
      
        XMLHttpRequestPromise.prototype.getXHR = function() {
          return this._xhr;
        };
      
      
        /*
         * XMLHttpRequestPromise._attachWindowUnload()
         *
         * Fix for IE 9 and IE 10
         * Internet Explorer freezes when you close a webpage during an XHR request
         * https://support.microsoft.com/kb/2856746
         *
         */
      
        XMLHttpRequestPromise.prototype._attachWindowUnload = function() {
          this._unloadHandler = this._handleWindowUnload.bind(this);
          if (window.attachEvent) {
            return window.attachEvent('onunload', this._unloadHandler);
          }
        };
      
      
        /*
         * XMLHttpRequestPromise._detachWindowUnload()
         */
      
        XMLHttpRequestPromise.prototype._detachWindowUnload = function() {
          if (window.detachEvent) {
            return window.detachEvent('onunload', this._unloadHandler);
          }
        };
      
      
        /*
         * XMLHttpRequestPromise._getHeaders() -> Object
         */
      
        XMLHttpRequestPromise.prototype._getHeaders = function() {
          return ParseHeaders(this._xhr.getAllResponseHeaders());
        };
      
      
        /*
         * XMLHttpRequestPromise._getResponseData() -> Mixed
         *
         * Parses response text JSON if present.
         */
        // Extend add return type fixes
        XMLHttpRequestPromise.prototype._getResponseData = function() {
            let response;
            response = typeof this._xhr.responseText === 'string' ? this._xhr.responseText : '';
            let responseContentType = (this._xhr.getResponseHeader('Content-Type') || '').split(';')[0];
            let parser = new DOMParser();
            if(this.options.returnType === 'auto') {
                if( responseContentType.indexOf('application/json') > -1) {
                    response = JSON.parse(response + '');
                } else if(responseContentType.indexOf('text/xml') > -1) {
                    response = parser.parseFromString(response + '',"text/xml");
                }
            } else if(this.options.returnType.toLowerCase() === 'json') {
                response = JSON.parse(response + '');
            } else if(this.options.returnType.toLowerCase() === 'xml') {
                response = parser.parseFromString(response + '',"text/xml");
            }
            return response;
        };
      
      
        /*
         * XMLHttpRequestPromise._getResponseUrl() -> String
         *
         * Actual response URL after following redirects.
         */
      
        XMLHttpRequestPromise.prototype._getResponseUrl = function() {
          if (this._xhr.responseURL != null) {
            return this._xhr.responseURL;
          }
          if (/^X-Request-URL:/m.test(this._xhr.getAllResponseHeaders())) {
            return this._xhr.getResponseHeader('X-Request-URL');
          }
          return '';
        };
      
      
        /*
         * XMLHttpRequestPromise._handleError(reason, reject, status, statusText)
         * - reason (String)
         * - reject (Function)
         * - status (String)
         * - statusText (String)
         */
      
        XMLHttpRequestPromise.prototype._handleError = function(reason, reject, status, statusText) {
          this._detachWindowUnload();
          return reject({
            reason: reason,
            status: status || this._xhr.status,
            statusText: statusText || this._xhr.statusText,
            xhr: this._xhr
          });
        };
      
      
        /*
         * XMLHttpRequestPromise._handleWindowUnload()
         */
      
        XMLHttpRequestPromise.prototype._handleWindowUnload = function() {
          return this._xhr.abort();
        };
      
        return XMLHttpRequestPromise;
      
      })();

    ajax.get = function(options) {
        return (new ajax.request()).send(Object.assign({},options, {"method": "GET"}));
    }

    ajax.post = function(options) {
        return (new ajax.request()).send(Object.assign({},options, {"method": "POST"}));
    }

})(emory);