import connect from './db.js'
import auth from './auth.js'


//maknuti kad spojimo i dovršimo login? ili je bitno? zašto prof nema na loginu ? ovo samo za primjer?
let secret = async (req,res) => {

    res.json({message: 'ovo je tajna' + req.jwt.username})
}

let changePassword = async (req,res) => {
    let data = req.body
    console.log(req.jwt.email)

    //dolazi iz metode verify
    let email = req.jwt.email

    if (data.newPassword && data.oldPassword){
        let result = await auth.changeUserPassword(email, data.oldPassword, data.newPassword)
        

        if (result) {
            res.status(201).send();
        } 
        else {
            res.status(500).json({ error: 'Server error' });
        }
    }

    else{
        res.status(400).json({error : "Invalid input data"})
    }
}


let login = async (req,res) => {
    let user = req.body

    try{
        let result = await auth.authenticateUser(user.email, user.password)
        res.json(result)
    }
    catch(e){
        res.status(401).json({error: e.message})
    }
}


let registration = async (req, res) => { 
    let user = req.body;

    try {
        let result = await auth.register(user);
        res.json(result);
    } catch (e) {
        res.status(500).json({
            error: e.message,
        });
    }
    
}


let getProjects = async (req, res) => {
    let query = req.query
    let db = await connect()

    let selekcija = {}
    /*
    if(query.ime_poslodavca){
        selekcija.ime_poslodavca = new RegExp (query.ime_poslodavca)
    }
    */


    if(query._any){
        let pretraga = query._any
        let terms = pretraga.split(' ')
        console.log('terms:',terms)

        selekcija = {
            $and: []
        }

        let atributi = ["ime_poslodavca", "tehnologije", "lokacija", "opis_projekta"] 


        terms.forEach((term) => {
            let or = {
                $or: []
            };

            atributi.forEach(atribut => {
                or.$or.push({ [atribut]: new RegExp(term, "i") });
            })
            selekcija.$and.push(or);
        });
        
  }

    let cursor = await db.collection("projects").find(selekcija).sort({ime_poslodavca: 1})

    let results = await cursor.toArray()

    //console.log(results)
    res.json(results)
}


let getPartners = async (req, res) => {  
    let query = req.query
    let db = await connect()

    let selekcija = {}

    if(query._any){
        let pretraga = query._any
        let terms = pretraga.split(' ')
        console.log('terms:',terms)

        selekcija = {
            $and: []
        }

        let atributi = ["ime_poslodavca", "opis"] 


        terms.forEach((term) => {
            let or = {
                $or: []
            };

            atributi.forEach(atribut => {
                or.$or.push({ [atribut]: new RegExp(term, "i") });
            })
            selekcija.$and.push(or);
        });
        
  }

    let cursor = await db.collection("partners").find(selekcija).sort({ime_poslodavca: 1})

    let results = await cursor.toArray()

    //console.log(results)
    res.json(results)
}


let addProject = async (req,res) => {

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


let addPartner = async (req,res) => {

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


//testna
let userProfile = async (req, res) => {
    
    let db = await connect()

    //nacin kako se pristupa podacima u mongu je kursor
    let cursor = await db.collection("users").find();

    let results = await cursor.toArray()

    //console.log(results)
    res.json(results)
}

//testna
let home =(req, res) => {

    res.send('Hello World, ovaj puta preko browsera!')
}



export default { home, registration, login, secret, userProfile , getProjects, addProject, addPartner, getPartners, changePassword } 