angular.module('starter.messageController', [])

.controller('messageController', function($scope, $http, Messages, $cordovaGeolocation) {
  $scope.message = {};
  $scope.message.text = '';

  $scope.submit = function() {
    $cordovaGeolocation
    .getCurrentPosition()
    .then(function(position) {
      var lat = position.coords.latitude;
      var long = position.coords.longitude;
      $scope.sendMessage($scope.message.text, long, lat);
    });
  };

  $scope.sendMessage = function(message, long, lat) {

    var data = {};
    data.message = message;
    data.long = long;
    data.lat = lat;

    console.log('sending data! ' + data.message);
    return $http({
      method: 'POST',
      url: '/api/messages',
      data: JSON.stringify(data)
    })
    .then(function(resp) {
      console.log('send message successful!');
      return resp.data;
    })
    .catch(function(err) {
      console.log(err);
    });
  };

  $scope.getNearby = function() {
    Messages.findNearby();
  };


  //TODO - remove soon in favor of getNearby above?
  $scope.getAll = function() {
    Messages.getMessages() 
    .then(function(data) {
      $scope.message.messages = data;
    });
  };

  $scope.getAll();
});