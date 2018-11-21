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