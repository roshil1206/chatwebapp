const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT,()=>console.log(`Server is Running on Port: ${PORT}`));
const Users = require('./models/user');
const Roomdetails = require('./models/chatroom');
const crypto = require('crypto');
const session = require('express-session');
const socket = require('socket.io');
const io = socket(server);



app.use(express.urlencoded());
app.set('view engine','ejs');
app.use(session({
    secret:'this is the secret',saveUninitialized: true,resave: true
}))



//Session Variable

var sess;
let namespace;


// / Request


app.get('/',(req,res)=>{
    sess=req.session;
    if(sess.uname)
    {
       
        res.render('pages/home',{firstname:sess.uname});
    }
    else{
    res.render('pages/login')
    }
})


//Get Signup Request



app.get('/signup',(req,res)=>{
    res.render('pages/signup');
})



//Post Signup Request



app.post('/signup',async (req,res)=>{
    const {username,password,repassword,firstname,lastname} = req.body;
    let errors=[];

    if(!username || !password || !repassword || !firstname || !lastname)
    {
        errors.push({msg:'Please Fill all the Details'})
    }
    
    if(password!= repassword )
    {
        errors.push({msg:'Password Do not Match'})
    }

    if(username.length < 3)
    { 
        errors.push({msg:'Username must be more than 3 characters'})
    }

    if(errors.length>0){
        res.render('pages/signup',{errors})
        
    }



    else{

        const user = await new Users({username,password:encrypt(password),firstname,lastname});
        await user.save();
        res.render('pages/login');
    }
})



//HOME PAGE


app.post('/home',async (req,res)=>{
sess=req.session;
    if(sess.roomalreadyexist)
    {
        res.render('pages/home',{firstname:sess.uname,msgcnotfound:'Chatroom already Exists'});
        

    }
    else if(sess.echatnotfound)
    {
        res.render('pages/home',{firstname:sess.uname,msgcnotfound:'No Chatroom found'});
    }
    else if(sess.room)
    {
        res.render('pages/home',{firstname:sess.uname,msgsuccess:'Successfully created the chatroom'});
    }
else{
    const {username,password} = req.body;
try{
    const user = await Users.findOne({username});
    if(decrypt(user.password)===password)
    {   
        sess=req.session;
        sess.uname=username;
        sess.user = user;
        res.render('pages/home',{firstname:username});
    }
}
catch(error)
{
    console.log(error.message);
}
}

//CHAT PAGE
app.post('/chat',async(req,res)=>{
    sess=req.session;
    
    const {chatroomid} = req.body;
    
    const room =  await Roomdetails.findOne({roomID:chatroomid});
    if(!room){
        sess.echatnotfound=true; 
        res.redirect(307,'/home');  
  }

  else{
        sess.room=room;
      res.render('pages/chat',{nameofuser:sess.user.firstname + ' ' + sess.user.lastname,username:sess.uname,roomID:sess.room.roomID});
      namespace = '/'+sess.room.roomID; 
      let nsp= io.of(namespace);

      nsp.on('connection',(socket)=>{
          console.log(`User connected on NSP ${namespace}`);
          socket.on('messagesent',(data)=>{
             nsp.emit('mess',{message:data.message,name:data.nameofuser,username:sess.uname});
          })
      
      
      })
    }


})
})





//SOCKET HANDLING



let users = [];


   


// io.on('connection',(socket)=>{
//     console.log('1')
//     let username;
//     const nsp = io.of(namespace);
// nsp.on('connection',(socket)=>{
//     console.log('2')
//     console.log(namespace);
//     console.log(`Someone Connected on ${namespace}`);

//      socket.on('userconnected',(data)=>{
//         console.log('3')
//         users.push(data.username);
//         username=data.username;
//         nsp.emit('newuser',{users});
//         console.log('A user connected' , users);
//     })
    
    
//     socket.on('messagesent',(data)=>{
//         console.log(4);
//         console.log(data.message,data.nameofuser, 'recieved');
//         nsp.emit('mess',{message:data.message,name:data.nameofuser,username})
//     })
// })
   

//     socket.on('disconnect',()=>{
//             users.splice(users.indexOf(username),1);
//             io.sockets.emit('newuser',{users});
//     })
// })





// CREATE CHATROOM
app.post('/createchatroom',async (req,res)=>{
    sess=req.session;
    const uname = sess.uname;
    const {chatroomID} = req.body;
    const temp = await Roomdetails.findOne({roomID:chatroomID});
    
    if(!temp)
    {
        const room = await Roomdetails({roomID:chatroomID,usercreated:uname});
    
        await room.save();
        sess.room = room;
        sess.roomalreadyexist=false;
        res.redirect(307,'/home');
    }
    else{
        sess.roomalreadyexist=true;
        res.redirect(307,'/home');
    }
   
})




//ENCRYPTION AND DECRYPTION FUNCTIONS
function encrypt(data){
    const cipher = crypto.createCipher('aes192','Roshil');
    let encrypted = cipher.update(data,'utf-8','hex');
    encrypted+=cipher.final('hex');
    return(encrypted);
}

function decrypt(data)
{
    const decipher = crypto.createDecipher('aes192','Roshil');
    let decrypted = decipher.update(data,'hex','utf-8')
    decrypted+=decipher.final('utf-8');
    return(decrypted);
}