/* Svrha ovog filea je odvojiti metode odnosno funkcije od ruta i handlera radi preglednosti, a metode su pisane radi redundancije koda */
import connect from './db.js'
import { ObjectID } from 'mongodb'
import bcrypt from 'bcrypt'



let methods  = {


    filterData : (data) => {
        //pošto se sve mandatory vrijednosti provjeravaju da nisu undefined na frontendu, ova funkcija dodaje false vrijednosti non mandatory atributima
        for (const [key, value] of Object.entries(data)) {
            if(!value && key != 'views'){
            
                data[key] = false
            }
        }
        
        return data
    },

    

    pushData : async (data, collectionName) => {
        let filteredData = methods.filterData(data)

        let db = await connect()
      
        try{
            
            //projektu pridodajemo partnerID radi lakšeg mapiranja i rada s podacima
            if(collectionName === 'projects' ) {
                filteredData.partnerID = ObjectID(filteredData.partnerID)
                delete filteredData.userID
            }
            

            let insertResult = await db.collection(collectionName).insertOne(filteredData);
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


 
    changeInfo : async (data, collectionName) => {

        let filteredData = methods.filterData(data)
        
        let result, id 

        if (filteredData._id == null){
            id = filteredData.id
            delete filteredData.id
        }else{
            id = filteredData._id
            delete filteredData._id
        }
        
        let db = await connect();
        
     
        try {
            if (filteredData.updateDoc=== true && filteredData.method == 'put') {
                delete filteredData.updateDoc
                delete filteredData.method
                result = await db.collection(collectionName).replaceOne( { _id: ObjectID(id) }, filteredData);
            } 

            else if (filteredData.updateDoc=== true && filteredData.method == 'patch') {
                delete filteredData.updateDoc
                delete filteredData.method
                result = await db.collection(collectionName).updateOne( { _id: ObjectID(id) },{ $set: filteredData, });
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
                img_url: projectData.img_url,
                userID : projectData.userID,
                allocated_to : projectData.allocated_to
                
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


    checkPassword : async (userData) =>{
        let db = await connect()
        let user = await db.collection("users").findOne({_id : ObjectID(userData._id)})
    
        try{
            if (user && user.password && (await bcrypt.compare(userData.password, user.password))){
                return true
            }
            else{
                return false
            }
        }
        catch(e){
            return false
        }

    }

}



export default methods