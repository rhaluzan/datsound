app.directive('youtubePlayer', ['youtubePlayerApi', function (youtubePlayerApi) {
    return {
        restrict: 'A',
        link: function (scope, element) {
            youtubePlayerApi.bindVideoPlayer(element[0].id);
        }
    };
}])
