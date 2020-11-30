const websocket = new WebSocket("ws://127.0.0.1:5000");

websocket.onmessage = (event) => {
    handleSignallingData(JSON.parse(event.data))
}

function handleSignallingData(data){
    switch(data.type) {
        case "answer":
            peerConnection.setRemoteDescription(data.answer)
            break
        case "candidate":
            peerConnection.addIceCandidate(data.candidate)
    }
}

let username //alvast globale variabele gemaakt om de naam die de caller gebruikt in op te slaan


function sendUsername() {  // deze functie word aangeroepen zodra de caller op de button "versturen" klikt

    username =  document.getElementById("gebruikersnaam-input").nodeValue // ingevoerde waarde word opgeslagen op de globale variabele
    sendData({ //globale functie SendData aangeroepen met als paramter een type 
        type: "store_user"
    })
}

function sendData(data) {  // deze functie schrijft de ingevoerde chatnaam naar data 
    data.username = username
    websocket.send(JSON.stringify(data))  //data word vertaald naar een string object en meegegeven aan de globale websocket variabele.
}

let localstream // alvast globale variabele waar je de stream zal opslaan
let peerConnection // alvast een globale variabele, waar we de local stream gaan vastmaken, en wanneer iemand anders connects met deze peer dat word onze stream beschikbaar voor die persoon

function startCall() { // deze functie word aangeroepen zodra de caller op "Start gesprek" klikt
    document.getElementById("video-call-div").style.display = "inline"  //in deze functie word de sectie video call div aangroepen 
      // in deze sectie word de style vernaderd naar inline

    navigator.getUserMedia({ //deze functie handelt onder andere de permissions af
        video: {
            frameRate: 24,
            width: {
                min: 480, ideal: 720, max: 1280
               
            },
            //aspectRatio: 1,33333
        }, 
        
        audio: true

        
    }, (stream) => { // de getUserMedia functie return een stream die je uiteindelijk in de local-video element wilt plaatsen
        localstream = stream
        document.getElementById("local-video").srcObject = localstream

        let configuration ={
            iceServers: [
                {
                    "urls":["stun:stun.l.google.com:19302",   //meerdere STUN servers aangemaakt vóór het geval een andere server met betere ICE kandidaten komt
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302"

                    ]

                    
                }
            ]
        }
        peerConnection = new RTCPeerConnection(configuration)  // deze functie is beschikbaar gemaakt door en voor de webRTC api, aan deze config geven we onze configuratie object mee
        peerConnection.addStream(localstream) // hier geven we onze localstream mee aan de RTCpeerconnection

        peerConnection.onaddstream = (e) => {  //zodra de peerConnection verbinding heeft met de andere kant, dan geeft ie een callback function
            document.getElementById("remote-video").srcObject = e.stream // met e.stream kunnen we de stream 'uitpakken', en we willen het dus laten zien in de remote video element
        }
        

        peerConnection.onicecandidate = ((e) =>{
        if (e.candidate == null)
            return
        
        sendData({
            type:"store_candidate",
            candidate: e.candidate
        })
        
    })
        
            createAndSendOffer()

    },(error) => { // als de functie een eroor returned
        console.log(error)
    }
    )

}

function createAndSendOffer(){
    peerConnection.createOffer((offer) =>{
    sendData({
        type:"store_offer",
        offer: offer
    })

    peerConnection.setLocalDescription(offer)
}, (error) => {
    console.log(error)
    })
}