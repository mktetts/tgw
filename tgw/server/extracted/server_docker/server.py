import socketio
import eventlet
import os
from dotenv import load_dotenv

from eventlet import wsgi
from flask import Flask, jsonify
from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId
from bcrypt import hashpw, gensalt, checkpw
from flask_cors import CORS
load_dotenv()
# Create a Flask app
app = Flask(__name__)
CORS(app)
try:
    MONGO_URI = os.getenv("MONGO_URI")
    print(MONGO_URI)
    client = MongoClient(MONGO_URI)
    db = client["gamedatabase"]
    collection = db["users"]
    print("database connected")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    raise e


@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return (
                jsonify({"message": "Username and password are required", "status": 0}),
                201,
            )

        user = collection.find_one({"username": username})
        if user:
            if checkpw(password.encode("utf-8"), user["password"]):
                return jsonify({"message": "Login successful", "status": 1})
            else:
                return (
                    jsonify({"message": "Invalid username or password", "status": 0}),
                    201,
                )
        else:
            hashed_password = hashpw(password.encode("utf-8"), gensalt())
            collection.insert_one({"username": username, "password": hashed_password})
            return (
                jsonify(
                    {"message": "User registered and login successful", "status": 1}
                ),
                201,
            )
    except Exception as e:
        print(str(e))
        return jsonify({"message": str(e)}), 500

# Create a Socket.IO server with CORS allowed
sio = socketio.Server(cors_allowed_origins="*")
app.wsgi_app = socketio.WSGIApp(sio, app.wsgi_app)

# Store client information
clients = {}
# Store room information
rooms = {}

# Define event handlers
@sio.event
def connect(sid, environ):
    # print(f'Client {sid} connected')
    clients[sid] = {'id': sid, 'room': None}  # Default name
    # Emit the total clients information to all connected clients
    sio.emit('intitial-connect', {'id': sid}, to=sid)

@sio.event
def disconnect(sid):
    # print(f'Client {sid} disconnected')
    if sid in clients:
        room_id = clients[sid]['room']
        if room_id and room_id in rooms and sid in rooms[room_id]:
            del rooms[room_id][sid]
            sio.emit('room-update', list(rooms[room_id].values()), room=room_id)
        del clients[sid]

    # Emit the total clients information to all connected clients
    sio.emit('clients-total', list(clients.values()))

@sio.event
def store_client_info(sid, client_info):
    if sid in clients:
        print(f'Stored client info: {client_info}')
        clients[sid].update(client_info)
        sio.emit('clients-total', list(clients.values()))

@sio.event
def join_room(sid, room_id):
    if sid in clients:
        if clients[sid]['room']:
            # Leave the previous room if any
            previous_room = clients[sid]['room']
            if previous_room in rooms and sid in rooms[previous_room]:
                del rooms[previous_room][sid]
                sio.emit('room-update', list(rooms[previous_room].values()), room=previous_room)
                sio.leave_room(sid, previous_room)
        
        clients[sid]['room'] = room_id
        if room_id not in rooms:
            rooms[room_id] = {}
        rooms[room_id][sid] = clients[sid]
        sio.enter_room(sid, room_id)
        sio.emit('room-update', list(rooms[room_id].values()), room=room_id)

@sio.event
def message(sid, data):
    room_id = clients[sid]['room']
    if room_id:
        # print(f'Message from {sid} to room {room_id}: {data}')
        sio.emit('message', data, room=room_id)
    else:
        # print(f'Message from {sid} to all: {data}')
        sio.emit('message', data)

@sio.event
def private_message(sid, data):
    target_id = data['target_id']
    message = data['message']
    if target_id in clients:
        # print(f'Private message from {sid} to {target_id}: {message}')
        sio.emit('private_message', {'from': sid, 'message': message}, to=target_id)

@sio.event
def game_move(sid, data):
    target_id = data['target_id']
    message = data['message']
    if target_id in clients:
        # print(f'Private message from {sid} to {target_id}: {message}')
        sio.emit('game_move', {'from': sid, 'message': message}, to=target_id)

@sio.event
def exit_game(sid, data):
    target_id = data['target_id']
    message = data['message']
    if target_id in clients:
        # print(f'Private message from {sid} to {target_id}: {message}')
        sio.emit('exit_game', {'from': sid, 'message': message}, to=target_id)
# Run the server
if __name__ == '__main__':
    wsgi.server(eventlet.listen(('0.0.0.0', 3005)), app)
