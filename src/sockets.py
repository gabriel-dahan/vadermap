from src import __app__

from flask_socketio import SocketIO, emit

# SOCKET
socket = SocketIO(__app__)

@socket.on('online')
def online(data):
    emit('status_change', {'username': data['username'], 'status': 'online'}, broadcast = True)

@socket.on('offline')
def offline(data):
    emit('status_change', {'username': data['username'], 'status': 'offline'}, broadcast = True)