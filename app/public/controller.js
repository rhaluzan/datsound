app.controller('player', ['$scope', 'youtubePlayerApi', '$route', '$routeParams', function ($scope, youtubePlayerApi, $route, $routeParams) {

    $scope.query = $routeParams.channel;  // 'majesticcasual';

    var channel = $scope.query;
    var songlist = [];
    var currentSongId;
    // var currentIndex = 0;

    $scope.songList = youtubePlayerApi;


    $scope.$watch('songList.getSongList()', function(newVal, oldVal) {
        if( newVal != oldVal ) {
            $scope.tracks = newVal;
        }
    }, true);

    $scope.$watch('songList.getYtState()', function(newVal) {
        if(newVal === 'ended') {
            youtubePlayerApi.nextVideo(channel);
        }
    });


    youtubePlayerApi.fetchVideo(channel).then(function (result) {
        $scope.count = result.count;

        youtubePlayerApi.videoId = result.trackId;
        youtubePlayerApi.loadPlayer();
    });

    $scope.togglePlay = function() {
        youtubePlayerApi.togglePlay();
    };

    $scope.next = function() {
        youtubePlayerApi.nextVideo(channel);
    };
    $scope.back = function() {
        youtubePlayerApi.previousVideo();
    };

    $scope.current = function() {
        return youtubePlayerApi.currentIndex;
    };

}]);

app.controller('channelList', ['$scope', 'youtubePlayerApi', '$route', '$routeParams', 'channelListModel', '$http', function ($scope, youtubePlayerApi, $route, $routeParams, channelListModel, $http) {
    channelListModel.then(function(result) {
        $scope.channels = [];
        angular.forEach(result, function(item) {
            // console.log(item.channel);
            var data = $http.jsonp('http://gdata.youtube.com/feeds/api/users/' + item.channel +'?fields=id,media:thumbnail&alt=json-in-script&format=2&callback=JSON_CALLBACK').then(function(response) {
                // console.log(response.data.entry.media$thumbnail.url.replace(/s(\d*)-/, 's500'));
                $scope.channels.push({
                    item: item,
                    rank: 0.5 - Math.random(),
                    picture: response.data.entry.media$thumbnail.url.replace(/s(\d*)-/, 's1000-')
                });
            });
        });
    });

}]);
