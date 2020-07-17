import connect from './db.js'
import auth from './auth.js'


//ma svaki hendler gdje zelimo da auth bude prisutna samo dodamo middleware auth.verify
let secret = async (req,res) => {

    res.json({message: 'ovo je tajna' + req.jwt.username})
}

let login = async (req,res) => {
    let user = req.body

    try{
        let result = await auth.authenticateUser(user.username, user.password)
        res.json(result)
    }
    catch(e){
        res.status(401).json({error: e.message})
    }
  
}

let users = async (req, res) => { 
    let user = req.body
    let id;
    let success = false;
    try{
        id = await auth.register(user);
        //console.log(id)
        success=true
    }
    catch(e){
        res.status(500).json({ error: e.message});
    }

    res.send(success);
    //res.json({id : id})

}

let userProfile = async (req, res) => {
    
    let db = await connect()

    //nacin kako se pristupa podacima u mongu je kursor
    let cursor = await db.collection("users").find();

    let results = await cursor.toArray()

    //console.log(results)
    res.json(results)
}

let getProjects = async (req, res) => {
    
    let db = await connect()

    //nacin kako se pristupa podacima u mongu je kursor
    let cursor = await db.collection("projects").find();

    let results = await cursor.toArray()

    //console.log(results)
    res.json(results)
}

let getPartners = async (req, res) => {
    
    let db = await connect()

    //nacin kako se pristupa podacima u mongu je kursor
    let cursor = await db.collection("partners").find();

    let results = await cursor.toArray()

    //console.log(results)
    res.json(results)
}


let postProjects = async (req,res) => {

    let projectData = req.body
    let db = await connect()

    try{
        let insertResult = await db.collection("projects").insertOne(projectData);
        if(insertResult && insertResult.insertedId){
            res.send(`project with id  ${insertResult.insertedId} added.`)
        }
        
    }
    catch(e){
        res.status(500).json({ error: e.message});
    }   
}


let postPartners = async (req,res) => {

    let partnerData = req.body
    let db = await connect()

    try{
        let insertResult = await db.collection("partners").insertOne(partnerData);
        if(insertResult && insertResult.insertedId){
            res.send(`partner with id  ${insertResult.insertedId} added.`)
        }
        
    }
    catch(e){
        res.status(500).json({ error: e.message});
    }   
}

let home =(req, res) => {

    //console.log(req.query) //ili req.query.ime_parametra za izravno dohvacanje
    res.send('Hello World, ovaj puta preko browsera!')
}



export default { home, users, userProfile , login, secret, getProjects, postProjects, postPartners, getPartners } 