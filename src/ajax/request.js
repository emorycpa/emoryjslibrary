(function(app){
    const ajax = app.namespace('ajax');
    const NSajaxUtils = 'ajax.util';
    const NSUtils = 'util';
    const NSRandomUtils = 'util.random';
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
            const Promise = app.namespace(NSUtils).promise;
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
                    options.url += (~options.url.indexOf('?') ? '&' : '?') + (Object.keys(options.data).length !== 0 ? app.namespace(NSajaxUtils).param(options.data) : '') ;
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
                        return xhr.send(app.namespace(NSajaxUtils).formData(options.data));
                    } 
                    // One of the standard form methods
                    else if(_this.constructor.FORM_METHOS.indexOf(options.method) > -1){
                        // Do special if urlendcoded
                        if(options.headers['Content-Type'].indexOf('application/x-www-form-urlencoded')) {
                            return xhr.send(app.namespace(NSajaxUtils).param(options.data));
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
          return app.namespace(NSajaxUtils).parseHeaders(this._xhr.getAllResponseHeaders());
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
            const responseContentType = (this._xhr.getResponseHeader('Content-Type') || '').split(';')[0];
            const parser = new DOMParser();
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