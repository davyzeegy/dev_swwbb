const websocket = new WebSocket("ws://192.168.178.63:3000");

websocket.onmessage = (event) => { //wanener er een bericht van de andere persoon binnen komt via de websocket (gebeurd via de 'onmessage'  function)
    handleSignallingData(JSON.parse(event.data)) // we parsen hier een JSON object waarin een member/propety "data" staat, en die hebben we nodig om te bepalen of we een answer of een candiate krijgen
}

function handleSignallingData(data){ // deze functie handlent de data af die hij van de websocket.onmessage in de paramater 'data' krijgt
    switch(data.type) {
        case "answer":
            peerConn.setRemoteDescription(data.answer)
            break
        case "candidate": 
            peerConn.addIceCandidate(data.candidate)
    }
}

let username //alvast globale variabele gemaakt om de naam die de caller gebruikt in op te slaan


function sendUsername() {  // deze functie word aangeroepen zodra de caller op de button "versturen" klikt

    username =  document.getElementById("gebruikersnaam-input").value // ingevoerde waarde word opgeslagen op de globale variabele
    sendData({ //globale functie SendData aangeroepen met als paramter een type 
        type: "store_user"
    })
}

function sendData(data) {  // deze functie schrijft de ingevoerde chatnaam naar data 
    data.username = username
    websocket.send(JSON.stringify(data))  //data word vertaald naar een string object en meegegeven aan de globale websocket variabele.
}

let localstream // alvast globale variabele waar je de stream zal opslaan
let peerConn // alvast een globale variabele, waar we de local stream gaan vastmaken, en wanneer iemand anders connects met deze peer dat word onze stream beschikbaar voor die persoon

function startCall() { // deze functie word aangeroepen zodra de caller op "Start gesprek" klikt
    document.getElementById("video-call-div")
    .style.display = "inline"  //in deze functie word de sectie video call div aangroepen 
      // in deze sectie word de style vernaderd naar inline

    navigator.getUserMedia({ //deze functie handelt onder andere de permissions af zoals "mag ik je microphone en camera gebruiken"
        video: {
            frameRate: 24,
            width: {
            min: 480, ideal: 720, max: 1280
               
            },
            aspectRatio: 1.33333
        }, 
        
        audio: true

        
    }, (stream) => { // de getUserMedia functie return een stream die je uiteindelijk in de local-video element wilt plaatsen
        localstream = stream
        document.getElementById("local-video").srcObject = localstream

        let configuration ={
            iceServers: [ //array's
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
            .srcObject = e.stream // met e.stream kunnen we de stream 'uitpakken', en we willen het dus laten zien in de remote video element. Met de srcObject kun je het dus iets anders op dat object toewijzen.
        }
        

        peerConn.onicecandidate = ((e) =>{ //deze onicecandidate word meerdere keren aangeroepen
        if (e.candidate == null)
            return //return niks
        
        sendData({ //on succes zal de kandidate naar de andere persoon worden verstuurd en daarvoor moet e.e.a worden opgeslagen zie type
            type: "store_candidate", 
            candidate: e.candidate
        })
        
    })
        
            createAndSendOffer() // deze offer zal worden opgeslagen op de socketServer, en wanneer iemand ermee probeer te connecten met ons zal de server onze offer naar die persoon sturen en het antwoord van die persoon ontvangen en vervolgens het antwoord aan ons terug geven, en dat antwoord gaan we opslaan in de Peerconnection 

    },(error) => { // als de functie een eroor returned
        console.log(error)
    }
    )

}

function createAndSendOffer(){ //zie implementatie functie voor beschrijving
    peerConn.createOffer((offer) =>{ //returned een promise genaamd 'offer'. Zodra de offer word gecreeerd zal de peer de ICE kandidaten verzamelen, die kandidaten moeten naar de server gestuurd worden en de server zal het versturen naar de persoon die met ons probeert te connecten, en door de kandiaat te gebruiken kunnen we de verbinding gebruiken
    console.log("in send data offer: ", offer)
    sendData({  //de offer word hiermee naar de server gestuurd
        type: "store_offer",
        offer: offer
        //sdp: PeerConn.localDescription
    }) 

    //console.log("en de offer die we versturen is: ", sdp)
    
    peerConn.setLocalDescription(offer) // de local descriptor word hiermee geset
}, (error) => { //callback parameter voor het geval er erorrs optreden bij het creeren van de error
    console.log(error)
    })
}

let isAudio = true
function muteAudio() {
    isAudio = !isAudio

    localstream.getAudioTracks()[0].enabled = isAudio
}

let isVideo = true
function muteVideo() {
    isVideo = !isVideo

    localstream.getVideoTracks()[0].enabled = isVideo
}