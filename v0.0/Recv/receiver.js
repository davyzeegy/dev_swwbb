const websocket = new WebSocket("ws://192.168.178.63:3000");

websocket.onmessage = (event) => {
    console.log("call back is: " ,event)
    handleSignallingData(JSON.parse(event.data))
}

function handleSignallingData(data) {
    console.log("handle signalling data")
    switch(data.type) {
        case "offer":
           console.log("dit moet de data offer zijn: ", data.offer)
            peerConn.setRemoteDescription(data.offer)
            createAndSendAnswer()
            break
        case "candidate":
            console.log("caandidate")
            peerConn.addIceCandidate(data.candidate)
    }
}

function createAndSendAnswer() {
    peerConn.createAnswer((answer) => { //return a promise with an answer
        peerConn.setLocalDescription(answer)
        sendData({ // we gaan het antwoord naar de server sturen
            type: "send_answer",
            answer: answer

        })
    }, error => {
        console.log(error)
     })

}


function sendData(data) {  // deze functie schrijft de ingevoerde chatnaam naar data 
    data.username = username
    websocket.send(JSON.stringify(data))  //data word vertaald naar een string object en meegegeven aan de globale websocket variabele.
}

let localstream // alvast globale variabele waar je de stream zal opslaan
let peerConn // alvast een globale variabele, waar we de local stream gaan vastmaken, en wanneer iemand anders connects met deze peer dat word onze stream beschikbaar voor die persoon
let username //alvast globale variabele gemaakt om de naam die de caller gebruikt in op te slaan

function joinCall() { // deze functie word aangeroepen zodra de caller op "Deelnemen aan gesprek" klikt

username = document.getElementById("gebruikersnaam-input").value

document.getElementById("video-call-div")
.style.display = "inline"  //in deze functie word de sectie video call div aangroepen 
      // in deze sectie word de style vernaderd naar inline

    navigator.getUserMedia({ //deze functie handelt onder andere de permissions af
        video: {
            frameRate: 24,
            width: {
            min: 480, ideal: 720, max: 1280
               
            },
            aspectRatio: 1.33333
        }, 
        
        audio: true

        
    }, (stream) => { // de getUserMedia functie return een callback function (als 2e parameter) stream die je uiteindelijk in de local-video element wilt plaatsen
        localstream = stream
        document.getElementById("local-video").srcObject = localstream

        let configuration ={
            iceServers: [
                {
                    "urls":["stun:stun.l.google.com:19302",   //meerdere STUN servers aangemaakt vóór het geval een andere server met betere ICE kandidaten komt
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302"]
            

                    
                }
            ]
        }
        peerConn = new RTCPeerConnection(configuration)  // deze functie is beschikbaar gemaakt door en voor de webRTC api, aan deze config geven we onze configuratie object mee
        peerConn.addStream(localstream) // hier geven we onze localstream mee aan de RTCpeerconnection

        peerConn.onaddstream = (e) => {  //zodra de peerConnection verbinding heeft met de andere kant, dan geeft ie een callback function
            document.getElementById("remote-video")
            .srcObject = e.stream // met e.stream kunnen we de stream 'uitpakken', en we willen het dus laten zien in de remote video element
            console.log("video van andere partij moet zichtbaar zijn")
        }
        

        peerConn.onicecandidate = ((e) =>{
        if (e.candidate == null)
            return
        
        sendData({
            type:"send_candidate",
            candidate: e.candidate
        })
        
    })
        
    sendData({
        type: "join_call"
    })            

    },(error) => { // als de functie een eroor returned
        console.log(error)
    }
    )

}



let isAudio = true;
function muteAudio() {
    isAudio = !isAudio

    localstream.getAudioTracks()[0].enabled = isAudio
}

let isVideo = true
function muteVideo() {
    isVideo = !isVideo

    localstream.getVideoTracks()[0].enabled = isVideo
}

