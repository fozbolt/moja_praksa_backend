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
            if(collectionName === 'projects' && data.created_by_admin!= true) {
                
                let getPartner  = await db.collection("partners").findOne({userID: ObjectID(data.userID)})
                data.partnerID = ObjectID(getPartner._id)
            }
            else if (collectionName === 'projects' && data.created_by_admin === true){
                //Moze biti vise partnera kreirano od strane admina pa ne mozemo to traziti klasicno kao u gornjem if-u
                data.partnerID = ObjectID(data.partnerID)
                delete data.userID
            }

            let insertResult = await db.collection(collectionName).insertOne(data);
            let id = insertResult.insertedId


            if(id) return id
            else throw new Error("Error accured during inserting project or partner")
        
        }
        
            
        catch(e){
                console.error(e.name + ': ' + e.message)
        } 
    },


   
    addPartner : async (partnerData) => {
       
        try{
            partnerData.views = 0
            
            let result = await methods.pushData(partnerData, 'partners')
            

            return result
        }
        catch(e){
            console.log(error)
        }   
    },


    // identičan postupak za promjenu info partnera i projekta -- REFakTORIRATI staviti sve u try catch i u routes.js?
    changeInfo : async (data, collectionName) => {

        if (!methods.validateData(data)) {
            /* res nije tu definiran ali iskoristiti ovo drugdje
            res.json({
                status: 'fail',
                reason : 'incomplete update data'
            })
            */
            return 'fail'  
        }
        
        let result, id 

        if (data._id == null){
            id = data.id
            delete data.id
        }else{
            id = data._id
            delete data._id
        }
        
        let db = await connect();
     
        try {
            if (data.updateDoc==='true' && data.method == 'put') {
                delete data.updateDoc
                delete data.method
                result = await db.collection(collectionName).replaceOne( { _id: ObjectID(id) }, data);
            } 

            else if (data.updateDoc==='true' && data.method == 'patch') {
                delete data.updateDoc
                delete data.method
                result = await db.collection(collectionName).updateOne( { _id: ObjectID(id) },{ $set: data, });
            } 
                
            else    result = await db.collection(collectionName).deleteOne( { _id: ObjectID(id) } )
            
        }
        

        catch(e){
            console.log(e)
        }
     

        if (result.modifiedCount == 1 || result.deletedCount == 1)  return 'success'
        else return 'fail'
        
    },


    //nece trebati ako su imena atributa ista
    mapAttributes : async (projectData) =>{
     
        let project = {
                company: projectData.company,
                project_description: projectData.project_description,
                date_created: Date.now(),
                contact: projectData.contact,
                technologies: projectData.technologies,
                preferences: projectData.preferences,
                requirements: projectData.requirements,
                duration: projectData.duration,
                location: projectData.location,
                note: projectData.note,
                allocated_to: projectData.allocated_to,
                selected_by: projectData.selected_by,
                img_url: projectData.img_url
                
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

            if (collectionName == 'users') delete doc.password
        })


        return results
    },



}



export default methods