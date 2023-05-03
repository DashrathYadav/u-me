'use strict'

const pageURL = window.location.href;
const url = new URL(pageURL);
const roomId = url.searchParams.get('roomId');
if (!roomId) {
    window.location.assign('index.html');
}
// console.log(roomId);
// console.log(typeof (roomId))


const APP_ID = ""
const user_id = (Math.floor(Math.random() * 1000000)).toString();
// console.log(user_id, typeof (user_id));
let client;
let token;
let channel;
var peer;
let dataChannel;
var list = [];
let MemberId;

const Quality_constraint={
    video:{
        width:{min:320,ideal:1920,max:1920},
        height:{ min:240,ideal:1080,max:1080}
    },
    audio:true
}
// ------------------ video glob variable
const camera = document.getElementById("mycamera_icon")
const mic = document.getElementById("mic_icon")
const audio = document.getElementById("audio_icon")
let stream;
const video = document.getElementById("user-1")
const video2 = document.getElementById("user-2");
video2.classList.add("hide")
video2.classList.remove("smallFrame");

// --------------------------


// const iceconfig = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
let iceconfig = {
    iceServers: [
      {urls: 'stun:stun.l.google.com:19302'},
    ]
}
//     sdpSemantics: 'unified-plan',
//     video: {
//       codec: 'H265',
//       bitrate: 1000, // Set the desired bitrate in kbps
//       width: 1280,
//       height: 720,
//       framerate: 30,
//       parameters: {
//         'profile-level-id': '42e01f', // Set the desired profile level ID
//         'level-asymmetry-allowed': 1,
//         'packetization-mode': 1
//       }
//     }
//   };
  
//   let peerConnection = new RTCPeerConnection(configuration);
  
  
//   let pc = new RTCPeerConnection(configuration);
  
//   let pc = new RTCPeerConnection(config);
  

//retur stream     sets video stream of user and  return stream
async function inputStream() {
   
    // stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    stream = await navigator.mediaDevices.getUserMedia(Quality_constraint)
    
    video.srcObject = stream
    video.muted=true;
    return stream;
}

// return void   create Agora client instance and create channel
// handing mesages recived
async function clientAndChannelSetUp() {

    try {
        client = await AgoraRTM.createInstance(APP_ID);
        // console.log("reached here")
        await client.login({ uid: user_id, token });
        //127.0.0.1.//user_id?Room_no=123
        channel = await client.createChannel(roomId)
        await channel.join()


        // console.log('i am before error')
        // reciving message from peer 
        await client.on('MessageFromPeer', async function (message, peerId) {
            MemberId=peerId;
            // parsing recived message
            message = JSON.parse(message.text);
            // console.log(message);


            // if offer recived
            if (message.type === "offer") {
                peer.setRemoteDescription(message.offer);
                // console.log('remote offer ', message.offer);
                video.classList.add("smallFrame")
                video2.classList.remove("hide")
                await answerCall(peerId);
            }

            // if answer recived
            else if (message.type === "answer") {
                peer.setRemoteDescription(message.answer);
                // console.log('remote offer ', message.answer);
            }

            //if icecandidate recived
            else if (message.type === "icecandidate") {
                // let data=message.list
                // console.log("new candidates list arrived arrived")

                peer.addIceCandidate(message.icecandidate)
                // peer.addIceCandidate(message.iceCandidate);
            }
        });
    }
    catch{
        console.log("Error in chanel setup")
    }
    finally {

        console.log("client and channel setup done")
    }

}




//RTC event listners
async function rtcSetUp() {
    // console.log("rtcSetuP is called")
    dataChannel.onopen = (e) => {
        // console.log("connection oppen===============*******************==============================");
       
       
    }

    dataChannel.onmessage = (e) => {
        // console.log("new ice candidate recived");
        let temp = JSON.parse(e.data);
        // console.log("type is--> ", typeof (temp));

    }
    dataChannel.onclose = (e) => {
        // console.log("connection closed XXXXXXXXXXXXXXXXXXXXXXXXX")
    }

}




//handler function for sending offer
async function handelJoinUser(memberId) {

MemberId=memberId
    // console.log("new user find find fidnd-------===------------------")
    video.classList.add("smallFrame")
    video2.classList.remove("hide")

    dataChannel = peer.createDataChannel("userSandy");


   
    
    const offer = await peer.createOffer();

    peer.setLocalDescription(offer);

    const sdpLines = localDescription.sdp.split('\r\n');
let videoMLineIndex = -1;

sdpLines.forEach((line, index) => {
  if (line.startsWith('m=video')) {
    videoMLineIndex = index;
  }
});

if (videoMLineIndex === -1) {
  console.error('No video m-line found in SDP');
  return;
}

sdpLines.splice(videoMLineIndex + 1, 0, 'b=AS:5000');

const newSDP = sdpLines.join('\r\n');
await peerConnection.setLocalDescription(new RTCSessionDescription({
  type: localDescription.type,
  sdp: newSDP
}));

    // console.log("offer set");
    // console.log("my sdp ", offer);
    await client.sendMessageToPeer(
        {
            text: JSON.stringify({
                type: "offer",
                offer
            })
        }, memberId);

}


