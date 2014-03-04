var app = angular.module('youtube', ['ng', 'ngRoute']);

app.run(function () {
    var tag = document.createElement('script');
    // This is a protocol-relative URL as described here:
    //     http://paulirish.com/2010/the-protocol-relative-url/
    // If you're testing a local page accessed via a file:/// URL, please set tag.src to
    //     "https://www.youtube.com/iframe_api" instead.
    tag.src = "//www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

app.config(['$routeProvider',
    function($routeProvider){
    $routeProvider
        .when('/play/:channel', {
            controller: 'player',
            templateUrl: 'views/play.html'
        })
        .when('/', {
            controller: 'channelList',
            templateUrl: 'views/base.html'
        })
        .otherwise({"redirectTo": "views/base.html"});
}]);
