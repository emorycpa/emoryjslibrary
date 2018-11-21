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
