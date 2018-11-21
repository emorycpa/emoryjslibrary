(function(win){
    
    if(win.emory) throw "emory global object is reserved";
    
    // Namespace Utility From YUI 3 document updated for new use
    /**
    Utility method for safely creating namespaces if they don't already exist.
    May be called statically on the YUI global object or as a method on a YUI
    instance.
 
    Dots in the input string cause `namespace` to create nested objects for each
    token. If any part of the requested namespace already exists, the current
    object will be left in place and will not be overwritten. This allows
    multiple calls to `namespace` to preserve existing namespaced properties.
 
    If the first token in the namespace string is "emory", that token is
    discarded.
 
    Be careful with namespace tokens. Reserved words may work in some browsers
    and not others. For instance, the following will fail in some browsers
    because the supported version of JavaScript reserves the word "long":
 
        emory.namespace('really.long.nested.namespace');
 
    Note: If you pass multiple arguments to create multiple namespaces, only the
    last one created is returned from this function.
 
    @method namespace
    @param {String} namespace* One or more namespaces to create.
    @return {Object} Reference to the last namespace object created.
    **/
    // Define constants
    const PERIOD = '.';
    const namespaceFn = function namespace() {
        var a = arguments, o, i = 0, j, d, arg;

        for (; i < a.length; i++) {
            o = this; //Reset base object per argument or it will get reused from the last
            arg = a[i];
            if (arg.indexOf(PERIOD) > -1) { //Skip this if no "." is present
                d = arg.split(PERIOD);
                for (j = (d[0] == 'emory') ? 1 : 0; j < d.length; j++) {
                    o[d[j]] = o[d[j]] || {};
                    o = o[d[j]];
                }
            } else {
                o[arg] = o[arg] || {};
                o = o[arg]; //Reset base object to the new object so it's returned
            }
        }
        return o;
    }
    const app = function app(){
        return this;
    }

    // Setup prototype
    app.prototype.namespace = namespaceFn;
    app.prototype.app = app;
    
    //Create Global object;
    win.emory = new app();
    
})(window);
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
                    } else if (String(obj) === '[object Object]'  || Array.isArray(obj)){
                        returnFormData.append(key, JSON.stringify(obj));
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
    
            window[id] = app.noop;
    
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
            url += (~url.indexOf('?') ? '&' : '?') + callback + '=' + encodeURIComponent(id) + (Object.keys(data).length !== 0 ? app.param(data) : '') ;
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
                    options.url += (~options.url.indexOf('?') ? '&' : '?') + (Object.keys(options.data).length !== 0 ? app.param(options.data) : '') ;
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
                    if(options.headers['Content-Type'] 
                        && (options.headers['Content-Type'].indexOf('application/json') > -1)) {
                        return xhr.send(JSON.stringify(options.data));
                    } else if ((options.data != null) && options.sendAsFormData) {
                        return xhr.send(ajax.formData(options.data));
                    } else if(options.headers['Content-Type'].indexOf('application/x-www-form-urlencoded')) {
                        return xhr.send(ajax.param(options.data));
                    } else if (_this.constructor.FORM_METHOS.indexOf(options.method) > -1) {
                        return xhr.send(options.data);
                    } else {
                        // Should be one of the URL methods remove data from body
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
(function(app, win){
    const util = app.namespace('util');
    
    //Clone of Date function 
    const Date = win['Date'].bind({});
    Date.prototype = win['Date'].prototype;

    /**
     * Version: 1.0 Alpha-1 
     * Build Date: 13-Nov-2007
     * Copyright (c) 2006-2007, Coolite Inc. (http://www.coolite.com/). All rights reserved.
     * License: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/. 
     * Website: http://www.datejs.com/ or http://www.coolite.com/datejs/
     */
    /** Patched for generation of UUID using dates (ex Google's UUID for callbacks) */
    Date.CultureInfo = {
        name: "en-US",
        englishName: "English (United States)",
        nativeName: "English (United States)",
        dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        abbreviatedDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        shortestDayNames: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
        firstLetterDayNames: ["S", "M", "T", "W", "T", "F", "S"],
        monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        abbreviatedMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        amDesignator: "AM",
        pmDesignator: "PM",
        firstDayOfWeek: 0,
        twoDigitYearMax: 2029,
        dateElementOrder: "mdy",
        formatPatterns: {
            shortDate: "M/d/yyyy",
            longDate: "dddd, MMMM dd, yyyy",
            shortTime: "h:mm tt",
            longTime: "h:mm:ss tt",
            fullDateTime: "dddd, MMMM dd, yyyy h:mm:ss tt",
            sortableDateTime: "yyyy-MM-ddTHH:mm:ss",
            universalSortableDateTime: "yyyy-MM-dd HH:mm:ssZ",
            rfc1123: "ddd, dd MMM yyyy HH:mm:ss GMT",
            monthDay: "MMMM dd",
            yearMonth: "MMMM, yyyy"
        },
        regexPatterns: {
            jan: /^jan(uary)?/i,
            feb: /^feb(ruary)?/i,
            mar: /^mar(ch)?/i,
            apr: /^apr(il)?/i,
            may: /^may/i,
            jun: /^jun(e)?/i,
            jul: /^jul(y)?/i,
            aug: /^aug(ust)?/i,
            sep: /^sep(t(ember)?)?/i,
            oct: /^oct(ober)?/i,
            nov: /^nov(ember)?/i,
            dec: /^dec(ember)?/i,
            sun: /^su(n(day)?)?/i,
            mon: /^mo(n(day)?)?/i,
            tue: /^tu(e(s(day)?)?)?/i,
            wed: /^we(d(nesday)?)?/i,
            thu: /^th(u(r(s(day)?)?)?)?/i,
            fri: /^fr(i(day)?)?/i,
            sat: /^sa(t(urday)?)?/i,
            future: /^next/i,
            past: /^last|past|prev(ious)?/i,
            add: /^(\+|after|from)/i,
            subtract: /^(\-|before|ago)/i,
            yesterday: /^yesterday/i,
            today: /^t(oday)?/i,
            tomorrow: /^tomorrow/i,
            now: /^n(ow)?/i,
            millisecond: /^ms|milli(second)?s?/i,
            second: /^sec(ond)?s?/i,
            minute: /^min(ute)?s?/i,
            hour: /^h(ou)?rs?/i,
            week: /^w(ee)?k/i,
            month: /^m(o(nth)?s?)?/i,
            day: /^d(ays?)?/i,
            year: /^y((ea)?rs?)?/i,
            shortMeridian: /^(a|p)/i,
            longMeridian: /^(a\.?m?\.?|p\.?m?\.?)/i,
            timezone: /^((e(s|d)t|c(s|d)t|m(s|d)t|p(s|d)t)|((gmt)?\s*(\+|\-)\s*\d\d\d\d?)|gmt)/i,
            ordinalSuffix: /^\s*(st|nd|rd|th)/i,
            timeContext: /^\s*(\:|a|p)/i
        },
        abbreviatedTimeZoneStandard: {
            GMT: "-000",
            EST: "-0400",
            CST: "-0500",
            MST: "-0600",
            PST: "-0700"
        },
        abbreviatedTimeZoneDST: {
            GMT: "-000",
            EDT: "-0500",
            CDT: "-0600",
            MDT: "-0700",
            PDT: "-0800"
        }
    }; 
    Date.getMonthNumberFromName = function(t) {
        for (var e = Date.CultureInfo.monthNames, n = Date.CultureInfo.abbreviatedMonthNames, r = t.toLowerCase(), a = 0; a < e.length; a++)
            if (e[a].toLowerCase() == r || n[a].toLowerCase() == r) return a;
        return -1
    };
    Date.getDayNumberFromName = function(t) {
        for (var e = Date.CultureInfo.dayNames, n = Date.CultureInfo.abbreviatedDayNames, r = (Date.CultureInfo.shortestDayNames, t.toLowerCase()), a = 0; a < e.length; a++)
            if (e[a].toLowerCase() == r || n[a].toLowerCase() == r) return a;
        return -1
    }; Date.isLeapYear = function(t) {
        return t % 4 == 0 && t % 100 != 0 || t % 400 == 0
    }; Date.getDaysInMonth = function(t, e) {
        return [31, Date.isLeapYear(t) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][e]
    }; Date.getTimezoneOffset = function(t, e) {
        return e ? Date.CultureInfo.abbreviatedTimeZoneDST[t.toUpperCase()] : Date.CultureInfo.abbreviatedTimeZoneStandard[t.toUpperCase()]
    }; Date.getTimezoneAbbreviation = function(t, e) {
        var n, r = e ? Date.CultureInfo.abbreviatedTimeZoneDST : Date.CultureInfo.abbreviatedTimeZoneStandard;
        for (n in r)
            if (r[n] === t) return n;
        return null
    }; 
    Date.prototype.clone = function() {
        return new Date(this.getTime())
    }; Date.prototype.compareTo = function(t) {
        if (isNaN(this)) throw new Error(this);
        if (t instanceof Date && !isNaN(t)) return this > t ? 1 : this < t ? -1 : 0;
        throw new TypeError(t)
    }; Date.prototype.equals = function(t) {
        return 0 === this.compareTo(t)
    }; Date.prototype.between = function(t, e) {
        var n = this.getTime();
        return n >= t.getTime() && n <= e.getTime()
    }; Date.prototype.addMilliseconds = function(t) {
        return this.setMilliseconds(this.getMilliseconds() + t), this
    }; Date.prototype.addSeconds = function(t) {
        return this.addMilliseconds(1e3 * t)
    }; Date.prototype.addMinutes = function(t) {
        return this.addMilliseconds(6e4 * t)
    }; Date.prototype.addHours = function(t) {
        return this.addMilliseconds(36e5 * t)
    }; Date.prototype.addDays = function(t) {
        return this.addMilliseconds(864e5 * t)
    }; Date.prototype.addWeeks = function(t) {
        return this.addMilliseconds(6048e5 * t)
    }; Date.prototype.addMonths = function(t) {
        var e = this.getDate();
        return this.setDate(1), this.setMonth(this.getMonth() + t), this.setDate(Math.min(e, this.getDaysInMonth())), this
    }; Date.prototype.addYears = function(t) {
        return this.addMonths(12 * t)
    }; Date.prototype.add = function(t) {
        if ("number" == typeof t) return this._orient = t, this;
        var e = t;
        return (e.millisecond || e.milliseconds) && this.addMilliseconds(e.millisecond || e.milliseconds), (e.second || e.seconds) && this.addSeconds(e.second || e.seconds), (e.minute || e.minutes) && this.addMinutes(e.minute || e.minutes), (e.hour || e.hours) && this.addHours(e.hour || e.hours), (e.month || e.months) && this.addMonths(e.month || e.months), (e.year || e.years) && this.addYears(e.year || e.years), (e.day || e.days) && this.addDays(e.day || e.days), this
    }; Date._validate = function(t, e, n, r) {
        if ("number" != typeof t) throw new TypeError(t + " is not a Number.");
        if (t < e || t > n) throw new RangeError(t + " is not a valid value for " + r + ".");
        return !0
    }; Date.validateMillisecond = function(t) {
        return Date._validate(t, 0, 999, "milliseconds")
    }; Date.validateSecond = function(t) {
        return Date._validate(t, 0, 59, "seconds")
    }; Date.validateMinute = function(t) {
        return Date._validate(t, 0, 59, "minutes")
    }; Date.validateHour = function(t) {
        return Date._validate(t, 0, 23, "hours")
    }; Date.validateDay = function(t, e, n) {
        return Date._validate(t, 1, Date.getDaysInMonth(e, n), "days")
    }; Date.validateMonth = function(t) {
        return Date._validate(t, 0, 11, "months")
    }; Date.validateYear = function(t) {
        return Date._validate(t, 1, 9999, "seconds")
    }; Date.prototype.set = function(t) {
        var e = t;
        return e.millisecond || 0 === e.millisecond || (e.millisecond = -1), e.second || 0 === e.second || (e.second = -1), e.minute || 0 === e.minute || (e.minute = -1), e.hour || 0 === e.hour || (e.hour = -1), e.day || 0 === e.day || (e.day = -1), e.month || 0 === e.month || (e.month = -1), e.year || 0 === e.year || (e.year = -1), -1 != e.millisecond && Date.validateMillisecond(e.millisecond) && this.addMilliseconds(e.millisecond - this.getMilliseconds()), -1 != e.second && Date.validateSecond(e.second) && this.addSeconds(e.second - this.getSeconds()), -1 != e.minute && Date.validateMinute(e.minute) && this.addMinutes(e.minute - this.getMinutes()), -1 != e.hour && Date.validateHour(e.hour) && this.addHours(e.hour - this.getHours()), -1 !== e.month && Date.validateMonth(e.month) && this.addMonths(e.month - this.getMonth()), -1 != e.year && Date.validateYear(e.year) && this.addYears(e.year - this.getFullYear()), -1 != e.day && Date.validateDay(e.day, this.getFullYear(), this.getMonth()) && this.addDays(e.day - this.getDate()), e.timezone && this.setTimezone(e.timezone), e.timezoneOffset && this.setTimezoneOffset(e.timezoneOffset), this
    }; Date.prototype.clearTime = function() {
        return this.setHours(0), this.setMinutes(0), this.setSeconds(0), this.setMilliseconds(0), this
    }; Date.prototype.isLeapYear = function() {
        var t = this.getFullYear();
        return t % 4 == 0 && t % 100 != 0 || t % 400 == 0
    }; Date.prototype.isWeekday = function() {
        return !(this.is().sat() || this.is().sun())
    }; Date.prototype.getDaysInMonth = function() {
        return Date.getDaysInMonth(this.getFullYear(), this.getMonth())
    }; Date.prototype.moveToFirstDayOfMonth = function() {
        return this.set({
            day: 1
        })
    }; Date.prototype.moveToLastDayOfMonth = function() {
        return this.set({
            day: this.getDaysInMonth()
        })
    }; Date.prototype.moveToDayOfWeek = function(t, e) {
        var n = (t - this.getDay() + 7 * (e || 1)) % 7;
        return this.addDays(0 === n ? n += 7 * (e || 1) : n)
    }; Date.prototype.moveToMonth = function(t, e) {
        var n = (t - this.getMonth() + 12 * (e || 1)) % 12;
        return this.addMonths(0 === n ? n += 12 * (e || 1) : n)
    }; Date.prototype.getDayOfYear = function() {
        return Math.floor((this - new Date(this.getFullYear(), 0, 1)) / 864e5)
    }; Date.prototype.getWeekOfYear = function(t) {
        var e = this.getFullYear(),
            n = this.getMonth(),
            r = this.getDate(),
            a = t || Date.CultureInfo.firstDayOfWeek,
            o = 8 - new Date(e, 0, 1).getDay();
        8 == o && (o = 1);
        var i = (Date.UTC(e, n, r, 0, 0, 0) - Date.UTC(e, 0, 1, 0, 0, 0)) / 864e5 + 1,
            s = Math.floor((i - o + 7) / 7);
        if (s === a) {
            e--;
            var u = 8 - new Date(e, 0, 1).getDay();
            s = 2 == u || 8 == u ? 53 : 52
        }
        return s
    }; Date.prototype.isDST = function() {
        return console.log("isDST"), "D" == this.toString().match(/(E|C|M|P)(S|D)T/)[2]
    }; Date.prototype.getTimezone = function() {
        return Date.getTimezoneAbbreviation(this.getUTCOffset, this.isDST())
    }; Date.prototype.setTimezoneOffset = function(t) {
        var e = this.getTimezoneOffset(),
            n = -6 * Number(t) / 10;
        return this.addMinutes(n - e), this
    }; Date.prototype.setTimezone = function(t) {
        return this.setTimezoneOffset(Date.getTimezoneOffset(t))
    }; Date.prototype.getUTCOffset = function() {
        var t, e = -10 * this.getTimezoneOffset() / 6;
        return e < 0 ? (t = (e - 1e4).toString())[0] + t.substr(2) : "+" + (t = (e + 1e4).toString()).substr(1)
    }; Date.prototype.getDayName = function(t) {
        return t ? Date.CultureInfo.abbreviatedDayNames[this.getDay()] : Date.CultureInfo.dayNames[this.getDay()]
    }; Date.prototype.getMonthName = function(t) {
        return t ? Date.CultureInfo.abbreviatedMonthNames[this.getMonth()] : Date.CultureInfo.monthNames[this.getMonth()]
    }; Date.prototype._toString = Date.prototype.toString, Date.prototype.toString = function(t) {
        var e = this,
            n = function(t) {
                return 1 == t.toString().length ? "0" + t : t
            };
        return isNaN(t) || parseInt(Number(t)) != t || isNaN(parseInt(t, 10)) || 36 != parseInt(Number(t)) ? t && t.replace ? t.replace(/dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?/g, function(t) {
            switch (t) {
                case "hh":
                    return n(e.getHours() < 13 ? e.getHours() : e.getHours() - 12);
                case "h":
                    return e.getHours() < 13 ? e.getHours() : e.getHours() - 12;
                case "HH":
                    return n(e.getHours());
                case "H":
                    return e.getHours();
                case "mm":
                    return n(e.getMinutes());
                case "m":
                    return e.getMinutes();
                case "ss":
                    return n(e.getSeconds());
                case "s":
                    return e.getSeconds();
                case "yyyy":
                    return e.getFullYear();
                case "yy":
                    return e.getFullYear().toString().substring(2, 4);
                case "dddd":
                    return e.getDayName();
                case "ddd":
                    return e.getDayName(!0);
                case "dd":
                    return n(e.getDate());
                case "d":
                    return e.getDate().toString();
                case "MMMM":
                    return e.getMonthName();
                case "MMM":
                    return e.getMonthName(!0);
                case "MM":
                    return n(e.getMonth() + 1);
                case "M":
                    return e.getMonth() + 1;
                case "t":
                    return e.getHours() < 12 ? Date.CultureInfo.amDesignator.substring(0, 1) : Date.CultureInfo.pmDesignator.substring(0, 1);
                case "tt":
                    return e.getHours() < 12 ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator;
                case "zzz":
                case "zz":
                case "z":
                    return ""
            }
        }) : this._toString() : (+new Date).toString(t)
    }; Date.now = function() {
        return new Date
    }; Date.today = function() {
        return Date.now().clearTime()
    }; Date.prototype._orient = 1, Date.prototype.next = function() {
        return this._orient = 1, this
    }; Date.prototype.last = Date.prototype.prev = Date.prototype.previous = function() {
        return this._orient = -1, this
    }; Date.prototype._is = !1, Date.prototype.is = function() {
        return this._is = !0, this
    }, Number.prototype._dateElement = "day", Number.prototype.fromNow = function() {
        var t = {};
        return t[this._dateElement] = this, Date.now().add(t)
    }, Number.prototype.ago = function() {
        var t = {};
        return t[this._dateElement] = -1 * this, Date.now().add(t)
    },
    function() {
        for (var t, e = Date.prototype, n = Number.prototype, r = "sunday monday tuesday wednesday thursday friday saturday".split(/\s/), a = "january february march april may june july august september october november december".split(/\s/), o = "Millisecond Second Minute Hour Day Week Month Year".split(/\s/), i = function(t) {
                return function() {
                    return this._is ? (this._is = !1, this.getDay() == t) : this.moveToDayOfWeek(t, this._orient)
                }
            }, s = 0; s < r.length; s++) e[r[s]] = e[r[s].substring(0, 3)] = i(s);
        for (var u = function(t) {
                return function() {
                    return this._is ? (this._is = !1, this.getMonth() === t) : this.moveToMonth(t, this._orient)
                }
            }, h = 0; h < a.length; h++) e[a[h]] = e[a[h].substring(0, 3)] = u(h);
        for (var c = function(t) {
                return function() {
                    return "s" != t.substring(t.length - 1) && (t += "s"), this["add" + t](this._orient)
                }
            }, d = function(t) {
                return function() {
                    return this._dateElement = t, this
                }
            }, l = 0; l < o.length; l++) e[t = o[l].toLowerCase()] = e[t + "s"] = c(o[l]), n[t] = n[t + "s"] = d(t)
    }(), Date.prototype.toJSONString = function() {
        return this.toString("yyyy-MM-ddThh:mm:ssZ")
    }; Date.prototype.toShortDateString = function() {
        return this.toString(Date.CultureInfo.formatPatterns.shortDatePattern)
    }; Date.prototype.toLongDateString = function() {
        return this.toString(Date.CultureInfo.formatPatterns.longDatePattern)
    }; Date.prototype.toShortTimeString = function() {
        return this.toString(Date.CultureInfo.formatPatterns.shortTimePattern)
    }; Date.prototype.toLongTimeString = function() {
        return this.toString(Date.CultureInfo.formatPatterns.longTimePattern)
    }; Date.prototype.getOrdinal = function() {
        switch (this.getDate()) {
            case 1:
            case 21:
            case 31:
                return "st";
            case 2:
            case 22:
                return "nd";
            case 3:
            case 23:
                return "rd";
            default:
                return "th"
        }
    },
    function() {
        Date.Parsing = {
            Exception: function(t) {
                this.message = "Parse error at '" + t.substring(0, 10) + " ...'"
            }
        };
        for (var t = Date.Parsing, e = t.Operators = {
                rtoken: function(e) {
                    return function(n) {
                        var r = n.match(e);
                        if (r) return [r[0], n.substring(r[0].length)];
                        throw new t.Exception(n)
                    }
                },
                token: function(t) {
                    return function(t) {
                        return e.rtoken(new RegExp("^s*" + t + "s*"))(t)
                    }
                },
                stoken: function(t) {
                    return e.rtoken(new RegExp("^" + t))
                },
                until: function(t) {
                    return function(e) {
                        for (var n = [], r = null; e.length;) {
                            try {
                                r = t.call(this, e)
                            } catch (t) {
                                n.push(r[0]), e = r[1];
                                continue
                            }
                            break
                        }
                        return [n, e]
                    }
                },
                many: function(t) {
                    return function(e) {
                        for (var n = [], r = null; e.length;) {
                            try {
                                r = t.call(this, e)
                            } catch (t) {
                                return [n, e]
                            }
                            n.push(r[0]), e = r[1]
                        }
                        return [n, e]
                    }
                },
                optional: function(t) {
                    return function(e) {
                        var n = null;
                        try {
                            n = t.call(this, e)
                        } catch (t) {
                            return [null, e]
                        }
                        return [n[0], n[1]]
                    }
                },
                not: function(e) {
                    return function(n) {
                        try {
                            e.call(this, n)
                        } catch (t) {
                            return [null, n]
                        }
                        throw new t.Exception(n)
                    }
                },
                ignore: function(t) {
                    return t ? function(e) {
                        return [null, t.call(this, e)[1]]
                    } : null
                },
                product: function() {
                    for (var t = arguments[0], n = Array.prototype.slice.call(arguments, 1), r = [], a = 0; a < t.length; a++) r.push(e.each(t[a], n));
                    return r
                },
                cache: function(e) {
                    var n = {},
                        r = null;
                    return function(a) {
                        try {
                            r = n[a] = n[a] || e.call(this, a)
                        } catch (t) {
                            r = n[a] = t
                        }
                        if (r instanceof t.Exception) throw r;
                        return r
                    }
                },
                any: function() {
                    var e = arguments;
                    return function(n) {
                        for (var r = null, a = 0; a < e.length; a++)
                            if (null != e[a]) {
                                try {
                                    r = e[a].call(this, n)
                                } catch (t) {
                                    r = null
                                }
                                if (r) return r
                            } throw new t.Exception(n)
                    }
                },
                each: function() {
                    var e = arguments;
                    return function(n) {
                        for (var r = [], a = null, o = 0; o < e.length; o++)
                            if (null != e[o]) {
                                try {
                                    a = e[o].call(this, n)
                                } catch (e) {
                                    throw new t.Exception(n)
                                }
                                r.push(a[0]), n = a[1]
                            } return [r, n]
                    }
                },
                all: function() {
                    var t = arguments,
                        e = e;
                    return e.each(e.optional(t))
                },
                sequence: function(n, r, a) {
                    return r = r || e.rtoken(/^\s*/), a = a || null, 1 == n.length ? n[0] : function(e) {
                        for (var o = null, i = null, s = [], u = 0; u < n.length; u++) {
                            try {
                                o = n[u].call(this, e)
                            } catch (t) {
                                break
                            }
                            s.push(o[0]);
                            try {
                                i = r.call(this, o[1])
                            } catch (t) {
                                i = null;
                                break
                            }
                            e = i[1]
                        }
                        if (!o) throw new t.Exception(e);
                        if (i) throw new t.Exception(i[1]);
                        if (a) try {
                            o = a.call(this, o[1])
                        } catch (e) {
                            throw new t.Exception(o[1])
                        }
                        return [s, o ? o[1] : e]
                    }
                },
                between: function(t, n, a) {
                    a = a || t;
                    var o = e.each(e.ignore(t), n, e.ignore(a));
                    return function(t) {
                        var e = o.call(this, t);
                        return [
                            [e[0][0], r[0][2]], e[1]
                        ]
                    }
                },
                list: function(t, n, r) {
                    return n = n || e.rtoken(/^\s*/), r = r || null, t instanceof Array ? e.each(e.product(t.slice(0, -1), e.ignore(n)), t.slice(-1), e.ignore(r)) : e.each(e.many(e.each(t, e.ignore(n))), px, e.ignore(r))
                },
                set: function(n, r, a) {
                    return r = r || e.rtoken(/^\s*/), a = a || null,
                        function(o) {
                            for (var i = null, s = null, u = null, h = null, c = [
                                    [], o
                                ], d = !1, l = 0; l < n.length; l++) {
                                u = null, s = null, i = null, d = 1 == n.length;
                                try {
                                    i = n[l].call(this, o)
                                } catch (t) {
                                    continue
                                }
                                if (h = [
                                        [i[0]], i[1]
                                    ], i[1].length > 0 && !d) try {
                                    u = r.call(this, i[1])
                                } catch (t) {
                                    d = !0
                                } else d = !0;
                                if (d || 0 !== u[1].length || (d = !0), !d) {
                                    for (var y = [], f = 0; f < n.length; f++) l != f && y.push(n[f]);
                                    (s = e.set(y, r).call(this, u[1]))[0].length > 0 && (h[0] = h[0].concat(s[0]), h[1] = s[1])
                                }
                                if (h[1].length < c[1].length && (c = h), 0 === c[1].length) break
                            }
                            if (0 === c[0].length) return c;
                            if (a) {
                                try {
                                    u = a.call(this, c[1])
                                } catch (e) {
                                    throw new t.Exception(c[1])
                                }
                                c[1] = u[1]
                            }
                            return c
                        }
                },
                forward: function(t, e) {
                    return function(n) {
                        return t[e].call(this, n)
                    }
                },
                replace: function(t, e) {
                    return function(n) {
                        var r = t.call(this, n);
                        return [e, r[1]]
                    }
                },
                process: function(t, e) {
                    return function(n) {
                        var r = t.call(this, n);
                        return [e.call(this, r[0]), r[1]]
                    }
                },
                min: function(e, n) {
                    return function(r) {
                        var a = n.call(this, r);
                        if (a[0].length < e) throw new t.Exception(r);
                        return a
                    }
                }
            }, n = function(t) {
                return function() {
                    var e = null,
                        n = [];
                    if (arguments.length > 1 ? e = Array.prototype.slice.call(arguments) : arguments[0] instanceof Array && (e = arguments[0]), !e) return t.apply(null, arguments);
                    for (var r = 0, a = e.shift(); r < a.length; r++) return e.unshift(a[r]), n.push(t.apply(null, e)), e.shift(), n
                }
            }, a = "optional not ignore cache".split(/\s/), o = 0; o < a.length; o++) e[a[o]] = n(e[a[o]]);
        for (var i = function(t) {
                return function() {
                    return arguments[0] instanceof Array ? t.apply(null, arguments[0]) : t.apply(null, arguments)
                }
            }, s = "each any all".split(/\s/), u = 0; u < s.length; u++) e[s[u]] = i(e[s[u]])
    }(),
    function() {
        var t = function(e) {
            for (var n = [], r = 0; r < e.length; r++) e[r] instanceof Array ? n = n.concat(t(e[r])) : e[r] && n.push(e[r]);
            return n
        };
        Date.Grammar = {}; Date.Translator = {
            hour: function(t) {
                return function() {
                    this.hour = Number(t)
                }
            },
            minute: function(t) {
                return function() {
                    this.minute = Number(t)
                }
            },
            second: function(t) {
                return function() {
                    this.second = Number(t)
                }
            },
            meridian: function(t) {
                return function() {
                    this.meridian = t.slice(0, 1).toLowerCase()
                }
            },
            timezone: function(t) {
                return function() {
                    var e = t.replace(/[^\d\+\-]/g, "");
                    e.length ? this.timezoneOffset = Number(e) : this.timezone = t.toLowerCase()
                }
            },
            day: function(t) {
                var e = t[0];
                return function() {
                    this.day = Number(e.match(/\d+/)[0])
                }
            },
            month: function(t) {
                return function() {
                    this.month = 3 == t.length ? Date.getMonthNumberFromName(t) : Number(t) - 1
                }
            },
            year: function(t) {
                return function() {
                    var e = Number(t);
                    this.year = t.length > 2 ? e : e + (e + 2e3 < Date.CultureInfo.twoDigitYearMax ? 2e3 : 1900)
                }
            },
            rday: function(t) {
                return function() {
                    switch (t) {
                        case "yesterday":
                            this.days = -1;
                            break;
                        case "tomorrow":
                            this.days = 1;
                            break;
                        case "today":
                            this.days = 0;
                            break;
                        case "now":
                            this.days = 0, this.now = !0
                    }
                }
            },
            finishExact: function(t) {
                t = t instanceof Array ? t : [t];
                var e = new Date;
                this.year = e.getFullYear(), this.month = e.getMonth(), this.day = 1, this.hour = 0, this.minute = 0, this.second = 0;
                for (var n = 0; n < t.length; n++) t[n] && t[n].call(this);
                if (this.hour = "p" == this.meridian && this.hour < 13 ? this.hour + 12 : this.hour, this.day > Date.getDaysInMonth(this.year, this.month)) throw new RangeError(this.day + " is not a valid value for days.");
                var r = new Date(this.year, this.month, this.day, this.hour, this.minute, this.second);
                return this.timezone ? r.set({
                    timezone: this.timezone
                }) : this.timezoneOffset && r.set({
                    timezoneOffset: this.timezoneOffset
                }), r
            },
            finish: function(e) {
                if (0 === (e = e instanceof Array ? t(e) : [e]).length) return null;
                for (var n = 0; n < e.length; n++) "function" == typeof e[n] && e[n].call(this);
                if (this.now) return new Date;
                var r, a, o, i = Date.today();
                return !(null == this.days && !this.orient && !this.operator) ? (o = "past" == this.orient || "subtract" == this.operator ? -1 : 1, this.weekday && (this.unit = "day", r = Date.getDayNumberFromName(this.weekday) - i.getDay(), a = 7, this.days = r ? (r + o * a) % a : o * a), this.month && (this.unit = "month", r = this.month - i.getMonth(), a = 12, this.months = r ? (r + o * a) % a : o * a, this.month = null), this.unit || (this.unit = "day"), null != this[this.unit + "s"] && null == this.operator || (this.value || (this.value = 1), "week" == this.unit && (this.unit = "day", this.value = 7 * this.value), this[this.unit + "s"] = this.value * o), i.add(this)) : (this.meridian && this.hour && (this.hour = this.hour < 13 && "p" == this.meridian ? this.hour + 12 : this.hour), this.weekday && !this.day && (this.day = i.addDays(Date.getDayNumberFromName(this.weekday) - i.getDay()).getDate()), this.month && !this.day && (this.day = 1), i.set(this))
            }
        };
        var e, n = Date.Parsing.Operators,
            r = Date.Grammar,
            a = Date.Translator;
        r.datePartDelimiter = n.rtoken(/^([\s\-\.\,\/\x27]+)/), r.timePartDelimiter = n.stoken(":"), r.whiteSpace = n.rtoken(/^\s*/), r.generalDelimiter = n.rtoken(/^(([\s\,]|at|on)+)/);
        var o = {};
        r.ctoken = function(t) {
            var e = o[t];
            if (!e) {
                for (var r = Date.CultureInfo.regexPatterns, a = t.split(/\s+/), i = [], s = 0; s < a.length; s++) i.push(n.replace(n.rtoken(r[a[s]]), a[s]));
                e = o[t] = n.any.apply(null, i)
            }
            return e
        }, r.ctoken2 = function(t) {
            return n.rtoken(Date.CultureInfo.regexPatterns[t])
        }, r.h = n.cache(n.process(n.rtoken(/^(0[0-9]|1[0-2]|[1-9])/), a.hour)), r.hh = n.cache(n.process(n.rtoken(/^(0[0-9]|1[0-2])/), a.hour)), r.H = n.cache(n.process(n.rtoken(/^([0-1][0-9]|2[0-3]|[0-9])/), a.hour)), r.HH = n.cache(n.process(n.rtoken(/^([0-1][0-9]|2[0-3])/), a.hour)), r.m = n.cache(n.process(n.rtoken(/^([0-5][0-9]|[0-9])/), a.minute)), r.mm = n.cache(n.process(n.rtoken(/^[0-5][0-9]/), a.minute)), r.s = n.cache(n.process(n.rtoken(/^([0-5][0-9]|[0-9])/), a.second)), r.ss = n.cache(n.process(n.rtoken(/^[0-5][0-9]/), a.second)), r.hms = n.cache(n.sequence([r.H, r.mm, r.ss], r.timePartDelimiter)), r.t = n.cache(n.process(r.ctoken2("shortMeridian"), a.meridian)), r.tt = n.cache(n.process(r.ctoken2("longMeridian"), a.meridian)), r.z = n.cache(n.process(n.rtoken(/^(\+|\-)?\s*\d\d\d\d?/), a.timezone)), r.zz = n.cache(n.process(n.rtoken(/^(\+|\-)\s*\d\d\d\d/), a.timezone)), r.zzz = n.cache(n.process(r.ctoken2("timezone"), a.timezone)), r.timeSuffix = n.each(n.ignore(r.whiteSpace), n.set([r.tt, r.zzz])), r.time = n.each(n.optional(n.ignore(n.stoken("T"))), r.hms, r.timeSuffix), r.d = n.cache(n.process(n.each(n.rtoken(/^([0-2]\d|3[0-1]|\d)/), n.optional(r.ctoken2("ordinalSuffix"))), a.day)), r.dd = n.cache(n.process(n.each(n.rtoken(/^([0-2]\d|3[0-1])/), n.optional(r.ctoken2("ordinalSuffix"))), a.day)), r.ddd = r.dddd = n.cache(n.process(r.ctoken("sun mon tue wed thu fri sat"), function(t) {
            return function() {
                this.weekday = t
            }
        })), r.M = n.cache(n.process(n.rtoken(/^(1[0-2]|0\d|\d)/), a.month)), r.MM = n.cache(n.process(n.rtoken(/^(1[0-2]|0\d)/), a.month)), r.MMM = r.MMMM = n.cache(n.process(r.ctoken("jan feb mar apr may jun jul aug sep oct nov dec"), a.month)), r.y = n.cache(n.process(n.rtoken(/^(\d\d?)/), a.year)), r.yy = n.cache(n.process(n.rtoken(/^(\d\d)/), a.year)), r.yyy = n.cache(n.process(n.rtoken(/^(\d\d?\d?\d?)/), a.year)), r.yyyy = n.cache(n.process(n.rtoken(/^(\d\d\d\d)/), a.year)), e = function() {
            return n.each(n.any.apply(null, arguments), n.not(r.ctoken2("timeContext")))
        }, r.day = e(r.d, r.dd), r.month = e(r.M, r.MMM), r.year = e(r.yyyy, r.yy), r.orientation = n.process(r.ctoken("past future"), function(t) {
            return function() {
                this.orient = t
            }
        }), r.operator = n.process(r.ctoken("add subtract"), function(t) {
            return function() {
                this.operator = t
            }
        }), r.rday = n.process(r.ctoken("yesterday tomorrow today now"), a.rday), r.unit = n.process(r.ctoken("minute hour day week month year"), function(t) {
            return function() {
                this.unit = t
            }
        }), r.value = n.process(n.rtoken(/^\d\d?(st|nd|rd|th)?/), function(t) {
            return function() {
                this.value = t.replace(/\D/g, "")
            }
        }), r.expression = n.set([r.rday, r.operator, r.value, r.unit, r.orientation, r.ddd, r.MMM]), e = function() {
            return n.set(arguments, r.datePartDelimiter)
        }, r.mdy = e(r.ddd, r.month, r.day, r.year), r.ymd = e(r.ddd, r.year, r.month, r.day), r.dmy = e(r.ddd, r.day, r.month, r.year), r.date = function(t) {
            return (r[Date.CultureInfo.dateElementOrder] || r.mdy).call(this, t)
        }, r.format = n.process(n.many(n.any(n.process(n.rtoken(/^(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?)/), function(t) {
            if (r[t]) return r[t];
            throw Date.Parsing.Exception(t)
        }), n.process(n.rtoken(/^[^dMyhHmstz]+/), function(t) {
            return n.ignore(n.stoken(t))
        }))), function(t) {
            return n.process(n.each.apply(null, t), a.finishExact)
        });
        var i = {},
            s = function(t) {
                return i[t] = i[t] || r.format(t)[0]
            };
        r.formats = function(t) {
            if (t instanceof Array) {
                for (var e = [], r = 0; r < t.length; r++) e.push(s(t[r]));
                return n.any.apply(null, e)
            }
            return s(t)
        }, r._formats = r.formats(["yyyy-MM-ddTHH:mm:ss", "ddd, MMM dd, yyyy H:mm:ss tt", "ddd MMM d yyyy HH:mm:ss zzz", "d"]), r._start = n.process(n.set([r.date, r.time, r.expression], r.generalDelimiter, r.whiteSpace), a.finish), r.start = function(t) {
            try {
                var e = r._formats.call({}, t);
                if (0 === e[1].length) return e
            } catch (t) {}
            return r._start.call({}, t)
        }
    }(), Date._parse = Date.parse, Date.parse = function(t) {
        var e = null;
        if (!t) return null;
        try {
            e = Date.Grammar.start.call({}, t)
        } catch (t) {
            return null
        }
        return 0 === e[1].length ? e[0] : null
    }; Date.getParseFunction = function(t) {
        var e = Date.Grammar.formats(t);
        return function(t) {
            var n = null;
            try {
                n = e.call({}, t)
            } catch (t) {
                return null
            }
            return 0 === n[1].length ? n[0] : null
        }
    }; Date.parseExact = function(t, e) {
        return Date.getParseFunction(e)(t)
    };

    util.date = Date;
})(emory, window);
(function(app){
    const util = app.namespace('util');

    // eventEmitter
    /**
     * EvEmitter v1.1.0
     * Lil' event emitter
     * MIT License
     */

    const EvEmitter = function EvEmitter() {};
        
    const proto = EvEmitter.prototype;
        
    proto.on = function( eventName, listener ) {
        if ( !eventName || !listener ) {
        return;
        }
        // set events hash
        var events = this._events = this._events || {};
        // set listeners array
        var listeners = events[ eventName ] = events[ eventName ] || [];
        // only add once
        if ( listeners.indexOf( listener ) == -1 ) {
        listeners.push( listener );
        }
    
        return this;
    };
    
    proto.once = function( eventName, listener ) {
        if ( !eventName || !listener ) {
        return;
        }
        // add event
        this.on( eventName, listener );
        // set once flag
        // set onceEvents hash
        var onceEvents = this._onceEvents = this._onceEvents || {};
        // set onceListeners object
        var onceListeners = onceEvents[ eventName ] = onceEvents[ eventName ] || {};
        // set flag
        onceListeners[ listener ] = true;
    
        return this;
    };
    
    proto.off = function( eventName, listener ) {
        var listeners = this._events && this._events[ eventName ];
        if ( !listeners || !listeners.length ) {
        return;
        }
        var index = listeners.indexOf( listener );
        if ( index != -1 ) {
        listeners.splice( index, 1 );
        }
    
        return this;
    };
    
    proto.emitEvent = function( eventName, args ) {
        var listeners = this._events && this._events[ eventName ];
        if ( !listeners || !listeners.length ) {
        return;
        }
        // copy over to avoid interference if .off() in listener
        listeners = listeners.slice(0);
        args = args || [];
        // once stuff
        var onceListeners = this._onceEvents && this._onceEvents[ eventName ];
    
        for ( var i=0; i < listeners.length; i++ ) {
        var listener = listeners[i]
        var isOnce = onceListeners && onceListeners[ listener ];
        if ( isOnce ) {
            // remove listener
            // remove before trigger to prevent recursion
            this.off( eventName, listener );
            // unset once flag
            delete onceListeners[ listener ];
        }
        // trigger listener
        listener.apply( this, args );
        }
    
        return this;
    };
    
    proto.allOff = function() {
        delete this._events;
        delete this._onceEvents;
    };
        
    util.eventEmitter = EvEmitter;

})(emory);
(function(app){
    const templateUtil = app.namespace('util.template');

    // Copyright (C) 2009 Andy Chu
    //
    // Licensed under the Apache License, Version 2.0 (the "License");
    // you may not use this file except in compliance with the License.
    // You may obtain a copy of the License at
    //
    //      http://www.apache.org/licenses/LICENSE-2.0
    //
    // Unless required by applicable law or agreed to in writing, software
    // distributed under the License is distributed on an "AS IS" BASIS,
    // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    // See the License for the specific language governing permissions and
    // limitations under the License.

    //
    // JavaScript implementation of json-template.
    const log = console.log||function(){};
    const repr = function(obj){
        return JSON.stringify(obj, undefined, 2);
    }
    const jsontemplate = function(){function e(e){return e.replace(/([\{\}\(\)\[\]\|\^\$\-\+\?])/g,"\\$1")}var t={};function n(e){return e.replace(/&/g,"&amp;").replace(/>/g,"&gt;").replace(/</g,"&lt;")}function r(e){return e.replace(/&/g,"&amp;").replace(/>/g,"&gt;").replace(/</g,"&lt;").replace(/"/g,"&quot;")}function a(e,t,n){var r,a;switch(n.length){case 0:r="",a="s";break;case 1:r="",a=n[0];break;case 2:r=n[0],a=n[1];break;default:throw{name:"EvaluationError",message:"pluralize got too many args"}}return e>1?a:r}function i(e,t,n){return n[(e-1)%n.length]}var o={html:n,htmltag:r,"html-attr-value":r,str:function(e){return null===e?"null":e.toString()},raw:function(e){return e},AbsUrl:function(e,t){return t.get("base-url")+"/"+e},"plain-url":function(e){return'<a href="'+r(e)+'">'+n(e)+"</a>"}},u=function(e,t,n){var r=n[0];if(void 0===r)throw{name:"EvaluationError",message:'The "test" predicate requires an argument.'};try{return t.get(r)}catch(e){if("UndefinedVariable"==e.name)return!1;throw e}},l=function(e){return 1==e},s=function(e){return e>1},c={singular:l,plural:s,"singular?":l,"plural?":s,"Debug?":function(e,t){return u(e,t,["debug"])}},f=function(){return{lookup:function(e){return[null,null]}}},p=function(e){return{lookup:function(t){return[e[t]||null,null]}}},m=function(e){return{lookup:function(t){return[e(t),null]}}},h=function(e){return{lookup:function(t){for(var n=0;n<e.length;n++){var r=e[n].name,a=e[n].func;if(t.slice(0,r.length)==r){var i=t.charAt(r.length);return[a,""===i?[]:t.split(i).slice(1)]}}return[null,null]}}},g=function(e){return{lookup:function(t){for(var n=0;n<e.length;n++){var r=e[n].lookup(t);if(r[0])return r}return[null,null]}}};var d=function(e){var t={current_clause:[],Append:function(e){t.current_clause.push(e)},AlternatesWith:function(){throw{name:"TemplateSyntaxError",message:"{.alternates with} can only appear with in {.repeated section ...}"}},NewOrClause:function(e){throw{name:"NotImplemented"}}};return t},v=function(e){var t=d();return t.statements={default:t.current_clause},t.section_name=e.section_name,t.Statements=function(e){return e=e||"default",t.statements[e]||[]},t.NewOrClause=function(e){if(e)throw{name:"TemplateSyntaxError",message:"{.or} clause only takes a predicate inside predicate blocks"};t.current_clause=[],t.statements.or=t.current_clause},t},x=function(e){var t=v(e);return t.AlternatesWith=function(){t.current_clause=[],t.statements.alternate=t.current_clause},t},w=function(e){var t=d();return t.clauses=[],t.NewOrClause=function(e){e=e||[function(e){return!0},null],t.current_clause=[],t.clauses.push([e,t.current_clause])},t};function _(e,t,n){for(var r=0;r<e.length;r++){var a=e[r];if("string"==typeof a)n(a);else(0,a[0])(a[1],t,n)}}function b(e,t,n){var r=t.get(e.name);if(void 0===r)throw{name:"UndefinedVariable",message:e.name+" is not defined"};for(var a=0;a<e.formatters.length;a++){var i=e.formatters[a];r=(0,i[0])(r,t,i[1])}n(r)}function k(e,t,n){var r=e,a=t.pushName(r.section_name),i=!1;a&&(i=!0),a&&0===a.length&&(i=!1),i?(_(r.Statements(),t,n),t.pop()):(t.pop(),_(r.Statements("or"),t,n))}function y(e,t,n){for(var r=e,a=t.get("@"),i=0;i<r.clauses.length;i++){var o=r.clauses[i],u=o[0][0],l=o[0][1],s=o[1];if(u(a,t,l)){_(s,t,n);break}}}function S(e,t,n){var r=e,a=t.pushName(r.section_name);if(a&&a.length>0)for(var i=a.length-1,o=r.Statements(),u=r.Statements("alternate"),l=0;void 0!==t.next();l++)_(o,t,n),l!=i&&_(u,t,n);else _(r.Statements("or"),t,n);t.pop()}var A=/(repeated)?\s*(section)\s+(\S+)?/,E=/^or(?:\s+(.+))?/,C=/^if(?:\s+(.+))?/;function N(e){return e?"function"==typeof e?new m(e):void 0!==e.lookup?e:"object"==typeof e?new p(e):void 0:new f}function U(n,r){var l,s=N(r.more_formatters),f=h([{name:"pluralize",func:a},{name:"cycle",func:i}]),m=new g([s,p(o),f]),d=N(r.more_predicates),_=h([{name:"test",func:u}]),U=new g([d,p(c),_]);function T(e){var t=m.lookup(e);if(!t[0])throw{name:"BadFormatter",message:e+" is not a valid formatter"};return t}function O(e,t){var n=U.lookup(e);if(!n[0]){if(!t)throw{name:"BadPredicate",message:e+" is not a valid predicate"};n=[u,[e.slice(null,-1)]]}return n}l=void 0===r.default_formatter?"str":r.default_formatter;var R=r.format_char||"|";if(":"!=R&&"|"!=R)throw{name:"ConfigurationError",message:"Only format characters : and | are accepted"};var j=r.meta||"{}",L=j.length;if(L%2==1)throw{name:"ConfigurationError",message:j+" has an odd number of metacharacters"};for(var q,z=j.substring(0,L/2),F=j.substring(L/2,L),W=function(n,r){var a=t[n+r];if(void 0===a){var i="("+e(n)+"\\S.*?"+e(r)+"\n?)";a=new RegExp(i,"g")}return a}(z,F),$=v({}),B=[$],G=z.length,H=0;;){var I;if(null===(q=W.exec(n)))break;if(I=q[0],q.index>H){var V=n.slice(H,q.index);$.Append(V)}H=W.lastIndex;var D=!1;if("\n"==I.slice(-1)&&(I=I.slice(null,-1),D=!0),"#"!=(I=I.slice(G,-G)).charAt(0)){if("."==I.charAt(0)){var M,P,Z={"meta-left":z,"meta-right":F,space:" ",tab:"\t",newline:"\n"}[I=I.substring(1,I.length)];if(void 0!==Z){$.Append(Z);continue}var J,K,Q=I.match(A);if(Q){var X=Q[1],Y=Q[3];X?(P=S,M=x({section_name:Y})):(P=k,M=v({section_name:Y})),$.Append([P,M]),B.push(M),$=M;continue}var ee=I.match(E);if(ee){K=(J=ee[1])?O(J,!1):null,$.NewOrClause(K);continue}var te=!1,ne=!1;if(I.match(C))J=I,te=!0;else{var re=I.split("?")[1]?I.split("?")[1][0]:" ",ae=I.split(re).shift();"?"!=I.charAt(I.length-1)&&"?"!=ae.charAt(ae.length-1)||(J=I,ne=!0)}if(te||ne){K=J?O(J,ne):null,(M=w()).NewOrClause(K),$.Append([y,M]),B.push(M),$=M;continue}if("alternates with"==I){$.AlternatesWith();continue}if("end"==I){if(B.pop(),!(B.length>0))throw{name:"TemplateSyntaxError",message:"Got too many {end} statements"};$=B[B.length-1];continue}}var ie,oe,ue=I.split(R);if(1==ue.length){if(null===l)throw{name:"MissingFormatter",message:"This template requires explicit formatters."};ie=[T(l)],oe=I}else{ie=[];for(var le=1;le<ue.length;le++)ie.push(T(ue[le]));oe=ue[0]}$.Append([b,{name:oe,formatters:ie}]),D&&$.Append("\n")}}if($.Append(n.slice(H)),1!==B.length)throw{name:"TemplateSyntaxError",message:"Got too few {end} statements"};return $}function T(e,t){if(!(this instanceof T))return new T(e,t);this._options=t||{},this._program=U(e,this._options)}T.prototype.render=function(e,t){var n,r,a;"function"!=typeof e.get&&(n=e,r=this._options.undefined_str,a=[{context:n,index:-1}],e={pushName:function(e){if(null==e)return null;var t,n=e.split(".");if("@"==e)t=a[a.length-1].context;else if(n.length>1)for(e=n.shift(),t=a[a.length-1].context[e];n.length;)t=t[e=n.shift()]||null;else t=a[a.length-1].context[e]||null;return a.push({context:t,index:-1}),t},pop:function(){a.pop()},next:function(){var e=a[a.length-1];-1==e.index&&(e={context:null,index:0},a.push(e));var t=a[a.length-2].context;if(e.index!=t.length)return e.context=t[e.index++],!0;a.pop()},_Undefined:function(){return void 0===r?void 0:r},_LookUpStack:function(e){for(var t=a.length-1;;){var n=a[t];if("@index"==e){if(-1!=n.index)return n.index}else{var r=n.context;if("object"==typeof r){var i=r[e];if(void 0!==i)return i}}if(--t<=-1)return this._Undefined(e)}},get:function(e){if("@"==e)return a[a.length-1].context;var t,n,r=/\|\|/.test(e)?e.replace(/\s\|\|\s/g,"||").split("||"):null,i=e.split(".");if(!r){if(void 0===(t=this._LookUpStack(i[0])))return this._Undefined();for(o=1;o<i.length;o++)if(void 0===(t=t[i[o]]))return this._Undefined();return t}n=a[a.length-1].context;for(var o=0;o<r.length;o++)if(n[r[o]])return t=n[r[o]]}}),_(this._program.Statements(),e,t)},T.prototype.expand=function(e){var t=[];return this.render(e,function(e){t.push(e)}),t.join("")};var O=/^([a-zA-Z\-]+):\s*(.*)/,R=new RegExp(["meta","format-char","default-formatter","undefined-str"].join("|"));return{Template:T,HtmlEscape:n,HtmlTagEscape:r,FunctionRegistry:f,SimpleRegistry:p,CallableRegistry:m,ChainedRegistry:g,fromString:function(e,t){for(var n={},r=0,a=0,i=!1;;){var o=!1;if(-1==(a=e.indexOf("\n",r)))break;var u=e.slice(r,a);r=a+1;var l=u.match(O);if(null!==l){var s=l[1].toLowerCase(),c=l[2];s.match(R)&&(s=s.replace("-","_"),c=c.replace(/^\s+/,"").replace(/\s+$/,""),"default_formatter"==s&&"none"==c.toLowerCase()&&(c=null),n[s]=c,o=!0,i=!0)}if(!o)break}var f=i?e.slice(r):e;for(var p in t)n[p]=t[p];return T(f,n)},expand:function(e,t,n){return T(e,n).expand(t)},_Section:v}}();    

    //Setup global holders
    const defaultPredicates = [
        "singular",
        "plural",
        "singular?",
        "plural?",
        "Debug?"
    ];
    
    const defaultFormatters = [
        "html",
        "htmltag",
        "html-attr-value",
        "str",
        "raw",
        "AbsUrl",
        "plain-url"
    ];

    const rQuotes = /"|'/g;
    
    // Sourced from https://code.jquery.com/
    const isNumeric = function ( obj ) {
        return !Array.isArray( obj ) && obj - parseFloat( obj ) >= 0;
    };

    const extractSpaceSplit = function extractSpaceSplit(input) {
        const elements = String(input).split(/([^\"]\S*|\".+?\")\s*/),
            matches = [];
        for(let index in elements) {
            if(elements[index].length > 0) {
                if(elements[index].charAt(0) === '"') {
                    matches.push(elements[index].substring(1, elements[index].length-1));
                } else {
                    matches.push(elements[index]);
                }
            }
        }
        return matches;
    }

    const processArgs = function(context, argumentArray){
        const returnArray = [];
        argumentArray.forEach(function(argumentValue){
            if(rQuotes.test(argumentValue)){
                returnArray.push(argumentValue.slice(1,-1));
            } else {
                const get = context.get( argumentValue ),
                lookup = context._LookUpStack( argumentValue ),
                lookupIsNumeric = isNumeric( lookup ),
                getIsNumeric = isNumeric( get );
    
                if ( (lookup !== undefined && lookup !== "") || lookupIsNumeric ) {
                    argumentValue = lookup;
        
                } else if ( (get !== undefined && get !== "") || getIsNumeric ) {
                    argumentValue = get;
                }
                returnArray.push(argumentValue);
            }
        });
        return returnArray;
    };

    const predicateFn = function(stringValue){
        const   indexOfSpace = stringValue.indexOf( " " ),
                indexOfQuestionMark = stringValue.indexOf( "?" ),
                fnContext = this;
        let     predicate = null,
                passedArgs = [];

        if (indexOfQuestionMark === -1){
            predicate = stringValue;
        } else {
            predicate = stringValue.split("?")[0]
            if(indexOfSpace === indexOfQuestionMark + 1){
                stringValue = stringValue.split("?")[1].slice(1);
            }
            passedArgs = extractSpaceSplit(stringValue);
        }

        if(defaultPredicates.indexOf(predicate) === -1){
            return function (dataValue, context){
                let processedArgs = [];
                if(passedArgs.length > 0){
                    processedArgs = processArgs(context, passedArgs);
                }
                processedArgs.unshift(context);
                processedArgs.unshift(dataValue);
                return fnContext.predicates[predicate].apply(null, processedArgs);
            }
        }
    };

    const formatterFn = function(stringValue){
        const   index = stringValue.indexOf( " " ),
                fnContext = this;
        let     formatter = null,
                passedArgs = [];

        if (index === -1){
            formatter = stringValue;
        } else {
            passedArgs = extractSpaceSplit(stringValue);
            formatter = passedArgs.shift();
        }
        
        if(defaultFormatters.indexOf(formatter) === -1){
            
            return function (stringValue, context){
                let processedArgs = [];
                if(passedArgs.length > 0){
                    processedArgs = processArgs(context, passedArgs);
                }
                processedArgs.unshift(context);
                processedArgs.unshift(stringValue);
                return fnContext.formatters[formatter].apply(null, processedArgs);
            }
        } 
    };

    const addFormatter = function(name, fn){
        if(this.formatters[name]){
            console.log('JSONTemplate formatter:"'+name+'" is already defined.');
        }
        if(typeof fn !== 'function'){
            console.log('JSONTemplate formatter:"'+name+'" must include a function');
            return;
        }
        this.formatters[name] = fn;
    };
    const addPredicate = function(name, fn){
        if(predicates[name]){
            console.log('JSONTemplate predicate:"'+name+'" is already defined.');
        }
        if(typeof fn !== 'function'){
            console.log('JSONTemplate predicate:"'+name+'" must include a function');
            return;
        }
        predicates[name] = fn;
    };

    const templateFn = function(){
        this.predicates = {};
        this.formatters = {};
        const context = this;
        const localFn = function(templateStringOrArray){
            let templateString = templateStringOrArray;
            let templateFn;
            if(Array.isArray(templateString)){
                templateString = templateString.join('');
            }
            templateFn = jsontemplate.Template(templateString, {
                "more_formatters": formatterFn.bind(context),
                "more_predicates": predicateFn.bind(context)
            });
            return templateFn.expand.bind(templateFn);
        }
        localFn.addFormatter = addFormatter.bind(this);
        localFn.addPredicate = addPredicate.bind(this);
        
        return localFn;
    }

    templateUtil.jsontemplate = jsontemplate;

    templateUtil.getInstance = function gestJsonTemplateInstance() {
        return new templateFn();
    }

    templateUtil.template = new templateFn();

})(emory);
(function(app, win){
    //Promise-pollyfill
    const util = app.namespace('util');
    /**
     * @this {Promise}
     */
    function finallyConstructor(callback) {
        var constructor = this.constructor;
        return this.then(
        function(value) {
            return constructor.resolve(callback()).then(function() {
            return value;
            });
        },
        function(reason) {
            return constructor.resolve(callback()).then(function() {
            return constructor.reject(reason);
            });
        }
        );
    }
  
    // Store setTimeout reference so promise-polyfill will be unaffected by
    // other code modifying setTimeout (like sinon.useFakeTimers())
    var setTimeoutFunc = setTimeout;
    
    function noop() {}
    
    // Polyfill for Function.prototype.bind
    function bind(fn, thisArg) {
        return function() {
        fn.apply(thisArg, arguments);
        };
    }
    
    /**
     * @constructor
     * @param {Function} fn
     */
    function Promise(fn) {
        if (!(this instanceof Promise))
        throw new TypeError('Promises must be constructed via new');
        if (typeof fn !== 'function') throw new TypeError('not a function');
        /** @type {!number} */
        this._state = 0;
        /** @type {!boolean} */
        this._handled = false;
        /** @type {Promise|undefined} */
        this._value = undefined;
        /** @type {!Array<!Function>} */
        this._deferreds = [];
    
        doResolve(fn, this);
    }
    
    function handle(self, deferred) {
        while (self._state === 3) {
        self = self._value;
        }
        if (self._state === 0) {
        self._deferreds.push(deferred);
        return;
        }
        self._handled = true;
        Promise._immediateFn(function() {
        var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
        if (cb === null) {
            (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
            return;
        }
        var ret;
        try {
            ret = cb(self._value);
        } catch (e) {
            reject(deferred.promise, e);
            return;
        }
        resolve(deferred.promise, ret);
        });
    }
    
    function resolve(self, newValue) {
        try {
        // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
        if (newValue === self)
            throw new TypeError('A promise cannot be resolved with itself.');
        if (
            newValue &&
            (typeof newValue === 'object' || typeof newValue === 'function')
        ) {
            var then = newValue.then;
            if (newValue instanceof Promise) {
            self._state = 3;
            self._value = newValue;
            finale(self);
            return;
            } else if (typeof then === 'function') {
            doResolve(bind(then, newValue), self);
            return;
            }
        }
        self._state = 1;
        self._value = newValue;
        finale(self);
        } catch (e) {
        reject(self, e);
        }
    }
    
    function reject(self, newValue) {
        self._state = 2;
        self._value = newValue;
        finale(self);
    }
    
    function finale(self) {
        if (self._state === 2 && self._deferreds.length === 0) {
        Promise._immediateFn(function() {
            if (!self._handled) {
            Promise._unhandledRejectionFn(self._value);
            }
        });
        }
    
        for (var i = 0, len = self._deferreds.length; i < len; i++) {
        handle(self, self._deferreds[i]);
        }
        self._deferreds = null;
    }
    
    /**
     * @constructor
     */
    function Handler(onFulfilled, onRejected, promise) {
        this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
        this.onRejected = typeof onRejected === 'function' ? onRejected : null;
        this.promise = promise;
    }
    
    /**
     * Take a potentially misbehaving resolver function and make sure
     * onFulfilled and onRejected are only called once.
     *
     * Makes no guarantees about asynchrony.
     */
    function doResolve(fn, self) {
        var done = false;
        try {
        fn(
            function(value) {
            if (done) return;
            done = true;
            resolve(self, value);
            },
            function(reason) {
            if (done) return;
            done = true;
            reject(self, reason);
            }
        );
        } catch (ex) {
        if (done) return;
        done = true;
        reject(self, ex);
        }
    }
    
    Promise.prototype['catch'] = function(onRejected) {
        return this.then(null, onRejected);
    };
    
    Promise.prototype.then = function(onFulfilled, onRejected) {
        // @ts-ignore
        var prom = new this.constructor(noop);
    
        handle(this, new Handler(onFulfilled, onRejected, prom));
        return prom;
    };
    
    Promise.prototype['finally'] = finallyConstructor;
    
    Promise.all = function(arr) {
        return new Promise(function(resolve, reject) {
        if (!arr || typeof arr.length === 'undefined')
            throw new TypeError('Promise.all accepts an array');
        var args = Array.prototype.slice.call(arr);
        if (args.length === 0) return resolve([]);
        var remaining = args.length;
    
        function res(i, val) {
            try {
            if (val && (typeof val === 'object' || typeof val === 'function')) {
                var then = val.then;
                if (typeof then === 'function') {
                then.call(
                    val,
                    function(val) {
                    res(i, val);
                    },
                    reject
                );
                return;
                }
            }
            args[i] = val;
            if (--remaining === 0) {
                resolve(args);
            }
            } catch (ex) {
            reject(ex);
            }
        }
    
        for (var i = 0; i < args.length; i++) {
            res(i, args[i]);
        }
        });
    };
    
    Promise.resolve = function(value) {
        if (value && typeof value === 'object' && value.constructor === Promise) {
        return value;
        }
    
        return new Promise(function(resolve) {
        resolve(value);
        });
    };
    
    Promise.reject = function(value) {
        return new Promise(function(resolve, reject) {
        reject(value);
        });
    };
    
    Promise.race = function(values) {
        return new Promise(function(resolve, reject) {
        for (var i = 0, len = values.length; i < len; i++) {
            values[i].then(resolve, reject);
        }
        });
    };
    
    // Use polyfill for setImmediate for performance gains
    Promise._immediateFn =
        (typeof setImmediate === 'function' &&
        function(fn) {
            setImmediate(fn);
        }) ||
        function(fn) {
        setTimeoutFunc(fn, 0);
        };
    
    Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
        if (typeof console !== 'undefined' && console) {
        console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
        }
    };

    if (!('Promise' in win)) {
        util.promise = Promise.bind({});
        util.promise.prototype = Promise.prototype;
    } else {
        util.promise = win.Promise;
    }

    if (!util.promise.prototype['finally']) {
        util.promise.prototype['finally'] = finallyConstructor;
    }
})(emory, window);
(function(app){
    const random = app.namespace('util.random');

    // UUID
    random.uuid = function UUID(){
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (dt + Math.random()*16)%16 | 0;
            dt = Math.floor(dt/16);
            return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });
        return uuid;
    }

    // Random Function Name
    random.randomFnName = function randomFnName() {
        return "fn_" + (random.uuid().replace(/-/gi,'_'));
    }

})(emory);


(function(app){

    const first = app.namespace('first');
    const NSfirstUrls = 'first.urls';
    const NSutilAjax = 'util.ajax';
    const NSutil = 'util';
    //Directory listing
    first.department = function emoryFirstDepartment(departments) {
        const urls = app.namespace(NSfirstUrls);
        const utils = app.namespace(NSutilAjax);
        return utils.jsonp(urls.department(departments)).promise;
    }

    function emoryFirstProfile(id) {
        const urls = app.namespace(NSfirstUrls);
        const utils = app.namespace(NSutilAjax);
        return utils.jsonp(urls.profile(id)).promise;
    }

    function emoryFirstProfessional(id) {
        const urls = app.namespace(NSfirstUrls);
        const utils = app.namespace(NSutilAjax);
        return utils.jsonp(urls.professional(id)).promise;
    }

    function emoryFirstTeaching(id) {
        const urls = app.namespace(NSfirstUrls);
        const utils = app.namespace(NSutilAjax);
        return utils.jsonp(urls.teaching(id)).promise;
    }

    function emoryFirstPublications(id) {
        const urls = app.namespace(NSfirstUrls);
        const utils = app.namespace(NSutilAjax);
        return utils.jsonp(urls.publications(id)).promise;
    }

    first.profile = function emoryFirstFullProfile(id) {
        const utils = app.namespace(NSutil);
        return utils.promise.all([emoryFirstProfile(id), emoryFirstProfessional(id), emoryFirstTeaching(id), emoryFirstPublications(id)]).then(function(values){
            return {
                "profile" : values[0][0],
                "professional" : values[1],
                "teaching": values[2],
                "publications": values[3]
            }
        }).catch(function(reason) { 
            console.log(reason);
        });;
    }
})(emory);
(function(app){
    
    const urls = app.namespace('first.urls');
    
    urls.department = function getDepartmentUrl(departments){
        return "https://api.app.emory.edu/api/users/department?code=" + (Array.isArray(departments)? departments.join('&code='): departments);
    };
    
    urls.profile = function getProfileUrl(id) {
        return "https://api.app.emory.edu/api/user/" + id;
    };
    
    urls.professional = function getProfessionalActivitiesUrl(id) {
        return "https://api.app.emory.edu/api/user/" + id + "/professional-activities";
    };
    
    urls.teaching = function getTeachingActivitiesUrl(id) {
        return "https://api.app.emory.edu/api/user/" + id + "/teaching-activities";
    };
    
    urls.publications = function getPublicationsUrl(id) {
        return "https://api.app.emory.edu/api/user/" + id + "/publications";
    };
    
})(emory);

(function(app, doc){
    
    const dom = app.namespace('dom');

    // Util must be loaded first
    const EvEmitter = app.namespace('util').eventEmitter;
    
    // Based on
    /*!
     * imagesLoaded v4.1.4
     * JavaScript is all like "You images are done yet or what?"
     * MIT License
     */
    // extend objects
    function extend( a, b ) {
        for ( var prop in b ) {
        a[ prop ] = b[ prop ];
        }
        return a;
    }
    
    var arraySlice = Array.prototype.slice;
    
    // turn element or nodeList into an array
    function makeArray( obj ) {
        if ( Array.isArray( obj ) ) {
        // use object if already an array
        return obj;
        }
    
        var isArrayLike = typeof obj == 'object' && typeof obj.length == 'number';
        if ( isArrayLike ) {
        // convert nodeList to array
        return arraySlice.call( obj );
        }
    
        // array of single index
        return [ obj ];
    }

    // -------------------------- imagesLoaded -------------------------- //

    /**
     * @param {Array, Element, NodeList, String} elem
     * @param {Object or Function} options - if function, use as callback
     * @param {Function} onAlways - callback function
     */
    function ImagesLoaded( elem, options, onAlways ) {
        // coerce ImagesLoaded() without new, to be new ImagesLoaded()
        if ( !( this instanceof ImagesLoaded ) ) {
        return new ImagesLoaded( elem, options, onAlways );
        }
        // use elem as selector string
        var queryElem = elem;
        if ( typeof elem == 'string' ) {
        queryElem = document.querySelectorAll( elem );
        }
        // bail if bad element
        if ( !queryElem ) {
        console.error( 'Bad element for imagesLoaded ' + ( queryElem || elem ) );
        return;
        }
    
        this.elements = makeArray( queryElem );
        this.options = extend( {}, this.options );
        // shift arguments if no options set
        if ( typeof options == 'function' ) {
        onAlways = options;
        } else {
        extend( this.options, options );
        }
    
        if ( onAlways ) {
        this.on( 'always', onAlways );
        }
    
        this.getImages();
    
        // if ( $ ) {
        // // add jQuery Deferred object
        // this.jqDeferred = new $.Deferred();
        // }
    
        // HACK check async to allow time to bind listeners
        setTimeout( this.check.bind( this ) );
    }
    
    ImagesLoaded.prototype = Object.create( EvEmitter.prototype );
    
    ImagesLoaded.prototype.options = {};
    
    ImagesLoaded.prototype.getImages = function() {
        this.images = [];
    
        // filter & find items if we have an item selector
        this.elements.forEach( this.addElementImages, this );
    };
    
    /**
     * @param {Node} element
     */
    ImagesLoaded.prototype.addElementImages = function( elem ) {
        // filter siblings
        if ( elem.nodeName == 'IMG' ) {
        this.addImage( elem );
        }
        // get background image on element
        if ( this.options.background === true ) {
        this.addElementBackgroundImages( elem );
        }
    
        // find children
        // no non-element nodes, #143
        var nodeType = elem.nodeType;
        if ( !nodeType || !elementNodeTypes[ nodeType ] ) {
        return;
        }
        var childImgs = elem.querySelectorAll('img');
        // concat childElems to filterFound array
        for ( var i=0; i < childImgs.length; i++ ) {
        var img = childImgs[i];
        this.addImage( img );
        }
    
        // get child background images
        if ( typeof this.options.background == 'string' ) {
        var children = elem.querySelectorAll( this.options.background );
        for ( i=0; i < children.length; i++ ) {
            var child = children[i];
            this.addElementBackgroundImages( child );
        }
        }
    };
    
    var elementNodeTypes = {
        1: true,
        9: true,
        11: true
    };
    
    ImagesLoaded.prototype.addElementBackgroundImages = function( elem ) {
        var style = getComputedStyle( elem );
        if ( !style ) {
        // Firefox returns null if in a hidden iframe https://bugzil.la/548397
        return;
        }
        // get url inside url("...")
        var reURL = /url\((['"])?(.*?)\1\)/gi;
        var matches = reURL.exec( style.backgroundImage );
        while ( matches !== null ) {
        var url = matches && matches[2];
        if ( url ) {
            this.addBackground( url, elem );
        }
        matches = reURL.exec( style.backgroundImage );
        }
    };
    
    /**
     * @param {Image} img
     */
    ImagesLoaded.prototype.addImage = function( img ) {
        var loadingImage = new LoadingImage( img );
        this.images.push( loadingImage );
    };
    
    ImagesLoaded.prototype.addBackground = function( url, elem ) {
        var background = new Background( url, elem );
        this.images.push( background );
    };
    
    ImagesLoaded.prototype.check = function() {
        var _this = this;
        this.progressedCount = 0;
        this.hasAnyBroken = false;
        // complete if no images
        if ( !this.images.length ) {
        this.complete();
        return;
        }
    
        function onProgress( image, elem, message ) {
        // HACK - Chrome triggers event before object properties have changed. #83
        setTimeout( function() {
            _this.progress( image, elem, message );
        });
        }
    
        this.images.forEach( function( loadingImage ) {
        loadingImage.once( 'progress', onProgress );
        loadingImage.check();
        });
    };
    
    ImagesLoaded.prototype.progress = function( image, elem, message ) {
        this.progressedCount++;
        this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
        // progress event
        this.emitEvent( 'progress', [ this, image, elem ] );
        // if ( this.jqDeferred && this.jqDeferred.notify ) {
        // this.jqDeferred.notify( this, image );
        // }
        // check if completed
        if ( this.progressedCount == this.images.length ) {
        this.complete();
        }
    
        if ( this.options.debug && console ) {
        console.log( 'progress: ' + message, image, elem );
        }
    };
    
    ImagesLoaded.prototype.complete = function() {
        var eventName = this.hasAnyBroken ? 'fail' : 'done';
        this.isComplete = true;
        this.emitEvent( eventName, [ this ] );
        this.emitEvent( 'always', [ this ] );
        // if ( this.jqDeferred ) {
        // var jqMethod = this.hasAnyBroken ? 'reject' : 'resolve';
        // this.jqDeferred[ jqMethod ]( this );
        // }
    };
    
    // --------------------------  -------------------------- //
    
    function LoadingImage( img ) {
        this.img = img;
    }
    
    LoadingImage.prototype = Object.create( EvEmitter.prototype );
    
    LoadingImage.prototype.check = function() {
        // If complete is true and browser supports natural sizes,
        // try to check for image status manually.
        var isComplete = this.getIsImageComplete();
        if ( isComplete ) {
        // report based on naturalWidth
        this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
        return;
        }
    
        // If none of the checks above matched, simulate loading on detached element.
        this.proxyImage = new Image();
        this.proxyImage.addEventListener( 'load', this );
        this.proxyImage.addEventListener( 'error', this );
        // bind to image as well for Firefox. #191
        this.img.addEventListener( 'load', this );
        this.img.addEventListener( 'error', this );
        this.proxyImage.src = this.img.src;
    };
    
    LoadingImage.prototype.getIsImageComplete = function() {
        // check for non-zero, non-undefined naturalWidth
        // fixes Safari+InfiniteScroll+Masonry bug infinite-scroll#671
        return this.img.complete && this.img.naturalWidth;
    };
    
    LoadingImage.prototype.confirm = function( isLoaded, message ) {
        this.isLoaded = isLoaded;
        this.emitEvent( 'progress', [ this, this.img, message ] );
    };
    
    // ----- events ----- //
    
    // trigger specified handler for event type
    LoadingImage.prototype.handleEvent = function( event ) {
        var method = 'on' + event.type;
        if ( this[ method ] ) {
        this[ method ]( event );
        }
    };
    
    LoadingImage.prototype.onload = function() {
        this.confirm( true, 'onload' );
        this.unbindEvents();
    };
    
    LoadingImage.prototype.onerror = function() {
        this.confirm( false, 'onerror' );
        this.unbindEvents();
    };
    
    LoadingImage.prototype.unbindEvents = function() {
        this.proxyImage.removeEventListener( 'load', this );
        this.proxyImage.removeEventListener( 'error', this );
        this.img.removeEventListener( 'load', this );
        this.img.removeEventListener( 'error', this );
    };
    
    // -------------------------- Background -------------------------- //
    
    function Background( url, element ) {
        this.url = url;
        this.element = element;
        this.img = new Image();
    }
    
    // inherit LoadingImage prototype
    Background.prototype = Object.create( LoadingImage.prototype );
    
    Background.prototype.check = function() {
        this.img.addEventListener( 'load', this );
        this.img.addEventListener( 'error', this );
        this.img.src = this.url;
        // check if image is already complete
        var isComplete = this.getIsImageComplete();
        if ( isComplete ) {
        this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
        this.unbindEvents();
        }
    };
    
    Background.prototype.unbindEvents = function() {
        this.img.removeEventListener( 'load', this );
        this.img.removeEventListener( 'error', this );
    };
    
    Background.prototype.confirm = function( isLoaded, message ) {
        this.isLoaded = isLoaded;
        this.emitEvent( 'progress', [ this, this.element, message ] );
    };

    dom.imagesLoaded = ImagesLoaded;

    dom.allImagesLoaded = function allImagesLoaded(fn) {
        if( typeof(fn) !== 'function') {
            throw 'Callback must be a function.';
        }
        return ImagesLoaded(doc.body, fn);
    };

})(emory, document);
(function(app, doc){
    const dom = app.namespace('dom');

    dom.ready = function ready(fn){
        if( typeof(fn) !== 'function') {
            throw 'Callback must be a function.';
        }
        if (doc.readyState === "loading") {
            doc.addEventListener("DOMContentLoaded", fn);
        } else {  // `DOMContentLoaded` already fired
            fn();
        }
    }
})(emory, document)