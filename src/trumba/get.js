(function(app){
    const trumba = app.namespace('trumba');
    const NSAjax = 'ajax';

    trumba.getJSON = function getTrumbaCalendarAsJSON(calendarName){
        const ajaxGet = app.namespace('ajax').get;
        return ajaxGet({"url": "https://www.trumba.com/calendars/" + calendarName + ".json"}).then(function(ajaxReturn){
            return ajaxReturn.response ? ajaxReturn.response : [];
        });
    };


})(emory);