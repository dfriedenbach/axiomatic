module.exports = function(app, io) {
  // import mongoose model for Questions
  var Question = require('./models/Question');
  var User = require('./models/User');
  var url = require('url');
  var userController = require('./models/userController.js');


  // Express routing service for get and post requests

  app.get('/users', function (req, res) {
    var query = url.parse(req.url).query;
    if (query.name) {
      var users = User.findOne({name: query.name})
        .exec(function (err, data) {
          if (err) throw err;
          res.send(data);
        });
    } else {
      var users = User.find({})
        .exec(function (err, data) {
          if (err) throw err;
          res.send(data);
        });
    }
  });


  // Returns array of objects;
  // To access name, you'll need to 
  // access item.name (for item in data)
  app.get('/questions', function(req, res) {
    var questions = Question.find({})
      .populate('student')
      .populate('answeredBy')
      .exec(function(err, data){
        if(err) throw err;
        res.send(data);
      });
  });

  // questions (NOT answers) are posted via '/questions' route
  app.post('/questions', function(req, res) {
    var question = new Question({
      title: req.body.title,
      body: req.body.body,
      student: req.body.student,
      askQTime: req.body.askQTime,
      answeredBy: null,
      answer: null
    });

    // save the newly created model to Mongoose
    question.save(function (err, data) {
      if (err) throw err;
      question.populate('student', function (err, data) {
        if (err) throw err;
        res.send(201, data);
      });
    });
  });

  // answers are posted to pre-existing question models;
  // Lookup is done by ObjectId (use just the alphanumeric string
  // ie: '5555ad2...',   NOT   ObjectID('5555ad2....') )
  app.post('/answer', function(req, res){
    // find the corresponding question by primary key
    Question.findOne( { _id : req.body._id }, function(err, question){
      if(err) throw err;
      question.answeredBy = req.body.answeredBy;
      question.answer = req.body.answer;
      question.save(function (err, data) {
        if (err) throw err;
        question.populate('answeredBy', function (err, populatedData) {
          if (err) throw err;
          res.send(201, populatedData);
        });
      });
      // TODO: come back and redirect
    });
  });

  // SOCKET EVENT LISTENERS

  // New client connection
  io.on('connection', function (socket) {
  // This code replaces the post request handler
  // It saves the question to the db but the auto-updating is buggy
  //   // New question asked
  //   socket.on('new-question', function (asked) {
  //     var question = new Question({
  //       title: asked.title,
  //       body: asked.body,
  //       student: asked.student,
  //       answeredBy: null,
  //       answer: null
  //     });

  //     // save the newly created model to Mongoose
  //     question.save(function(err, data){
  //       if (err) throw err;
  //       io.emit('new-question', asked);
  //     });
  //   })

    // This version works alongside a post request handler
    // It merely passes the question along without touching the db
    socket.on('new-question', function (asked) {
      io.emit('new-question', asked);
    });
    
    socket.on('answered-question', function (answered) {
      io.emit('answered-question', answered);
    });
  });

 // userRoutes

   // app === userRouter injected from middlware.js

  app.post('/signin', userController.signin);
  app.post('/signup', userController.signup);
  app.get('/signedin', userController.checkAuth);

}

