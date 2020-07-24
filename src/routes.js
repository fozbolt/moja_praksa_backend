import connect from './db.js'
import auth from './auth.js'
import { ObjectID } from 'mongodb'

//maknuti kad spojimo i dovršimo login? ili je bitno? zašto prof nema na loginu ? ovo samo za primjer?
let secret = async (req,res) => {

    res.json({message: 'ovo je tajna' + req.jwt.username})
}


let validateData = (data) => {
    for (const [key, value] of Object.entries(data)) {
        if(!value){
          return false
        }
    }
    return true
}


let getOneProject = async (req,res) =>{
    //a kad bi bilo ?id=23432 onda dohvacamo s req.query, a url parametre ovako:
    let id = req.params.id

    let db = await connect()

    //findOne ne pretvara rezultate u kursor koji treba pretvoriti u  array
    // u mongu kada pretrazujemo po id-u, moramo omotati s posebnim konstruktorom objectID
    let result = await db.collection("projects").findOne({_id: ObjectID(id)})

    res.json(result)
}


let getOnePartner = async (req,res) =>{
    let id = req.params.id
    let db = await connect()
    let result = await db.collection("partners").findOne({_id: ObjectID(id)})

    res.json(result)
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


// da se smanji redundancija koda pošto je identičan postupak za promjenu info partnera i projekta
let changeInfo = async (data, collectionName) => {
    let db = await connect();

    let result = await db.collection(collectionName).updateOne( { _id: ObjectID(data.id) },{$set: data });

    if (result.modifiedCount == 1) return 'success'
    else return 'fail'
}


let changeProjectInfo = async (req,res) => {
    let projectInfo = req.body
    delete projectInfo._id;
    projectInfo.id = req.params.id;

    let response = await changeInfo(projectInfo, 'projects')
    
    res.send(response)
}



let changePartnerInfo = async (req,res) => {
    let partnerInfo = req.body
    delete partnerInfo._id;
    partnerInfo.id = req.params.id;

    response = await changeInfo(partnerInfo, 'partners')

    res.send(response)
}



// da se smanji redundancija koda pošto je identičan postupak za pretragu partnera i projekta
let search = async (query, atributi, collectionName) =>{
    let db = await connect()

    let selekcija = {}

    if(query._any){
        let pretraga = query._any
        let terms = pretraga.split(' ')
        console.log('terms:',terms)

        selekcija = {
            $and: []
        }

        
        terms.map(function(term){
            let or = { $or: [] };
            atributi.map(or.$or.push({ [atribut]: new RegExp(term, "i") }));
            selekcija.$and.push(or);
        })
        
        /*
        terms.forEach((term) => {
            let or = {
                $or: []
            };

            atributi.forEach(atribut => {
                or.$or.push({ [atribut]: new RegExp(term, "i") });
            })
            selekcija.$and.push(or);
        });
        */
        
  }

    let cursor = await db.collection(collectionName).find(selekcija).sort({ime_poslodavca: 1})

    let results =  await cursor.toArray()
    
    return results
}



let getProjects = async (req, res) => {
    
    let query = req.query
    let atributi = ["ime_poslodavca", "tehnologije", "lokacija", "opis_projekta"] 

    let result = await search(query, atributi, 'projects')

    res.json(result)
}



let getPartners = async (req, res) => {  
    let query = req.query
    let atributi = ["ime_poslodavca", "opis"] 

    let result = await search(query, atributi, 'partners')
    
    res.json(result)
}

// da se smanji redundancija koda pošto je identičan postupak za dodavanje partnera i projekta
let pushData = async (data, collectionName) => {
    data.publishedAt = Date.now()
    
    if (!validateData(data)) {
        res.json({status: 'Missing data'})
        return
    }
        
    let db = await connect()

    
    try{
        let insertResult = await db.collection(collectionName).insertOne(data);
        if(insertResult && insertResult.insertedId){
            return insertResult.insertedId  
        }
    }
    catch(e){
            throw new Error("Error accured during inserting project or partner")
    } 

}


let addProject = async (req,res) => {

    let projectData = req.body
    delete projectData._id

    try{
        let result = await pushData(projectData, 'projects')
        res.send(`project with id  ${result} added.`)

    }
    catch(e){
        res.status(500).json({ error: e.message});
    }   
}


let addPartner = async (req,res) => {

    let partnerData = req.body
    delete partnerData._id

    try{
        let result = await pushData(partnerData, 'partners')
        res.send(`partner with id  ${result} added.`)

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



export default { home, registration, login, secret, userProfile , getProjects, addProject, 
                addPartner, getPartners, changePassword, getOneProject, getOnePartner, changeProjectInfo, changePartnerInfo  } 