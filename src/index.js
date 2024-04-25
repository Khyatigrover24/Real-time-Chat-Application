const express=require("express");
const http=require("http");
const path=require("path");
const { ppid } = require("process");
const socketio=require("socket.io");
const Filter=require("bad-words");
const {generatemessage,generatelocationmessage }=require("./utils/messages");
const {addUser,removeUser,getUser,getUserInRoom}=require("./utils/users");

const app=express();
const server=http.createServer(app);
const io=socketio(server);


const port=process.env.PORT || 3000;
const publicDirectoryPath =path.join(__dirname,'../public');
app.use(express.static(publicDirectoryPath));



io.on("connection",(socket)=>{
    console.log("New web socket connection");
    socket.on('join',(options,callback)=>{
        const {error,user}=addUser({id:socket.id,...options});
        if(error){
            return callback(error)

        }


        socket.join(user.room)
        socket.emit("message",generatemessage("Admin","Welcome!"));
        socket.broadcast.to(user.room).emit("message",generatemessage("Admin",`${user.username} has joined`));
        io.to(user.room).emit('roomdata',{
            room:user.room,
            users:getUserInRoom(user.room),
        })
        callback()

    })
    socket.on("sendMessage",(message,callback)=>{
        const user=getUser(socket.id);
        const filter=new Filter();
        if(filter.isProfane(message)){
            return callback("Profanity is not allowed");
        }


        io.to(user.room).emit("message",generatemessage(user.username,message));
        callback("Delivered");

    })
    socket.on("disconnect",()=>{
        const user=removeUser(socket.id);
        if(user){
            io.to(user.room).emit("message",generatemessage("Admin",`${user.username} has left`));
            io.to(user.room).emit('roomdata',{
                room:user.room,
                users:getUserInRoom(user.room),
            })
        }
    })

    socket.on("sendLocation",(coords,callback)=>{
        const user=getUser(socket.id);
        io.to(user.room).emit("locationmessage",generatelocationmessage(user.username,"https://google.com/maps?q=${coords.latitude}${coords.longitude"));
        callback();

    })

})

server.listen(port,()=>{
    console.log(`server is listening at ${port}`);
})