'use strict'
// import AgoraRTM from './agora-rtm-sdk-1.5.1'

const APP_ID = '37d72934083d487abdcb43cdddc5259d'
const user_id = (Math.floor(Math.random() * 1000000)).toString();
console.log(user_id, typeof (user_id));
let client;
let token;
let channel;
var peer;
let dataChannel;
var list = [];
const video2 = document.getElementById("user-2");

const iceconfig = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }


//retur stream     sets video stream of user and  return stream
async function inputStream() {
    const video = document.getElementById("user-1");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    video.srcObject = stream;
    return stream;
}

// return void   create Agora client instance and create channel
// handing mesages recived
async function clientAndChannelSetUp() {

    try {
        client = await AgoraRTM.createInstance(APP_ID);
        console.log("reached here")
        await client.login({ uid: user_id, token });
        //127.0.0.1.//user_id?Room_no=123
        channel = await client.createChannel('userSandy')
        await channel.join()


        console.log('i am before error')
        // reciving message from peer 
        await client.on('MessageFromPeer', async function (message, peerId) {

            // parsing recived message
            message = JSON.parse(message.text);
            console.log(message);


            // if offer recived
            if (message.type === "offer") {
                peer.setRemoteDescription(message.offer);
                console.log('remote offer ', message.offer);
                await answerCall(peerId);
            }

            // if answer recived
            else if (message.type === "answer") {
                peer.setRemoteDescription(message.answer);
                console.log('remote offer ', message.answer);
            }

            //if icecandidate recived
            else if(message.type==="iceCandicate")
            {
                // let data=message.list
                console.log("new candidates list arrived arrived")
                
                message.list.forEach( iceCandidate=>{
                    peer.addIceCandidate(iceCandidate);
                    // console.log(iceCandidate)
                })
                // peer.addIceCandidate(message.iceCandidate);
            }
        });
    }
finally {

    console.log("client and channel setup done")
}

}




//RTC event listners
async function rtcSetUp() {
    console.log("rtcSetuP is called")
    dataChannel.onopen = (e) => {
        console.log("connection oppen===============*******************==============================");
        dataChannel.send(JSON.stringify(list));
    }

    dataChannel.onmessage = (e) => {
        console.log("new ice candidate recived");
        let temp = JSON.parse(e.data);
        console.log("type is--> ", typeof (temp));

    }
    dataChannel.onclose = (e) => {
        console.log("connection closed XXXXXXXXXXXXXXXXXXXXXXXXX")
    }



}




//handler function for sending offer
async function handelJoinUser(memberId) {

    console.log("new user find find fidnd-------===------------------")

    dataChannel = peer.createDataChannel("userSandy");
     await rtcSetUp()
    const offer = await peer.createOffer();
    peer.setLocalDescription(offer);
    console.log("offer set");
    console.log("my sdp ", offer);
    await client.sendMessageToPeer(
        {
            text: JSON.stringify({
                type: "offer",
                offer
            })
        }, memberId);

    setTimeout( ()=>{
        console.log("sender sending icecandidate list to peer");
        client.sendMessageToPeer({text:JSON.stringify({type:"iceCandicate",list})},memberId);
    },2000)





}

// 
// creating offer
async function call() {


    const stream = await inputStream()

    peer = new RTCPeerConnection(iceconfig);


    peer.onicecandidate = (event) => {
        // console.log("ice candidate event")
        if ((event.candidate !== null)) {
            console.log("new candidates found");

            // console.log(event.candidate);
           
            list.push(event.candidate);
        }
    }




    stream.getTracks().forEach((track => {
        console.log(track);
        peer.addTrack(track, stream);
    }))

    peer.addEventListener('track', (event) => {

        console.log("here also Track  recived");

        const [remoteStream] = event.streams;
        console.log(remoteStream)

       

        video2.srcObject = remoteStream;

    })


    //setting up client and channel
    await clientAndChannelSetUp();


    // handling  new joined member  by creating offer sending to it 
    // only called by user-1
    await channel.on('MemberJoined', handelJoinUser);
    console.log("Member join event set")
}
call()



// creating answer 
//executed only by user 2
async function answerCall(peerId) {


    peer.ondatachannel = async (e) => {
        dataChannel = e.channel;
         await rtcSetUp();
    }

    const answer = await peer.createAnswer();
    peer.setLocalDescription(answer);
    console.log('answer set');
    console.log("my sdp ", answer);
    client.sendMessageToPeer({
        text: JSON.stringify({
            type: "answer",
            answer,
        })
    }, peerId);

    setTimeout( ()=>{
        console.log("reciver icecandidate list to peer");
        client.sendMessageToPeer({text:JSON.stringify({type:"iceCandicate",list})},peerId);
    },2000)
}

