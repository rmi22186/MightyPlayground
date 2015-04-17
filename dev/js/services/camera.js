angular.module('ionic.camera', [])

.factory('Camera', ['$cordovaCamera', '$http', function($cordovaCamera, $http) {
  var image = {};

  var returnImage = function() {
    return image;
  };

  var takePic = function() {
    var options = {
      destinationType : 0,
      sourceType : 0,
      allowEdit : true,
      encodingType: 0,
      quality: 30,
      targetWidth: 320,
      targetHeight: 320,
    };
    return $cordovaCamera.getPicture(options);
  };

  var storeImage = function(imageData) {
    image.src = 'data:image/jpeg;base64,' + imageData;
    image.id = Math.floor(Math.random()*100000000);
  };

  var getSignedUrl = function() {
    console.log(image);
    return $http({
      method: 'PUT',
      url: //base
      '/api/messages/getsignedurl',
      data: JSON.stringify(image) //change to image.id and modify server
    })
    .then(function(resp) {
      image.shortUrl = resp.data.shortUrl;
      image.signedUrl = resp.data.signedUrl;
      console.log(image.signedUrl);
      console.log(image.shortUrl);
    })
    .catch(function(error) {
      console.log('error in getSignedUrl: ' + error);
    });
  };

  var uploadImage = function() {
    return $http({
      method: 'PUT',
      url: image.signedUrl, //change to image.signedUrl?
      data: image.src, //change to image.src?
      headers: {
        'Content-Type': 'image/jpeg'
      },
    })
    .catch(function(error) {
      console.log('error in getSignedUrl: ' + error);
    });
  };

  return {
    takePic: takePic,
    returnImage: returnImage,
    storeImage: storeImage,
    getSignedUrl: getSignedUrl,
    uploadImage: uploadImage
  };

}]);