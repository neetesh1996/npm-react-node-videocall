import React, { Component } from "react";

import io from "socket.io-client";

class App extends Component {
  constructor(props) {
    super(props);

    this.localVideoref = React.createRef();
    this.remoteVideoref = React.createRef();

    this.socket = null;
    this.candidates = [];
  }

  componentDidMount = () => {
    this.socket = io("https://brave-curie-67195.netlify.app", {
      path: "/webrtc",
      query: {},
    });

    this.socket.on("connection-success", (success) => {
      console.log(success);
    });

    this.socket.on("offerOrAnswer", (sdp) => {
      this.textref.value = JSON.stringify(sdp);

      // set sdp as remote description
      this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    this.socket.on("candidate", (candidate) => {
      this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    // const pc_config = null

    const pc_config = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    };

    // create an instance of RTCPeerConnection
    this.pc = new RTCPeerConnection(pc_config);

    // triggered when a new candidate is returned
    this.pc.onicecandidate = (e) => {
      // send the candidates to the remote peer
      // see addCandidate below to be triggered on the remote peer
      if (e.candidate) {
        this.sendToPeer("candidate", e.candidate);
      }
    };

    // triggered when there is a change in connection state
    this.pc.oniceconnectionstatechange = (e) => {
      console.log(e);
    };

    // triggered when a stream is added to pc, see below - this.pc.addStream(stream)
    this.pc.onaddstream = (e) => {
      this.remoteVideoref.current.srcObject = e.stream;
      console.log("stream" + e.stream);
    };

    // called when getUserMedia() successfully returns - see below

    const success = (stream) => {
      window.localStream = stream;
      this.localVideoref.current.srcObject = stream;
      this.pc.addStream(stream);
    };

    // called when getUserMedia() fails - see below
    const failure = (e) => {
      console.log("getUserMedia Error: ", e);
    };

    // see the above link for more constraint options
    const constraints = {
      audio: true,
      video: true,
      // video: {
      //   width: 1280,
      //   height: 720
      // },
      // video: {
      //   width: { min: 1280 },
      // }
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(success)
      .catch(failure);
  };

  sendToPeer = (messageType, payload) => {
    this.socket.emit(messageType, {
      socketID: this.socket.id,
      payload,
    });
  };

  /* ACTION METHODS FROM THE BUTTONS ON SCREEN */

  createOffer = () => {
    console.log("Offer");

    // initiates the creation of SDP
    this.pc.createOffer({ offerToReceiveVideo: 1 }).then((sdp) => {
      console.log("offer" + JSON.stringify(sdp));

      // set offer sdp as local description
      this.pc.setLocalDescription(sdp);

      this.sendToPeer("offerOrAnswer", sdp);
    });
  };

  // creates an SDP answer to an offer received from remote peer
  createAnswer = () => {
    console.log("Answer");
    this.pc.createAnswer({ offerToReceiveVideo: 1 }).then((sdp) => {
      console.log("anssdp" + JSON.stringify(sdp));

      // set answer sdp as local description
      this.pc.setLocalDescription(sdp);

      this.sendToPeer("offerOrAnswer", sdp);
    });
  };

  setRemoteDescription = () => {
    // retrieve and parse the SDP copied from the remote peer
    const desc = JSON.parse(this.textref.value);
    console.log("text" + desc);
    // set sdp as remote description
    this.pc.setRemoteDescription(new RTCSessionDescription(desc));
  };

  addCandidate = () => {
    // retrieve and parse the Candidate copied from the remote peer
    // const candidate = JSON.parse(this.textref.value)
    // console.log('Adding candidate:', candidate)

    // add the candidate to the peer connection
    // this.pc.addIceCandidate(new RTCIceCandidate(candidate))

    this.candidates.forEach((candidate) => {
      console.log("ice" + JSON.stringify(candidate));
      this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    });
  };

  render() {
    return (
      <div>
        <video
          style={{
            width: 480,
            height: 480,
            margin: 5,
            backgroundColor: "gray",
          }}
          ref={this.localVideoref}
          autoPlay
        ></video>
        <video
          style={{
            width: 480,
            height: 480,
            margin: 5,
            backgroundColor: "gray",
          }}
          ref={this.remoteVideoref}
          autoPlay
        ></video>
        <br />

        <button onClick={this.createOffer}>Start Call</button>
        <button onClick={this.createAnswer}>Accept Call</button>
        {/* <button onClick={this.onClose}>Close</button> */}
        <br />
        <textarea
          style={{ width: 0, height: 0 }}
          ref={(ref) => {
            this.textref = ref;
          }}
        />
      </div>
    );
  }
}

export default App;
