const mongoose = require('mongoose');
// mongoose.connect('STRING')

const {connection, Schema} = mongoose;
const RoomSchema = new Schema({
    roomID:String,
    usercreated:String,
    messages:[String]
})

const  Roomdetails= mongoose.model('chatapproom',RoomSchema);

module.exports = Roomdetails;
