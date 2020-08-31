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


    //slicna kao neke funkcije, spojiti?
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

        let response = await methods.changeInfo(userInfo, 'users')

        res.send(response)
    },

    //skoro identicna kao getonePartner, spojiti u jednu?
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
        //poboljsati

        let db = await connect();
        let content = await db.collection('content').findOne();

        let data = {
            template : req.body,
            id : content._id,
            updateDoc : true
        }

        let obj = req.route.methods
        data.method = Object.keys(obj).toString()
        
        try{
            
            let result = await methods.changeInfo(data, 'content')
            
            res.send(`${result} at changing template.`)

        }
        catch(e){
            res.status(500).json({ error: e.message});
        }  

    },

    async changeInstructions(req, res) {
        //poboljsati
        let db = await connect();
        let content = await db.collection('content').findOne();

        let data = {
            instructions : req.body,
            id : content._id,
            updateDoc : true
        }

        let obj = req.route.methods
        data.method = Object.keys(obj).toString()
        
        
        try{
            
            let result = await methods.changeInfo(data, 'content')
            
            res.send(`${result} at changing instructions.`)

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


    //refaktorirati -> optimizirati
    async submitJournal (req,res) {
        let data = {
            userID : req.body.user_id,
            journal : req.body.journal,
            upload_date :  Date.now() // Date(Date.now())
        }

        let db = await connect()
        let journal

        try{
            /* ako želimo da korisnik ne može više puta uploadati dnevnik */
            //let checkUser = await db.collection('users').findOne({_id : ObjectID(data.userID)})
            
            //if (checkUser.journalID != false) throw new Error("Error accured during inserting")

            journal = await db.collection('journals').insertOne(data)
            
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

        //nađi projekte koje pripadaju određenom poslodavcu
        /*
        let find_IDs= await db.collection("partners").find({_id: ObjectID(id)})
        let result =  await find_IDs.toArray()

        let filtered_IDs = result[0].projects

        let cursor2 = await db.collection("projects").find({_id: {$in: filtered_IDs}})
        let finalResult =  await cursor2.toArray()
        */
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
        //ne vraca gresku kad je id nepostojeci

        let id = req.params.id

        let db = await connect()

        try{
            let result = await db.collection("partners").findOne({_id: ObjectID(id)})

            result.id = result._id
            delete result._id

            if (!result.id) throw new Error('id is undefined')

            //get partner popularity
            //https://stackoverflow.com/questions/34268176/count-total-number-of-elements-inside-an-array-in-document-mongodb
            // let cursor = await db.collection("projects").aggregate(
            //     [
            //         {
            //           $match: { partnerID : ObjectID(id) }
            //         },
            //         {
            //           $group: {
            //             _id: null, // da ih ne grupira nego samo pokaze ukupan zbroj
            //             total: { $sum: { $size: "$allocated_to"} }
            //           }
            //         }
            //     ] 
            // )
            // let popularity = await cursor.toArray()
            // result.popularity = popularity[0].total
            //console.log(result.popularity)

            res.json(result)
        }

        catch(e){
            res.json({error: e.message})
        }
        
},



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
            res.status(401).json({error: e.message})
        }
},


    async registration (req, res) { 
        let newUser = req.body;

        try {
            let partner = await auth.register(newUser);
            let result 
            
            //dodavanje korisnika automatski u partnere čim se registrira
            
            if (newUser.account_type == 'Poslodavac')    result = await methods.addPartner(partner)
            
        
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

        //ovo bi islo s .map?

        // {first_priority: [id1, id2, id2], second_priority:[...], third_priority:[...]}
        
        let result

        let selectedBy = {
                first_priority : [],
                second_priority : [],
                third_priority  : []
        }
        //destrukcija strukture
        let entries = Object.entries(selectedBy);

        for(let [index, [key, value]] of entries.entries()){

            let projectID = data.selection[index]
       
            /* https://stackoverflow.com/questions/30969382/mongodb-object-key-with-es6-template-string  da bi bilo moguce dinamicki updejtati*/
            // var attributeName
            // let query = { "_id": projectID }
            // let update = { "$addToSet": {} }
            // update["$addToSet"][attributeName] = data.user

            //trik za prevariti mongo kompajler
            // ili selectedBy[key] = 'selected_by. + key
            key = 'selected_by.' + key

            result = await db.collection('projects').updateOne( { _id: ObjectID(projectID) },{ $addToSet: { [key] : data.user }})
     
        }
                                                                                       
        
        res.json(result)
},


    async changeProjectInfo (req, res)  {

        //let projectData = req.body 
        //delete projectData.id;
        let  project =  req.body 
        delete project.id;
        if (project && project.updateDoc === true){

            //mapiranje trenutno nije potrebno jer su nazivi atributa uskladeni, ali inace ce ova funkcja posluziti
            //if (projectData) project = await methods.mapAttributes(projectData)
            if (!project.selected_by) delete project.selected_by
            
            project.partnerID = ObjectID(project.partnerID)
            //project.partnerID = ObjectID(projectData.partnerID)
            //project.updateDoc = projectData.updateDoc

            //console.log(req.route.methods["put"]) pa onda true/false -> 2. nacin za dohvati vrstu requesta
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
        delete partnerInfo._id;
        partnerInfo.id = req.params.id;
        partnerInfo.userID = ObjectID(partnerInfo.userID)

        let obj = req.route.methods
        partnerInfo.method = Object.keys(obj).toString()

        let partnerTemp, response, result

        let db = await connect()

        // dohvacanje partnera kako bi preko userID-a obrisali i usera ako je API metoda delete
        if (!partnerInfo.updateDoc) { // ili  req.route.methods == 'DELETE'
            partnerTemp = await db.collection("partners").findOne({_id: ObjectID(partnerInfo.id)})
            partnerTemp.updateDoc = false
        }

        if (!partnerInfo.headers) delete partnerInfo.headers  
        
        else {
             try { await db.collection("projects").updateMany({partnerID : ObjectID(partnerInfo.id)}, {$set: {headers: partnerInfo.headers, logo: partnerInfo.logo} }) }
             // je li ovo ok?
             catch(e) {res.send('Error accured during updating project headers')}
        }

        //hardcodamo opet defaultnu sliku ako partner nema nikakvog logotipa       
        if (partnerInfo.image_url) partnerInfo.image_url = "https://images.unsplash.com/photo-1493119508027-2b584f234d6c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=80"
        
        response = await methods.changeInfo(partnerInfo, 'partners')
        

        if(response == 'success' && partnerTemp){
            partnerTemp._id = partnerTemp.userID
   
            //brisanje usera
            result = await methods.changeInfo(partnerTemp, 'users')
        }


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
        let atributi = ["company", "about_us"] 

        let result = await methods.search(query, atributi, 'partners')

        res.json(result)
},


    async addProject (req, res)  {

        let project = req.body
        
        /* pušteno ovako u slučaju da se imena atributa razlikuju pa je lakše promijeniti, ali za sada ne treba 
        let projectData = req.body
        let project = await methods.mapAttributes(projectData)
        
        project.userID = projectData.userID
        project.allocated_to = projectData.allocated_to
        */
       
        project.views = 0
        project.date_created = Date.now()
        project.img_url = "https://images.unsplash.com/photo-1504610926078-a1611febcad3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80"

        //brisanje atributa koji su prazni kod inicijalizacije projekta da shodno tome ne aktivira validateData
        if (!project.selected_by) delete project.selected_by
        
        
        try{
            let result = await methods.pushData(project, 'projects')
            
            res.send(`project with id  ${result} added.`)

        }
        catch(e){
            res.status(500).json({ error: e.message});
        }   
    },



    async createPartner (req, res)  {
       
        let partnerData = req.body
        
        // ako će trebati kad stjepan implementira
        //let project = await methods.mapAttributes(projectData)
        
        //dok stjepan ne implementira ce biti ovako hardcodano
        partnerData.img_url = "https://images.unsplash.com/photo-1504610926078-a1611febcad3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80"
        
        //za raspoznavanje koji partneri su se sami kreirali, a koji ne
        partnerData.created_by_admin = true
        

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