(function(app){
    const ajax = app.namespace('ajax');
    const NSajax = 'ajax';
    
    ajax.get = function(options) {
        return (new app.namespace(NSajax).request()).send(Object.assign({},options, {"method": "GET"}));
    }

    ajax.post = function(options) {
        return (new app.namespace(NSajax).request()).send(Object.assign({},options, {"method": "POST"}));
    }

})(emory);