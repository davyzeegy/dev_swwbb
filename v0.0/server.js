const Socket = require("websocket").server
const http = require("http")
const poort = 3000
const server = http.createServer((req, res) => {})

server.listen(poort, () => {
    console.log("Listening on port ",poort)
})

const webSocket = new Socket({ httpServer: server})

let users = []

webSocket.on('request', (req)=> {
    const connection = req.accept()

    connection.on('message', (message) => {
        const data = JSON.parse(message.utf8Data)

        const user =  findUser(data.username)

        switch(data.type) {
            case "store_user":
                console.log("in store user") //weghalen als test geslaagd

                if (user != null){
                    //console.log("dit is niet goed, array moet leeg zijn")
                    return      
                }
                
                //console.log("dit is goed, array is leeg en word hierna gevuld")
                const newUser = {
                    conn: connection,
                    username: data.username
                }
                //console.log("Dit zijn de users: ",users) 
                users.push(newUser)
                console.log(newUser.username)
                break

            case "store_offer":
                //console.log(user)
                console.log("in store offer") //weghalen als test geslaagd
                if (user == null)
                console.log("77") 
                    return

                    console.log("heeft data aangeboden")
                user.offer = data.offer
                break

            case "store_candidate":
                console.log("in store candidate") //weghalen als test geslaagd
                //console.log(users)
                if (user == null) {
                    console.log("66")
                    return
                }
                if (user.candidates == null)
                    user.candidates = []

                user.candidates.push(data.candidate)
                break
            
                case "send_answer":
                    console.log("in send answer") //weghalen als test geslaagd
                if (user == null) {
                    return
                }

                sendData({
                    type: "answer",
                    answer: data.answer
                }, user.conn)
                break
            
            case "send_candidate":
                console.log("in send candidate") //weghalen als test geslaagd
                if (user == null) {
                    return
                }

                sendData({
                    type: "candidate",
                    candidate: data.candidate
                }, user.conn)
                break

            case "join_call":
                console.log("in join call") //weghalen als test geslaagd
                if (user == null) {
                    return
                }

                sendData({
                    type: "offer",
                    offer: user.offer
                }, connection)

                user.candidates.forEach(candidate => {
                    sendData({
                        type: "candidate",
                        candidate: candidate
                    }, connection)
                    
                })

                break

        }
    })

    connection.on('close', (reason, description) => { // we checken hier of de connectie is afgesloten
        users.forEach(user => {  // we gaan door de lijst met gebruikers heen 
            if (user.conn == connection){
                users.splice(users.indexOf(user), 1) //delete de elementen in de array
                return  
            }
        })
    })
})

function sendData(data, conn){
    conn.send(JSON.stringify(data))
}

function findUser (username){ //checken of niet de username niet 2 keer voorkomt 
    for (let i = 0;i < users.length;i++) {

        if (users[i].username == username) 
            return users[i]
        
    }

}