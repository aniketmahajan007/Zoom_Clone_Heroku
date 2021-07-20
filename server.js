const {ExpressPeerServer} = require("peer");
const app = require('express')();
const morgan = require('morgan');
const server = require('http').Server(app);
const io = require('socket.io')(server,{
    cors: '*'
});

const cors = require('cors');
const peerServer = ExpressPeerServer(server,{
    debug: true,
    allow_discovery: true,
})
app.use(cors());
app.use('/peerjs',peerServer);
app.use(morgan('dev'));
app.get('/',(req,res)=>{
    res.send('Heroku node working: '+process.env.PORT);
    console.log(process.env.PORT);
});

io.on('connection',socket=>{
    socket.on('create-room',(new_roomid, username) => {
        socket.join(new_roomid);
        socket.emit('client-msg',`${username}: has created room`);
    });
    socket.on('disconnect',()=>{
        socket.broadcast.emit('user-leave-broadcast',socket.id);
    })
    socket.on('join-room', Roomid=>{
        if(socket.adapter.rooms.get(Roomid) !== undefined){
            if(socket.adapter.rooms.get(Roomid).size === 1){
                let room_creater;
                socket.adapter.rooms.get(Roomid).forEach((value)=>{
                    room_creater = value;
                });
                socket.join(Roomid);
                socket.emit('join-allowed',room_creater);
                socket.to(room_creater).emit('join-user-id',socket.id);
               // socket.to(Roomid).emit('server-chat','')
            }else{
                socket.emit('error','invalid_id');
            }
        }else{
            socket.emit('error','invalid_id');
        }
    });
    socket.on('server-msg',(_roomid, username, msg) => {
        socket.to(_roomid).emit('client-msg',`${username}: ${msg}`);
    })
});

server.listen(process.env.PORT || 3000);