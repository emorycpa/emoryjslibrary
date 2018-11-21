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