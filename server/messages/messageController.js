var Message = require('../../db/models/messages.js');
var Q = require('q');
var AWS = require('aws-sdk');

module.exports = {

  addReply: function (req, res) {
    console.log('adding messagedetail');
    console.log(req.body.text);
    var toAdd = req.body.text;
    var messageID = req.body.messageid;
    console.log('messageId == ' + messageID);
    var addMessage = Q.nbind(Message.findByIdAndUpdate, Message);
    addMessage(messageID, { $push : { replies: toAdd }}, {safe: true, upsert: true})
    .then(function(reply) {
      res.status(200).send('reply saved: ' + reply);
    });
  },

  addPrivateReply: function(req, res) {
    console.log('ADD PRIVATE REPLY!' + JSON.stringify(req.body));
    var message = req.body.message;
    var messageID = req.body.messageid;
    console.log('messageID --- ' + messageID);
    var addMessage = Q.nbind(Message.findByIdAndUpdate, Message);
    addMessage(messageID, { $push : { replies: req.body }}, {safe: true, upsert: true})
    .then(function(reply) {
      res.status(200).send('reply saved: ' + reply);
    })
   .catch(function (error) {
      console.log(error);
    });
  },

  updateVote: function(req, res) {
    var voteCount = req.body[1];
    var messageID = req.body[0];
    console.log('Received updated voteCount from client, where votes = ', voteCount);
    var updateVote = Q.nbind(Message.findByIdAndUpdate, Message);
    updateVote(messageID, { votes : voteCount} )
      .then(function (data) {
        res.status(200).send();
        console.log('Vote was successfully saved to database', data);
      })
      .catch(function (error) {
        console.log(error);
      });
  },

  queryByLocation: function(lat, long, radius) {
    var query = {};
    query.location = {
      $near : {
        $geometry : {
          type : "Point",
          coordinates : [long, lat] 
        },
        $maxDistance : radius
      }
    };
    return query;
  },

  computeSortString: function(sortType) {
    sortType = sortType || '-created_at';
    if (sortType === 'new') {
      sortType = '-created_at';
    } else if (sortType === 'top') {
      sortType = '-votes';
    }
    return sortType;
  },

  getNearbyMessages: function(req, res) {
    console.log('/////Trying to get messages from DATABASE!!!');
    var sortString = module.exports.computeSortString(req.body[1]);//pass in 'new' or 'top'
    var locationQuery = module.exports.queryByLocation(req.body[0].lat, req.body[0].long, 100);
    console.log('public query!: ' + JSON.stringify(locationQuery));

    Message
      .find(locationQuery)
      .where('isPrivate').equals(false)
      .limit(50) 
      .sort(sortString)
      .exec(function (err, messages) {
        console.log('Sent messages within 100m of (' + req.body[0].lat + ", " + req.body[0].long + ') to client. Here are the messages:' + messages);
        res.send(messages);
    });
  },

  saveMessage: function (req, res) {
    var createMessage = Q.nbind(Message.create, Message);
    console.log(req.body);
    var data = { //TODO: add a facebookID field
      _id: Number(req.body.id), 
      location: {coordinates: [req.body.coordinates.long, req.body.coordinates.lat]},
      message: req.body.text,
      created_at: new Date(),
      photo_url: 'https://mpbucket-hr23.s3-us-west-1.amazonaws.com/' + req.body.id
    };
    console.log('typeof data id ' + typeof data._id);
    console.log('data id value ' + data._id);

    createMessage(data) 
      .then(function (createdMessage) {
        res.status(200).send('great work!');
        console.log('Message ' + data.message + ' was successfully saved to database', createdMessage);
      })
      .catch(function (error) {
        console.log(error);
      });
  },

  saveImage: function(req, res) {

    console.log('about to send to AWS');

    AWS.config.update({ accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY });
    AWS.config.region = 'us-west-1';

    var s3bucket = new AWS.S3();
    
    var params = { 
      Bucket: process.env.amazonBUCKET,
      Key: req.body.id.toString(),
      ContentType: 'image/jpeg',
      Body: req.body.src,
      ServerSideEncryption: 'AES256' 
    };

    s3bucket.getSignedUrl('putObject', params, function(err, url) {
      if(err){
        console.log(err);
      } else{
        var return_data = {
          signed_request: req.body.src,
          url: 'https://'+ params.Bucket +'.s3.amazonaws.com/'+req.body.id
        };
        res.write(JSON.stringify(return_data));
        res.end();
      }
    });
  },

  savePrivate: function(req, res) {
    var createMessage = Q.nbind(Message.create, Message);
    console.log('private message data: ' + JSON.stringify(req.body));

    createMessage(req.body) 
      .then(function (createdMessage) {
        console.log('Message ' + req.body.message + ' was successfully saved to database', createdMessage);
      })
      .catch(function (error) {
        console.log(error);
      });
  },

  getPrivate: function(req, res) {
    console.log('user info!!!: ' + JSON.stringify(req.body));
    var userPhone = req.body.userPhone;
    console.log('userphone String: ' + userPhone);
    var recipients = 'recipients';
    console.log(typeof userPhone);
    
    var locationQuery = module.exports.queryByLocation(req.body.longitude, req.body.latitude, 100);

    Message
      .find(locationQuery)
      .where('isPrivate').equals(true)
      // .where('5106047443')           // not working!!!!!, looping through on server to find matches
      // .in(['recipients'])
      // // // .sort()
      .exec(function(err, messages) {
        console.log('private message found!: ' + JSON.stringify(messages));
        var result = [];

          for (var i = 0; i < messages.length; i++){
            if (messages[i].recipients.indexOf(userPhone) !== -1){
              result.push(messages[i]);
            }
          }
        
        console.log('get private Results: ' + result);
        res.send(result);
    });
  }

};

//db.message.find({ isPrivate: { $ne: true }} );
