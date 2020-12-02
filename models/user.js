const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://roshil:roshil@cluster0-lp9kw.gcp.mongodb.net/CHATAPP?retryWrites=true&w=majority')

const {connection, Schema} = mongoose;

const UserSchema = new Schema({
    username:String,
    password:String,
    firstname:String,
    lastname:String,
})

const User = mongoose.model('chatappusers',UserSchema);

module.exports = User;
