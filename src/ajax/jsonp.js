(function(app){
    const ajax = app.namespace('ajax');
    const NSajaxUtils = 'ajax.util';
    const NSUtils = 'util';
    const NSRandomUtils = 'util.random';

    // JSONP with Promise return
    ajax.jsonp = function jsonp(url, options) {
        options = options || {};
        
        //References
        const ajaxUtils = app.namespace(NSajaxUtils);
        const utils = app.namespace(NSUtils);
        const random = app.namespace(NSRandomUtils);

        //Setup local vars
        const id = options.callbackFn || random.randomFnName();
        const callback = options.callbackParam || 'callback';
        const timeout = options.timeout ? options.timeout : 15000;
        const target = document.getElementsByTagName('script')[0] || document.head;
        const data = options.data || {};
        const returnAsPromise = options.returnAsPromise || true;
        //Promise for local implimentation
        const Promise = utils.promise;
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
    
            window[id] = ajaxUtils.noop;
    
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
        // Return as a promise with cancel option -- default
        if(returnAsPromise) {
            return promise;
        }

        return {
            promise: promise,
            cancel: cancel
        };
    };

})(emory);