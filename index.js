const express = require('express');
const app = express();
app.set('view engine', 'pug')
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io")
const io = new Server(server)

app.get('/', (req, res) => {
  res.render('index', {title: `Pointy Wointy Room #${req.query.room}`})
});

let users = {}
let showVotes = true

io.on('connection', (socket) => {
    const room = socket.handshake.headers.referer.split("room=")[1] || 0
    const client_id = socket.client.id
    socket.join(room)
    console.log(`New Person connected to room ${room}`)
    if(!(room in users)){
        users[room] = {}
    }
    users[room][client_id] = {name: "New Person", points: -1, hp: 25, room: room}
    
    io.to(room).emit('change users', {
        users: users[room],
        showVotes: showVotes,
    })

    socket.on('name change', (name) => {
        users[room][socket.client.id] = {...users[room][socket.client.id], name: name}
        io.to(room).emit('change users', {
            users: users[room],
            showVotes: showVotes,
        })
    })

    socket.on('hp change', hp => {
        users[room][socket.client.id] = {...users[room][socket.client.id], hp: hp}
        io.to(room).emit('change users', {
            users: users[room],
            showVotes: showVotes,
        })
    })

    socket.on('points', (pts) => {
        if(!showVotes) {
            users[room][socket.client.id] = {...users[room][socket.client.id], points: pts}
            io.to(room).emit('change users', {
                users: users[room],
                showVotes: showVotes,
            })
        } 
    })

    socket.on('clear votes', () => {
        for(const [u_id, user] of Object.entries(users[room])) {
            users[room][u_id] = {...user, points: -1}
        }
        io.to(room).emit('change users', {
            users: users[room],
            showVotes: showVotes,
        })
    })

    socket.on('show hide', () => {
        if(showVotes) {
            showVotes = false
        } else {
            showVotes = true
        }
        io.to(room).emit('change users', {
            users: users[room],
            showVotes: showVotes,
        })
    })

    socket.on('disconnect', () => {
        io.to(room).emit('remove id', {
            id: socket.client.id,
        })
        console.log(`${users[socket.client.id]} disconnected`);
        delete users[room][socket.client.id]
        io.to(room).emit('change users', {
            users: users[room],
            showVotes: showVotes,
        })
      });

      socket.on('potato', u_id => {
          io.to(room).emit('user potatoed', {
              potatoed_by: socket.client.id,
              potatoed: u_id,
          })
          users[room][u_id].hp -= 1
          io.to(room).emit('change users', {
              users: users[room],
              showVotes: showVotes,
          })
      })
  });
  
let port = process.env.PORT || 80

server.listen(port, () => {
  console.log('listening on *:3000');
});