function handelLeftUser(memberId) {


    if(video2.muted==false)
    {
        toggleAudio();
    }
    audio.style.pointerEvents="none";
    // console.log("member left")

    video2.classList.add('hide')
    video.classList.remove("smallFrame");

}


// 
// creating offer
async function call() {


    const stream = await inputStream()

    peer = new RTCPeerConnection(iceconfig);

    peer.onicecandidate = async(event) => {
        if ((event.candidate !== null)) {
            // console.log("new candidates found");
            await client.sendMessageToPeer(
                {
                    text: JSON.stringify({
                        type: "icecandidate",
                        icecandidate:event.candidate
                    })
                }, MemberId);
        }
    }


    // rtcSetUp()


    stream.getTracks().forEach((track => {
        // console.log(track);
        peer.addTrack(track, stream);
    }))

    peer.addEventListener('track', (event) => {
        // console.log("here also Track  recived");
        const [remoteStream] = event.streams;
        // console.log(remoteStream)
        video2.srcObject = remoteStream;
        video2.muted=true;
        toggleAudio();
        audio.style.pointerEvents="auto";
        audio.addEventListener('click',toggleAudio)

    })

    //setting up client and channel
    await clientAndChannelSetUp();


    // handling  new joined member  by creating offer sending to it 
    // only called by user-1
    await channel.on('MemberJoined', handelJoinUser);
    // console.log("Member join event set")

    channel.on('MemberLeft', handelLeftUser);
}
call()



// creating answer 
//executed only by user 2
async function answerCall(peerId) {

    const answer = await peer.createAnswer();
    peer.setLocalDescription(answer);
    // console.log('answer set');
    // console.log("my sdp ", answer);
    client.sendMessageToPeer({
        text: JSON.stringify({
            type: "answer",
            answer,
        })
    }, peerId);

    
}


// --------------------------------------------Event listners on camera and microphone

function toggleCamera() {

    const tracks = stream.getTracks()
    // console.log(tracks)
    let videoTrack = tracks.find( (track) => {
        // console.log(track)
        if(track.kind==='video')
        return true;
    } )
    // console.log(videoTrack);
    // const camera_icon = document.getElementById("mycamera")
    
    if (videoTrack.enabled) {
        videoTrack.enabled = false;
        camera.style.background='rgb(255,80,80)';

    }
    else {
        videoTrack.enabled = true;
        camera.style.background="linear-gradient(45deg,rgb(109, 233, 109),green,rgb(75, 209, 75))";
    }


}

function toggleMic()
{
    const tracks = stream.getTracks()
    // console.log(tracks)
    let audioTrack = tracks.find( (track) => {
        // console.log(track)
        if(track.kind==='audio')
        return true;
    } )
    // console.log(audioTrack);
    
    if (audioTrack.enabled) {
        audioTrack.enabled = false;
        mic.style.background='rgb(255,80,80)';

    }
    else {
        audioTrack.enabled = true;
        mic.style.background="linear-gradient(45deg,rgb(109, 233, 109),green,rgb(75, 209, 75))";
    }
}


function toggleAudio()
{
    // vid.muted = true;
  
    if(video2.muted===true)
    {
        video2.muted=false;
        // console.log("audio status is muted ", video2.muted)
        audio.style.background="linear-gradient(45deg,rgb(109, 233, 109),green,rgb(75, 209, 75))";
    }
    else{
        video2.muted=true;
        // console.log("audio status is  muted ", video2.muted)
        audio.style.background='rgb(255,80,80)';
    }
}

function toggleVideo1()
{

    if(video2.classList.contains("hide"))
    return;



    if(video.classList.contains("smallFrame"))
    {
        video.classList.remove("smallFrame")
        video2.classList.add("smallFrame")
        // console.log("video2 in small frame")
        return
    }
  

    
}


function toggleVideo2()
{

    if(video2.classList.contains("hide"))
    return;


    if(video2.classList.contains("smallFrame"))
    {
        
        video2.classList.remove("smallFrame")
        video.classList.add("smallFrame")
        // console.log("video1 in small frame")
        return

    }
    

    
}



 

camera.addEventListener('click', toggleCamera);
mic.addEventListener('click', toggleMic);
video.addEventListener('click',toggleVideo1);
video2.addEventListener('click',toggleVideo2);


window.addEventListener('beforeunload', async () => {

    await channel.leave();
    await channel.logout();

})