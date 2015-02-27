angular.module('thoughtdrop.privateController', [])

.controller('privateController', function($scope, $timeout, $ionicModal, Private, Geolocation, $window, $localStorage, $cordovaContacts) {
  //TODO: change 'findNearby' to 'findNearbyMessages' (more intuitive)
        //limit number of times user can upvote and downvote to one per message
        //modularize all http requests to services
        //look into using socket.io to handle simultaneous upvote/downvote requests from clients
  $scope.message = {};
  $scope.message.text = '';
  $scope.page = 'new';
  $scope.recipients = []; //number hardcoded for testing reasons
  $scope.privateMessages = {};
  $scope.data = {selectedContacts: []};

  $ionicModal.fromTemplateUrl('templates/tab-privatePost.html', {
    scope: $scope
  }).then(function(modal) {
  $scope.modalNewMessage = modal;
  });

  $scope.setPage = function(page) {
    $scope.page = page;
  };

  $scope.sendMessage = function() {
    console.log('sendMessage!');
    console.log('userInfo: ' + JSON.stringify($localStorage.userInfo));

    Geolocation.getPosition()
      .then(function(position) {
        
        var creator = $localStorage.userInfo.name; //get user's name from local storage
        
        var messageData = {
          _id: Math.floor(Math.random()*100000),
          location: { coordinates: [ position.coords.longitude, position.coords.latitude], type: 'Point' },
          message: $scope.message.text,
          _creator: creator,
          recipients: $scope.recipients,
          isPrivate: true
        };


        $scope.message.text = ''; //clear the message  for next message
        console.log($scope.message);
        $scope.recipients = []; //clear the recipients array for next message
        $scope.closeMessageBox();
        $scope.data = {selectedContacts: []}; //clear contacts for next message

        Private.saveMessage(messageData)
        .then(function(resp) {
          console.log('Message ' + "'" + resp + "'" + ' was successfully posted to server');
          //return resp;
        })
        .catch(function(err) {
          console.log('Error posting private message: ',  JSON.stringify(err));
        });
      })
      .then(function() {
        // $scope.findNearby('nearby');
        $scope.closeMessageBox();
      })
  };

  $scope.closeMessageBox = function(time) {
    var time = time || 250;
    $timeout(function() {
      $scope.modalNewMessage.hide();
    }, time);
  };

  $scope.newMessage = function() {
    $scope.modalNewMessage.show();
  };

  $scope.pickContact = function() {

    Private.pickContact()
      .then(function(contact) {
          $scope.data.selectedContacts.push(contact);
          // console.log(JSON.stringify(contact.phones[0].value));
          var number = contact.phones[0].value.replace(/\W+/g, "");
          console.log(' # before regex & slice' + number);
          var phoneNumber;

          if (number.length > 10) {  
            phoneNumber = number.slice(1);
            $scope.recipients.push(parseInt(phoneNumber));
          } else {
            $scope.recipients.push(parseInt(number));
          }

          // $scope.recipients.push(contact.phones[0].value));

          console.log('RECIPIENT!: ' + $scope.recipients);

        },
        function(failure) {
            console.log("Bummer.  Failed to pick a contact");
        });

  };

  //send coordinates & users's phone number
  $scope.findPrivateMessages = function () {
    console.log(JSON.stringify($localStorage.userInfo));
    var userPhone = $localStorage.userInfo._id;

    Geolocation.getPosition()     //get users's position
      .then(function(position) {
          
        var data = {  //send user phoneNumber & coordinates
          latitude: position.coords.longitude, 
          longitude: position.coords.latitude,
          userPhone: userPhone
        };

        console.log("userData before DB: " + JSON.stringify(data));

        Private.getPrivate(data) //fetch private messages
        .then(function(resp) {
          $scope.privateMessages.messages = resp.data;
          console.log('$scope.privateMessages: ' + JSON.stringify($scope.privateMessages.messages));
        })
        .catch(function(err) {
          console.log('Error posting message: ' +  JSON.stringify(err));
        });
      })
  };

  $scope.doRefresh = function() {
    $scope.findPrivateMessages('scroll.refreshComplete');
    $scope.$broadcast('scroll.refreshComplete');
    // $scope.apply();
  };

  $scope.findPrivateMessages();

});