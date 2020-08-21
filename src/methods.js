/* Svrha ovog filea je odvojiti metode odnosno funkcije od ruta i handlera radi preglednosti, a metode su pisane radi redundancije koda */
import connect from './db.js'
import { ObjectID } from 'mongodb'



let methods  = {


    validateData : (data) => {
        for (const [key, value] of Object.entries(data)) {
            if(!value && key != 'views'){

              return false
            }
        }
        return true
    },

    

    // jer je skoro identičan postupak za dodavanje partnera i projekta
    pushData : async (data, collectionName) => {

        if (!methods.validateData(data)) {

            throw new Error("Error accured during inserting project or partner")        
        }
            
        let db = await connect()

        
        try{
            
            
            //projektu pridodajemo partnerID radi lakšeg mapiranja i rada s podacima
            if(collectionName === 'projects') {
                let getPartner  = await db.collection("partners").findOne({userID: ObjectID(data.userID)})
                data.partnerID = getPartner._id
            }
            
            
            let insertResult = await db.collection(collectionName).insertOne(data);
            let id = insertResult.insertedId

            if(insertResult && id){ 
                 // 1. način
                 return id
                }
                
                /*
                // pushanje projectId-a u listu projekata određenog partnera, 2. način

                if(collectionName === 'projects'){
                    let partnerID = data.partnerID
                    delete data.partnerID
                    
                    await db.collection('partners').updateOne( { _id: ObjectID(partnerID) },{$addToSet:{ "projects": id}}, true);
                }
                */
                return id
            }
        
        catch(e){
                throw new Error("Error accured during inserting project or partner")
        } 
    },


   
    addPartner : async (partnerData) => {
        
        try{
            delete partnerData.account_type
            partnerData.views = 0

            let result = await methods.pushData(partnerData, 'partners')
            console.log('res',result)
            return result
        }
        catch(e){
            res.status(500).json({ error: e.message});
        }   
    },


    // identičan postupak za promjenu info partnera i projekta
    changeInfo : async (data, collectionName) => {
        
        let result, id 

        if (data._id == null){
            id = data.id
            delete data.id
        }else{
            id = data._id
            delete data._id
        }
        
        let db = await connect();

        //za ovakav update više odgovara put, a ne patch?
        if (data.updateDoc==='true') {
            delete data.updateDoc
            result = await db.collection(collectionName).updateOne( { _id: ObjectID(id) },{ $set: data, });
        } 
            
        else    result = await db.collection(collectionName).deleteOne( { _id: ObjectID(id) } )

        // 2 način
        /*
        else{
            await db.collection('partners').updateOne( {}, {
                $pull: { _id: ObjectID(id)  } } 
              )

            result = await db.collection(collectionName).deleteOne( { _id: ObjectID(id) } );
        } 
        */
     
        if (result.modifiedCount == 1 || result.deletedCount == 1)  return 'success'
        else return 'fail'
    },


    //nece trebati ako su imena atributa ista
    mapAttributes : async (projectData) =>{
     
        let project = {
                company: projectData.company,
                project_description: projectData.description,
                date_created: Date.now(),
                contact: projectData.contact,
                technologies: projectData.technologies,
                preferences: projectData.preferences,
                requirements: projectData.requirements,
                duration: projectData.duration,
                location: projectData.location,
                note: projectData.note,
                allocated_to: projectData.allocatedTo
        }
        return project
    },


    
    //  identičan postupak za pretragu partnera i projekta
    search : async (query, atributi, collectionName) =>{
        let db = await connect()

        let selekcija = {}
        
        if(query._any || collectionName === 'users'){
            let pretraga = query._any

            if (collectionName === 'users'){

                pretraga = pretraga + ' Student'
            } 

            let terms = pretraga.split(' ')
            if (!query._any)  terms.shift()
            console.log('terms:',terms)

            selekcija = {
                $and: []
            }

            /*
            terms.map(function(term){
                let or = { $or: [] };
                atributi.map(or.$or.push({ [atribut]: new RegExp(term, "i") }));
                selekcija.$and.push(or);
            })
            */
            
            
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
     
        let cursor = await db.collection(collectionName).find(selekcija).sort({company: 1})

        let results =  await cursor.toArray()

        results.forEach(doc => {
            doc.id = doc._id
            delete doc._id
        })


        return results
    },



}



export default methods