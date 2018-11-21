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