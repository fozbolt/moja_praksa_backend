/* Svrha ovog filea je odvojiti metode odnosno funkcije od ruta i handlera radi preglednosti, a metode su pisane radi redundancije koda */
import connect from './db.js'
import { ObjectID } from 'mongodb'



let methods  = {


    validateData : (data) => {
        for (const [key, value] of Object.entries(data)) {
            if(!value){
              return false
            }
        }
        return true
    },

    

    // jer je skoro identičan postupak za dodavanje partnera i projekta
    pushData : async (data, collectionName) => {
        data.createdDate = Date.now()
        
        if (!methods.validateData(data)) {
            res.json({status: 'Missing data'})
            return
        }
            
        let db = await connect()

        
        try{
            let insertResult = await db.collection(collectionName).insertOne(data);
            let id = insertResult.insertedId
            if(insertResult && id){ 
                // pushanje projectId-a u listu projekata određenog partnera
                if(collectionName === 'projects'){
                    await db.collection('partners').updateOne( { _id: ObjectID(data.partnerID) },{ $addToSet:{ "projects": id}}, true);
                }
                
                return data
            }
        }
        
        catch(e){
                throw new Error("Error accured during inserting project or partner")
        } 
    },


   
    addPartner : async (partnerData) => {

        try{
            let result = await methods.pushData(partnerData, 'partners')
    
            return result
        }
        catch(e){
            res.status(500).json({ error: e.message});
        }   
    },


    // identičan postupak za promjenu info partnera i projekta
    changeInfo : async (project, collectionName) => {
        let db = await connect();
        let result
    
        //da se ne salje i ID u update
        let id = project.id
        delete project.id
                                            //za ovakav update više odgovara put, a ne patch?
        if (project.updateDoc==='true')    result = await db.collection(collectionName).updateOne( { _id: ObjectID(id) },{ $set: project });
        else                               result = await db.collection(collectionName).deleteOne( { _id: ObjectID(id) } );
                                

        if (result.modifiedCount == 1 || result.deletedCount == 1)  return 'success'
        else return 'fail'
    },



    mapAttributes : async (projectData) =>{
        //vidjeti moze li se to izvesti kako bolje
        let project = {
                ime_poslodavca: projectData.company,
                opis_projekta: projectData.project_description,
                datum_dodavanja: Date.now(),
                email_kontakt_osobe: projectData.project_contact,
                tehnologije: projectData.project_technologies,
                preference: projectData.project_prefrences,
                potrebe_za_obavljanje: projectData.project_required,
                trajanje: projectData.project_duration,
                lokacija: projectData.project_location,
                napomena: projectData.project_note,
        }
        return project
    },


    
    //  identičan postupak za pretragu partnera i projekta
    search : async (query, atributi, collectionName) =>{
        let db = await connect()

        let selekcija = {}
        
        if(query._any){
            let pretraga = query._any
            let terms = pretraga.split(' ')
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

        let cursor = await db.collection(collectionName).find(selekcija).sort({ime_poslodavca: 1})

        let results =  await cursor.toArray()
        
        return results
    },



}



export default methods