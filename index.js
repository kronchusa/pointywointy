const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io")
const io = new Server(server)

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
});

let users = {}
let showVotes = true

io.on('connection', (socket) => {
    console.log('New Person connected');
    users[socket.client.id] = {name: "New Person", points: -1, hp: 25}
    io.emit('change users', {
        users: users,
        showVotes: showVotes,
    })

    socket.on('name change', (name) => {
        users[socket.client.id] = {...users[socket.client.id], name: name}
        io.emit('change users', {
            users: users,
            showVotes: showVotes,
        })
    })

    socket.on('hp change', hp => {
        users[socket.client.id] = {...users[socket.client.id], hp: hp}
        io.emit('change users', {
            users: users,
            showVotes: showVotes,
        })
    })

    socket.on('points', (pts) => {
        if(!showVotes) {
            users[socket.client.id] = {...users[socket.client.id], points: pts}
            io.emit('change users', {
                users: users,
                showVotes: showVotes,
            })
        } 
    })

    socket.on('clear votes', () => {
        for(const [u_id, user] of Object.entries(users)) {
            users[u_id] = {...user, points: -1}
        }
        io.emit('change users', {
            users: users,
            showVotes: showVotes,
        })
    })

    socket.on('show hide', () => {
        if(showVotes) {
            showVotes = false
        } else {
            showVotes = true
        }
        io.emit('change users', {
            users: users,
            showVotes: showVotes,
        })
    })

    socket.on('disconnect', () => {
        io.emit('remove id', {
            id: socket.client.id,
        })
        console.log(`${users[socket.client.id]} disconnected`);
        delete users[socket.client.id]
        io.emit('change users', {
            users: users,
            showVotes: showVotes,
        })
      });

      socket.on('potato', u_id => {
          io.emit('user potatoed', {
              potatoed_by: socket.client.id,
              potatoed: u_id,
          })
          users[u_id].hp -= 1
          io.emit('change users', {
              users: users,
              showVotes: showVotes,
          })
      })
  });
  
let port = process.env.PORT || 80

server.listen(port, () => {
  console.log('listening on *:3000');
});