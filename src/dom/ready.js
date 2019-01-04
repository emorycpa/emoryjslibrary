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
})(emory, document);