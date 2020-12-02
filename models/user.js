const mongoose = require('mongoose');
mongoose.connect('CONNECTION STRING')

const {connection, Schema} = mongoose;

const UserSchema = new Schema({
    username:String,
    password:String,
    firstname:String,
    lastname:String,
})

const User = mongoose.model('chatappusers',UserSchema);

module.exports = User;
