(function(){
    function spaRouter(){
        
    }
    spaRouter.prototype.start = function(config){
        var self = this;
        this.baseUrl = config.baseUrl;
        this.enterCallback = config.enterCallback;
        this.routerMap = config.router;
        this.mainView = config.view;
        this.errorTemplateId = config.errorTemplateId;
        this.catchHtmls = [];
        this.isNotBack = true;//是否为后退
        this.isNotLook = true;//是否有权限访问
        startRouter();
        window.onhashchange = function(){
            console.log('hash值改变')
            startRouter();
        };
        window.onpopstate = function () { //后退时，不添加随机字符，不然会导致死循环
            console.log('触发了onpopstate')
            router.isNotBack = false;
        };  
    };
    var messageStack = [];
    // {
    //     'id': 'home_bindcard',
    //     'content': {
    //     }
    // }
    spaRouter.prototype.getMessage = function(id){
        if(id == 'all'){
            return messageStack;
        }
        
        var msg = {};
        $.each(messageStack,function(i,e){
            if(e.id===id){
                msg = e;
            }
        });
        return msg;
    };

    spaRouter.prototype.setMessage = function(obj){
        var _obj = JSON.parse(JSON.stringify(obj));
        $.each(messageStack,function(i,e){
            if(e.id===_obj.id){
                e = _obj;
                return false;
            }
        });
        messageStack.push(_obj);
        console.log('messageStack', messageStack)
    };
    spaRouter.prototype.delMessage = function(id){
        if(typeof id==='undefined'){
            return false;
        }
        var index = 0;
        $.each(messageStack,function(i,e){
            if(e.id===id){
                index = i;
            }
        });
        $.each(messageStack,function(i,e){
            if(i>index){
                messageStack[i-1] = e;
            }
        });
    };
    spaRouter.prototype.clearMessage = function(id){
        var index = 0;
        messageStack = [];
    };
    
    spaRouter.prototype.stringify = function(routerUrl,paramObj){
        var paramStr='' ,hash;
        for(var i in  paramObj){
            paramStr += i + '=' + encodeURIComponent(paramObj[i]) + '&';
        }
        if(paramStr === ''){
            hash = routerUrl;
        }
        else{
            paramStr = paramStr.substring(0,paramStr.length-1);
            hash = routerUrl + '?' + paramStr;
        }
        return hash;
    };
    spaRouter.prototype.parse = function(routerHash){
        var hash = typeof routerHash ==='undefined'?location.hash:routerHash;
        var obj = {
            url:'',
            param: {}
        };
        var param = {},url='';
        var pIndex = hash.indexOf('?');
        if(hash===''){
            return obj;
        }

        if(pIndex>-1){
            url = hash.substring(1,pIndex);
            var paramStr = hash.substring(pIndex+1);
            var paramArr = paramStr.split('&');
            
            $.each(paramArr,function(i,e){
                var item = e.split('='),
                    key,
                    val;
                key = item[0];
                val = item[1];
                if(key!==''){
                    param[key] = decodeURIComponent(val);
                }
                

            });
        }
        else{
            url = hash.substring(1);
            param = {};
        }
        return {
            url:url,
            param: param
        };
    };
    //页面离开
    spaRouter.prototype.leave = function (callback) {
        console.log('页面即将leave')
        callback && callback();
    }
    //param显示传参，如页面需要单独刷新，无法使用上面的隐式传参
    spaRouter.prototype.to = function (component, param, callback) {
        var paramStr = '';
        if(param){
            for (var i in param) { //arguments方式无法获取key名称，妥协使用一个对象来代替传入多个参数
                paramStr += i + '=' + param[i] + '&'
            }
        }
        pushState('#' + component + '?' + paramStr + 'v=' + randomString())
        startRouter(callback);
    }

    spaRouter.prototype.getParameter = function (name) {
        return getUrlParameter(name);
    }
    
    function startRouter(callback) {
        try {
            var routeObj = router.parse(location.hash);
            if (routeObj.url){
                routeObj.role = router.routerMap[routeObj.url].role;
            }
            
            router.enterCallback && router.enterCallback(routeObj);
            if (router.isNotLook){
                routerAction(routeObj, callback);
            }
        } catch (error) {
            alert('错误的地址')
            console.error(error)
        }
    }

    //添加随机码
    function addRandom() {
        var newUrl = window.location.href;
        if (newUrl.indexOf('v=') <= -1) {
            //newUrl = newUrl.split('v=')[0] + 'v=' + randomString()
            if (newUrl.indexOf('?') > -1) {
                newUrl += '&v=' + randomString()
            } else {
                newUrl += '?v=' + randomString()
            }

            pushState(newUrl)
        }
    }

    function pushState(newUrl){
        if (!!(window.history && history.pushState)) {
            console.log('newUrl', newUrl)
            history.pushState(null, null, newUrl);
        } else {
            // TODO Polyfill库History.js
        }
    }

    function getUrlParameter(name) {
        var parameterArr = window.location.href.split('?')[1].split('&v=')[0].split('&');
        var newList = {};
        for (var i in parameterArr) {
            newList[parameterArr[i].split('=')[0]] = decodeURI(parameterArr[i].split('=')[1])
        }
        return newList[name]
    }

    //获取一个函数的参数名称
    function getArgs(func) {
        // 先用正则匹配,取得符合参数模式的字符串.
        // 第一个分组是这个: ([^)]*) 非右括号的任意字符
        var args = func.toString().match(/function\s.*?\(([^)]*)\)/)[1];
        // 用逗号来分隔参数(arguments string).
        return args.split(",").map(function (arg) {
            // 去除注释(inline comments)以及空格
            return arg.replace(/\/\*.*\*\//, "").trim();
        }).filter(function (arg) {
            // 确保没有 undefined.
            return arg;
        });
    }

    function routerAction (routeObj, callback){
    
        var routerItem = router.routerMap[routeObj.url];

        console.log('routeObj.url', routeObj.url)
        console.log('router.routerMap', router.routerMap)
        console.log('this.baseUrl', router.baseUrl)
        console.log('this.routerItem', routerItem)

        if (typeof routerItem === 'undefined') {
            var defaultsRoute = router.routerMap.defaults;
            routerItem = router.routerMap[defaultsRoute];
            location.hash = defaultsRoute + '?v=' + randomString();
            return false;
        }

        loadScript(routerItem.controller, callback);
        
        /* 
        var isExitCatch = isRouterUrlExitsInCatchHtmls(routerItem.templateUrl);
        if (isExitCatch) {
            loadPageHtmlFromCatch(routerItem);
        } else {
            fetchHtmlFromServer(routerItem);
        } */
        
    }
    function fetchHtmlFromServer(routerItem) {
        $.ajax({
            type: 'GET',
            async: false,
            url: router.baseUrl + routerItem.templateUrl,
            dataType: 'html',
            success: function(data, status, xhr){
                $(router.mainView).html(data);
                loadScript(routerItem.controller);
                saveHtmlsToCatch(routerItem.templateUrl, data);
            },
            error: function(xhr, errorType, error){
                if($(router.errorTemplateId).length===0){
                    return false;
                }
                var errHtml = $(router.errorTemplateId).html();
                errHtml = errHtml.replace(/{{errStatus}}/,xhr.status);
                errHtml = errHtml.replace(/{{errContent}}/,xhr.responseText);
                $(router.mainView).html(errHtml);
            }
        });
    }
    function loadPageHtmlFromCatch(routerItem) {
        var htmls = getHtmlsFromCatch(routerItem.templateUrl);
        $(router.mainView).html(htmls);
        loadScript(routerItem.controller);
    }
    function getHtmlsFromCatch(routerUrl) {
        for(var i=0,e;i<router.catchHtmls.length;i++) {
            e = router.catchHtmls[i];
            if (e.routerUrl === routerUrl) {
                return e.htmls;
            }
        }
        return '';
    }

    function saveHtmlsToCatch(routerUrl, htmls) {
        var obj = {
            routerUrl: routerUrl,
            htmls: htmls,
        };
        router.catchHtmls.push(obj);
    }

    function isRouterUrlExitsInCatchHtmls(routerUrl) {
        for(var i=0,e;i<router.catchHtmls.length;i++) {
            e = router.catchHtmls[i];
            if (e.routerUrl === routerUrl) {
                return true;
            }
        }
        return false;
    }
    
    function loadScript(src, callback) {
        router.leave();
        require([src], function (loadFun) {
            loadFun();
            callback && callback();
        })

        router.isNotBack && addRandom(); //添加随机码
    }

    function randomString(len) {
    　　len = len || 6;
    　　var $chars = 'abcdefghijklmnopqrstuvwxyz';
    　　var maxPos = $chars.length;
    　　var pwd = '';
    　　for (i = 0; i < len; i++) {
        　　　　pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    　　}
    　　return pwd;
    }

    window.router = new spaRouter();
})();