const {ExpressPeerServer} = require("peer");
const app = require('express')();
const morgan = require('morgan');
const server = require('http').Server(app);
const io = require('socket.io')(server,{
    cors: '*'
});

const cors = require('cors');
const peerServer = ExpressPeerServer(server,{
    debug: true
})
app.use(cors());
app.use('/peerjs',peerServer);
app.use(morgan('dev'));

io.on('connection',socket=>{
    socket.on('create-room',new_roomid => {
        socket.join(new_roomid);
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
            }else{
                socket.emit('error','invalid_id');
            }
        }else{
            socket.emit('error','invalid_id');
        }
    });
});

server.listen(3000);