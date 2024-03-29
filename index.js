const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

mongoose.connect(process.env.MONGO_URI);

//Create User Schema
var userSchema = new mongoose.Schema({
  username:{
    type: String,
    unique: true,
  },
});

//Create user model
var User = mongoose.model('User',userSchema);
 
//Create Exercise Schema
var exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: String,
  userID: String,
});

//Create Exercise model
var Exercise = mongoose.model('Exercise',exerciseSchema);

//Delete all entries for clean start
const refreshDB =  async function(){
  await User.deleteMany({});
  await Exercise.deleteMany({});
}

refreshDB();

//Create a POST for new users
app.post('/api/users',async function(req,res){
  var new_user = new User({username: req.body.username});
  await new_user.save();

  var user_details = await User.findOne({username: req.body.username},'username _id').exec();
  res.json({username: user_details.username,_id: user_details._id});
});

//Create a get request to obtain all users
app.get('/api/users',async function(req,res){
  //query the Users model for all users
  var all_users = await User.find({},'_id username');
  
  all_users = all_users.map((elem)=>({username: elem.username,_id: elem._id.toString()}))
  
  res.send(all_users);
});

//Create a POST for new exercises
app.post('/api/users/:_id/exercises',async function(req,res){
  //If null date is input then assign today's date
  if(typeof req.body.date === 'undefined'){
    var date_input = new Date().toISOString().substring(0,10);
    var date_output = new Date().toDateString();

  }else{
    var date_input = new Date(req.body.date).toISOString().substring(0,10);
    var date_output = new Date(req.body.date).toDateString();
  }

  //Create new exercise entry
  var new_exercise = new Exercise({description: req.body.description, 
    date: date_input, duration: Number(req.body.duration), userID: req.params._id});
  await new_exercise.save();

  var user_details = await User.findById(req.params._id,'username _id').exec();
  
  //TODO: make sure the date returned is 2 digits for the day

  //Return the response
  res.json({username: user_details.username,description: req.body.description,
    duration: Number(req.body.duration), _id: user_details._id.toString(),date: date_output});
});

//Create a GET response for logs given a user
app.get('/api/users/:_id/logs',async function(req,res){
  var get_username = await User.findById(req.params._id,'username').exec();
  
  //Check for the existence of optional parameters from and to and perform the query in each case
  var query_exercises = Exercise.find({userID: req.params._id},'description duration date');
  if(typeof req.query.from!=='undefined'&typeof req.query.to === 'undefined'){
    query_exercises = query_exercises.find({date: {$gte: req.query.from}});
  }else if(typeof req.query.from==='undefined'&typeof req.query.to !== 'undefined'){
    query_exercises = query_exercises.find({date: {$lte: req.query.to}});
  }else if(typeof req.query.from !== 'undefined'&typeof req.query.to !== 'undefined'){
    query_exercises = query_exercises.find({date: {$gte: req.query.from,
      $lte: req.query.to}});
  }

  //Check for existence of optional parameter limit and limit results if exists
  if(typeof req.query.limit!=='undefined'){
    query_exercises = query_exercises.limit(req.query.limit)
  }
  
  var get_exercises = await query_exercises.exec();
  
  get_exercises = get_exercises.map((elem)=>({description: elem.description,duration: elem.duration,date: new Date(elem.date).toDateString()}))

  var get_count = get_exercises.length;
  //Send logs as response
  res.json({username: get_username.username,count: get_count,_id: req.params._id,log: get_exercises})
})