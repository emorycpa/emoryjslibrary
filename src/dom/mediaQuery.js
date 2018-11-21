(function(app, win){
    
    const mediaQuery = app.namespace('dom.mediaQuery');
    const mediaQueryRefs = {};

    mediaQuery.matchs = function matchs(query){
        if(!mediaQueryRefs[query]){
            mediaQueryRefs[query] = window.matchMedia(query);
        }
        return mediaQueryRefs[query].matches;
    };
    
    mediaQuery.addListener = function addListener(query, fn){
        if(!mediaQueryRefs[query]){
            mediaQueryRefs[query] = window.matchMedia(query);
        }
        if(mediaQueryRefs[query].matches){
            fn.call({});
        }
        mediaQueryRefs[query].addListener(fn);
    };

    mediaQuery.removeListener = function removeListener(query, fn){
        if(!mediaQueryRefs[query]){
            return;
        }
        mediaQueryRefs[query].removeListener(fn);
    }
})(emory, window);