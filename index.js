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
  username: String,
  description: String,
  duration: Number,
  date: String,
  _id: String,
});

//Create Exercise model
var Exercise = mongoose.model('Exercise',exerciseSchema);

//Create Exercise Schema
var logSchema = new mongoose.Schema({
  username: String,
  count: Number,
  _id: String,
  log: [{
    description: String,
    duration: Number,
    date: String,
  }]
});

//Create Log model
var Log = mongoose.model('Exercise',exerciseSchema);

//Create a POST for new users
app.post('/api/users',async function(req,res){
  var new_user = new User({username: req.body.username});
  await new_user.save();

  var user_details = await User.findOne({username: req.body.username},'username _id').exec();
  res.json(user_details);
});