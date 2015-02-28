var messageController = require('./messageController.js');

module.exports = function (app) {
  app.post('/savemessage', messageController.saveMessage);
  app.post('/saveimage', messageController.saveImage);
  app.post('/nearby', messageController.getNearbyMessages);
  app.post('/updatevote', messageController.updateVote);
  app.post('/private', messageController.savePrivate);
  app.post('/private/nearby', messageController.getPrivate);
  app.post('/private/addreply', messageController.addPrivateReply);
  app.post('/addreply', messageController.addReply);
};
