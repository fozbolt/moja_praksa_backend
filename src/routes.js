import connect from './db.js'
import auth from './auth.js'
import { ObjectID } from 'mongodb'
import methods from './methods.js'


export default {

    async getChosenProjects (req,res) {
        let studentID = req.params.id

        let db = await connect()
        let cursor = await db.collection('projects').find()
        let projects = await cursor.toArray()

        let result = [];
        
        let attributes = ['first_priority', 'second_priority', 'third_priority']


        attributes.forEach(attribute => {
            const match = projects.filter(function (project) {
                let priority = undefined
                
                try {
                    priority = project.selected_by[attribute]    

                    if (priority.includes(studentID)){
                        result.push(project._id);
                        }
                }
    
                catch { }
            })
        })

        res.json(result)

    },


    
    async getJournal (req,res) {
        let journalID = req.params.id

        let db = await connect()
       
        try{
            let journal = await db.collection("journals").findOne({_id: ObjectID(journalID)})
            res.json(journal)
        }

        catch(e){
            console.log(e)
            res.json({error: e.message})
        }
    },



    async changeUserInfo (req, res)  {
        let userInfo = req.body
        let obj = req.route.methods
        userInfo.method = Object.keys(obj).toString()
        let validated = false
        let response
       
        // kod brisanja računa se provjerava autentičnost korisnika
        if (userInfo.updateDoc == false)  validated = await methods.checkPassword(userInfo)     
        
        // ne želimo update ovog atributa na bazi
        if(userInfo.chosenProjects) delete user.chosenProjects

        // ako je prosla provjera lozinke ili ako se radi samo o updejtu profila
        if (validated || userInfo.updateDoc == true)  response = await methods.changeInfo(userInfo, 'users')
        

        res.send(response)
    },


    
    async test (req, res)  {
        let userInfo = req.body
        let obj = req.route.methods
        userInfo.method = Object.keys(obj).toString()
        let validated = false
        let response, chosenProjectsRemoved
       
        // kod brisanja računa se provjerava autentičnost korisnika
        if (userInfo.updateDoc == false)  validated = await methods.checkPassword(userInfo)     
        
            //ako je request brisanje računa, izbriši odabire projekata tog studenta
            if ( userInfo.updateDoc == false){
                chosenProjectsRemoved = await db.collection("projects").updateMany({}, { $pull: {
                    selected_by: {first_priority:  {$in : userInfo._id} }, 
                    selected_by: {second_priority: {$in : userInfo._id}  },
                    selected_by: {third_priority:  {$in : userInfo._id} },
                    }
                }
            )
            console.log(response)
            console.log(chosenProjectsRemoved)
          }    
        
        res.send(response)
    },

    //skoro identicna kao getonePartner, ali ova sadrzi provjeru da li je korisnik partner
    async checkIfPartner(req, res) {
            let id = req.params.id

            let db = await connect()
            const data = await db.collection("partners").findOne({userID : ObjectID(id)});

            if(!data)  res.status(401).json({ error: 'user is not a partner'})

            res.json (data);
        
    },


    async getJournalTemplate(req, res) {
        let db = await connect()
    
        let result = await db.collection("content").findOne()
        
        if(result)  res.json(result.template)
        else return false

    },


    async uploadTemplate(req, res) {
        let db = await connect();
        let content = await db.collection('content').findOne();

        let data = {
            template : req.body
        }

        let obj = req.route.methods
        data.method = Object.keys(obj).toString()
        
        try{
            let result 

            // ako ne postoji dokument u kolekciji 'content' insertaj template, inace ga updejtaj
            if (!content){
                delete data.method
                result = await methods.pushData(data, 'content')
            } else{
                data.id = content._id,
                data.updateDoc = true
                result = await methods.changeInfo(data, 'content')
            }
            
            res.send(`success at changing template.`)

        }
        catch(e){
            res.status(500).json({ error: e.message});
        }  

    },



    async changeInstructions(req, res) {

        let db = await connect();
        let content = await db.collection('content').findOne();

        let data = {
            instructions : req.body
        }

        let obj = req.route.methods
        data.method = Object.keys(obj).toString()
        
        
        try{
            let result 

            // ako ne postoji dokument u kolekciji 'content' insertaj instrukcije, inace ih updejtaj
            if (!content){
                delete data.method
                result = await methods.pushData(data, 'content')
            } else{
                data.id = content._id,
                data.updateDoc = true
                result = await methods.changeInfo(data, 'content')
            }
            
            res.send(`success at changing instructions.`)

        }
        catch(e){
            res.status(500).json({ error: e.message});
        }  

    },



    async getInstructions(req, res) {

        let db = await connect()

        try{
            let result = await db.collection("content").findOne()

            result.id = result._id
            delete result._id

            res.json(result.instructions)
        }
        catch(e){
            if (e.name == 'TypeError') {
                console.log('There are no instructions at the moment')
                res.send('There are no instructions at the moment')}

            else console.log(e.name)
        }
       
    },

    

    async getApprovedProject(req, res) {
        let studentID = req.params.id

        let db = await connect()

        let result = await db.collection("projects").findOne({ allocated_to: studentID })

        if(result){
            result.id = result._id
            delete result._id
        }
        
        res.json(result)
    },
    


    async applicationForm (req, res) {

        let formData = {
            id : req.body.userID,
            application : req.body.form,
            updateDoc : true
        }

        let obj = req.route.methods
        formData.method = Object.keys(obj).toString()
        

        let db = await connect()

        let appExists = await db.collection('users').find( { _id: ObjectID(formData.id) , application: { $exists: true} } )

        try{
            if (appExists == true) throw new Error("Error accured during inserting")
            
            let result = await methods.changeInfo(formData, 'users')
            
            res.send(`${result} at inserting application.`)

        }
        catch(e){
            res.status(500).json({ error: e.message});
        }  
    
    },


    
    async submitJournal (req,res) {
        let data = {
            userID : ObjectID(req.body.user_id),
            journal : req.body.journal,
            upload_date :  Date.now() 
        }

        let db = await connect()
        let journal = await db.collection('users').findOne({_id: ObjectID(data.userID)})
        let newJournal

        try{
            /* ako želimo da korisnik ne može više puta uploadati dnevnik */
            //let checkUser = await db.collection('users').findOne({_id : ObjectID(data.userID)})         
            //if (checkUser.journalID != false) throw new Error("Error accured during inserting")

            if (journal){
                newJournal = await db.collection('journals').replaceOne({ _id: ObjectID(journal._id), data})
            } 
            else {
                newJournal = await db.collection('journals').insertOne(data)
            } 

            //ubacuje jos journalID u usera da budu dvostruko povezani
            try {
                let user = {
                    id : ObjectID(data.userID),
                    journalID : journal.insertedId,
                    updateDoc : true
                }

                let obj = req.route.methods
                user.method = Object.keys(obj).toString()

                await methods.changeInfo(user, 'users')

                res.json(true)
                //res.json({message: 'upload successful'})
            }

            catch(e){
                res.send('Error accured during connecting journal ID with user')
                return false;
            }

        }
        
        catch(e){
            res.json(false)
            //res.json({error:e.message })
        }


    },

    async getOneProject (req,res) {
        let id = req.params.id

        let db = await connect()

        try{
            let result = await db.collection("projects").findOne({_id: ObjectID(id)})

            result.id = result._id
            delete result._id

            res.json(result)
        }
        catch(e){
            if (id == null)  res.json({error: 'id is undefined'})

            else  res.json({error: e.message})
        }
    },


    async getPartnerProjects (req,res) {

        let partnerID = req.params.id
        let db = await connect()

        let cursor= await db.collection("projects").find({partnerID: ObjectID(partnerID)})
        let results =  await cursor.toArray()
        
        res.send(results)

    },


    async addView(req, res){
        let data = req.body
        data.updateDoc = true
        let collectionName = data.collectionName
        delete data.collectionName
        

        let obj = req.route.methods
        data.method = Object.keys(obj).toString()

        let result = await methods.changeInfo(data, collectionName)

        res.json(result)
    },


    async getOnePartner (req,res) {

        let id = req.params.id
        let db = await connect()

        try{
            let result = await db.collection("partners").findOne({_id: ObjectID(id)})

            result.id = result._id
            delete result._id

            if (!result.id) throw new Error('id is undefined')

            res.json(result)
        }
        catch(e){
            res.json({error: e.message})
        }
        
    },


    //referenca: prof. Tanković
    async changePassword (req,res) {
        let data = req.body
        
        //dolazi iz metode isValidUser
        data.email = req.jwt.email

        if (data.newPassword && data.oldPassword){
            let result = await auth.changeUserPassword(data)
            

            if (result) {
                res.status(201).send({status: 'Success'});
            } 
            else {
                res.status(500).json({ error: 'Server error' });
            }
        }

        else{
            res.status(400).json({error : "Invalid input data"})
        }
    },


    async login(req,res) {
        let user = req.body

        try{
            let result = await auth.authenticateUser(user.email, user.password)
            res.json(result)
        }
        catch(e){
            res.status(403).json({error: e.message})
        }
    },


    async registration (req, res) { 
        let newUser = req.body.new_user;
        let entryCode = req.body.registrationCode

        try {
            if (entryCode !== process.env.ENTRY_CODE)  throw new Error("Wrong entry code")
            
            let user = await auth.register(newUser);
            let result 
       
            //dodavanje korisnika automatski u partnere čim se registrira
            if (newUser.account_type == 'Poslodavac')    result = await methods.addPartner(user)
            
            res.json({status: `user with id ${result} added`})

        } catch (e) {
            res.status(500).json({
                error: e.message,
            });
        }
    },


    async submitChosenProjects (req, res)  {
        let data = req.body
        let db = await connect()

        // struktura na bazi : {first_priority: [id1, id2, id2], second_priority:[...], third_priority:[...]}
        let selectedBy = {
                first_priority : [],
                second_priority : [],
                third_priority  : []
        }
        //destrukcija strukture
        let entries = Object.entries(selectedBy);

        try{
            for(let [index, [key, value]] of entries.entries()){

                let projectID = data.selection[index]
                key = 'selected_by.' + key
    
                await db.collection('projects').updateOne( { _id: ObjectID(projectID) },{ $addToSet: { [key] : data.user }})
         
            }
        } catch(e){
            res.json({error: e.message, status: "Error during submitting chosen projects"})
        }                                                                
        
        res.json('success')
    },


    async changeProjectInfo (req, res)  {

        let  project =  req.body 
        delete project.id;
        if (project && project.updateDoc === true){

            //mapiranje trenutno nije potrebno jer su nazivi atributa uskladeni, ali inace ce ova funkcja posluziti
            //if (projectData) project = await methods.mapAttributes(projectData)
            if (!project.selected_by) delete project.selected_by
            
            project.partnerID = ObjectID(project.partnerID)
           
            let obj = req.route.methods
            project.method = Object.keys(obj).toString()
        }
        
        project.id = req.params.id;
        if (!project.updateDoc) project.updateDoc = false

        let response = await methods.changeInfo(project, 'projects')
        
        res.send(response)
},



    async changePartnerInfo (req, res)  {

        let partnerInfo = req.body
        let id

        if (partnerInfo._id == null){
            id = partnerInfo.id
            delete partnerInfo.id
        }else{
            id = partnerInfo._id
            delete partnerInfo._id
        }
        
        delete partnerInfo._id;
        partnerInfo.id = req.params.id;
        partnerInfo.userID = ObjectID(partnerInfo.userID)

        let obj = req.route.methods
        partnerInfo.method = Object.keys(obj).toString()
        
        let partnerTemp, response, result

        let db = await connect()

        //provjera lozinke u slučaju da je zahtjev brisanje partnera 
        let validated = false
        if (partnerInfo.updateDoc == false)  validated = await methods.checkPassword(partnerInfo)     


        // dohvacanje partnera kako bi preko userID-a obrisali i usera ako je API metoda delete + brisanje projekata vezanih uz partnera
        if (!partnerInfo.updateDoc) { // ili  req.route.methods == 'DELETE'
            partnerTemp = await db.collection("partners").findOne({_id: ObjectID(id)})
            partnerTemp.updateDoc = false

            try {
                await db.collection("projects").deleteMany( { partnerID : ObjectID(partnerTemp._id) } );
             } catch (e) {
                console.log (e);
             }
        }
    
        // prenesi headere i logo partnera na njegove projekte ako ih ima te ako se radi o updaejtu
        if (partnerInfo.headers || partnerInfo.logo  && partnerInfo.updateDoc == true)  {
             try { 
                 await db.collection("projects").updateMany({partnerID : ObjectID(partnerInfo.id)}, {$set: {
                    headers: partnerInfo.headers, 
                    logo: partnerInfo.logo} 
                    })
            }
             catch(e) {res.send('Error accured during updating project headers')}
        }

        //hardcodamo opet defaultnu sliku za svaki slučaj ako partner nema nikakvog logotipa       
        if (partnerInfo.image_url) partnerInfo.image_url = "https://images.unsplash.com/photo-1493119508027-2b584f234d6c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=80"
        
        
        // ako je prosla provjera lozinke ili ako se radi samo o updejtu profila, onda se poziva metoda za promjenu podataka na bazi 
        if (validated || partnerInfo.updateDoc == true) {
            partnerInfo.id = id
            response = await methods.changeInfo(partnerInfo, 'partners')
        }
        else return false
        

        // briše se i user ako je user izbrisao svoj partner profil
        if(response == 'success' && partnerTemp && partnerTemp.created_by_admin != true){
            partnerTemp._id = partnerTemp.userID
            result = await methods.changeInfo(partnerTemp, 'users')
        }
        else result = response


        res.send(result)
},


    async getStudents (req, res)  {
            
        let query = req.query
        let atributi = ["name", "surname", "jmbag", "year", "technology", "email", "account_type"] 

        let result = await methods.search(query, atributi, 'users')
        

        res.json(result)
    },


    async getProjects (req, res)  {
        
        let query = req.query
        let atributi = ["company", "technologies", "location", "project_description"] 

        let result = await methods.search(query, atributi, 'projects')

        res.json(result)
    },



    async getPartners (req, res) {

        let query = req.query
        let atributi = ["company", "about_us", "technologies"] 

        let result = await methods.search(query, atributi, 'partners')

        res.json(result)
    },



    async addProject (req, res)  {

        let project = req.body
 
        /* pušteno ovako u slučaju da se imena atributa razlikuju pa je lakše promijeniti, ali za sada ne treba 
        let projectData = req.body
        let project = await methods.mapAttributes(projectData)
        */
       
        project.views = 0
        project.date_created = Date.now()
        project.img_url = "https://images.unsplash.com/photo-1504610926078-a1611febcad3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80"

        //brisanje atributa koji su prazni kod inicijalizacije projekta da shodno tome ne aktivira validateData
        if (!project.selected_by) delete project.selected_by
        
        
        try{
            //insert projekta
            let result = await methods.pushData(project, 'projects')

            //dohvati partnera i ako partner ima uploadane slike, prenesi ih na projekt
            let db = await connect()
            let partner = await db.collection("partners").findOne({_id: ObjectID(project.partnerID)})
       
            if(partner.headers || partner.logo){
              
                let addedProject = {
                    id : result,
                    updateDoc : true,
                    method : 'patch'
                }
                if (partner.headers)  addedProject.headers = partner.headers
                if (partner.logo)   addedProject.logo = partner.logo

                await methods.changeInfo(addedProject, 'projects')
            } 
   
            
            res.send(`project with id  ${result} added.`)

        }
        catch(e){
            res.status(500).json({ error: e.message});
        }   
    },



    async createPartner (req, res)  {
       
        let partnerData = req.body
        partnerData.userID = ObjectID(partnerData.userID)
        
        //hardcodano za pocetak dok partner ne uploada svoje headere ili logo
        partnerData.img_url = "https://images.unsplash.com/photo-1504610926078-a1611febcad3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80"
        
        //za raspoznavanje koji partneri su se sami kreirali, a koji ne
        partnerData.created_by_admin = true
        partnerData.account_type = 'Admin'
        
        try{  
            let partnerID = await methods.pushData(partnerData, 'partners')          
            
            res.send(`partner with id  ${partnerID} added.`)
        }
        catch(e){
            res.status(500).json({ error: e.message});
        }   
    },
    


    async home (req, res)  {

        let db = await connect()
        let numberOfDocs = {}

        numberOfDocs.projectsCounter = await db.collection("projects").countDocuments();
        numberOfDocs.partnersCounter = await db.collection("partners").countDocuments();
        numberOfDocs.studentsCounter = await db.collection("users").countDocuments({ account_type : 'Student'});
        

        res.json(numberOfDocs)
    }


} 