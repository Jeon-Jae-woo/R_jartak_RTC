let socket = io.connect();
let userVideo = document.getElementById("user-video"); // host
let peerVideo = document.getElementById("peer-video"); // peer
let roomName;
let creator = false;
let rtcPeerConnection;
let userStream;

// Contains the stun server URL we will be using.
let iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};
let temp = location.href.split("?");
roomName = temp[1];
console.log("roomName : " , roomName);
socket.emit("join", roomName);

// Triggered when a room is succesfully created.

socket.on("created", function () {
  console.log("char.created");
  creator = true;

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: { width: 1280, height: 720 },
    })
    .then(function (stream) {
      /* use the stream */
      userStream = stream;
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
    })
    .catch(function (err) {
      /* handle the error */
      alert("Couldn't Access User Media");
    });
});

// Triggered when a room is succesfully joined.

socket.on("joined", function () {
  console.log("char.joined");
  creator = false;

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: { width: 1280, height: 720 },
    })
    .then(function (stream) {
      /* use the stream */
      userStream = stream;
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
      socket.emit("ready", roomName);
    })
    .catch(function (err) {
      /* handle the error */
      alert("Couldn't Access User Media");
    });
});

// Triggered when a room is full (meaning has 2 people).

socket.on("full", function () {
  alert("Room is Full, Can't Join");
});

// Triggered when a peer has joined the room and ready to communicate.

socket.on("ready", function () {
  console.log("chat Ready");
  if (creator) {
    console.log("chat Ready creator");
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection
      .createOffer() // ??????????????? ????????? SDP ??????
      .then((offer) => {
        rtcPeerConnection.setLocalDescription(offer); // ?????? SDP ??????
        socket.emit("offer", offer, roomName); //offer??? ???????????? ????????? peer?????? ??????
      })

      .catch((error) => {
        console.log(error);
      });
  }
});

// Triggered on receiving an ice candidate from the peer.

socket.on("candidate", function (candidate) {
  console.log("chat candidate");
  let icecandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(icecandidate);
});

// Triggered on receiving an offer from the person who created the room.

socket.on("offer", function (offer) {
  console.log("chat offer");
  if (!creator) {
    console.log("chat offer not creator");
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction; //iceCandidate??? ????????? ????????? ??? ????????? endPoint ??????
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection.setRemoteDescription(offer); //?????? ?????? SDP??? ??????
    rtcPeerConnection
      .createAnswer() // ??? ??????????????? ?????? SDP ??????
      .then((answer) => {
        rtcPeerConnection.setLocalDescription(answer); // ?????? SDP ??????
        socket.emit("answer", answer, roomName);
      })
      .catch((error) => {
        console.log("errors");
        console.log(error);
      });
  }
});

// Triggered on receiving an answer from the person who joined the room.

socket.on("answer", function (answer) {
  console.log("chat answer");
  rtcPeerConnection.setRemoteDescription(answer); // peer??? ?????? ?????? ?????? SDP??? ??????
});

// Implementing the OnIceCandidateFunction which is part of the RTCPeerConnection Interface.

function OnIceCandidateFunction(event) {
  console.log("chat Candidate(OnIceCandidateFunction)");
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomName);
  }
}

// Implementing the OnTrackFunction which is part of the RTCPeerConnection Interface.

function OnTrackFunction(event) {
  console.log("onTrackFunction");
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = function (e) {
    peerVideo.play();
  };
}
