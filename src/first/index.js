(function(app){

    const first = app.namespace('first');
    const NSfirstUrls = 'first.urls';
    const NSajax = 'ajax';
    const NSutil = 'util';
    //Directory listing
    first.department = function emoryFirstDepartment(departments) {
        const urls = app.namespace(NSfirstUrls);
        const ajax = app.namespace(NSajax);
        return ajax.jsonp(urls.department(departments));
    }

    function emoryFirstProfile(id) {
        const urls = app.namespace(NSfirstUrls);
        const ajax = app.namespace(NSajax);
        return ajax.jsonp(urls.profile(id));
    }

    function emoryFirstProfessional(id) {
        const urls = app.namespace(NSfirstUrls);
        const ajax = app.namespace(NSajax);
        return ajax.jsonp(urls.professional(id));
    }

    function emoryFirstTeaching(id) {
        const urls = app.namespace(NSfirstUrls);
        const ajax = app.namespace(NSajax);
        return ajax.jsonp(urls.teaching(id));
    }

    function emoryFirstPublications(id) {
        const urls = app.namespace(NSfirstUrls);
        const ajax = app.namespace(NSajax);
        return ajax.jsonp(urls.publications(id));
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