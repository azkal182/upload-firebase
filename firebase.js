const admin = require("./node_modules/firebase-admin");
const serviceAccount = require("./creds.json");
//const { Timestamp } = require("firebase/firestore");

//const data = require('../drakor/serialData-page-9.json');

const collectionKey = "seriesData"; //name of the collection
admin.initializeApp({
 credential: admin.credential.cert(serviceAccount),
});
const firestore = admin.firestore();
const settings = { timestampsInSnapshots: true };
firestore.settings(settings);

exports.sendData = async function (data) {
 //const today = Timestamp.fromDate(new Date());
 const today = admin.firestore.FieldValue.serverTimestamp()
 let updated = 0;
 let added = 0;

 //console.log(today)
 if (data && typeof data === "object") {
  for (const index in data) {
   data[index].uploaded = today
//console.log(data[index])
    const docRef = firestore.collection("seriesData").doc(data[index].id);

    try {
      const doc = await docRef.get();
      if (doc.exists) {
       updated++
        docRef.update(data[index])

        //console.log("Document ID sudah ada di database" + index);
      } else {
       docRef.set(data[index])
       //docRef.update(data[index])
        added++;
        //console.log("Document ID tidak ada di database");
        // Menambahkan data ke database disini
      }
    } catch (error) {
      console.log("Error:", error);
    }

  }



  //console.log(`${added} document baru ditambahkan ke database`);
  //console.log(`${updated} document sudah ada di database dan diperbarui`);

  return ({ updated, added });

  //old loop
  /*
Object.keys(data).forEach(docKey => {
 data[docKey].uploaded = today
//console.log(data[docKey])

// Mengambil referensi ke document di Firestore
//var docRef = firestore.doc(`seriesData/${data[docKey].id}`);
const docRef = firestore.collection('seriesData').doc(data[docKey].id)

// Mencari document dengan document ID yang diberikan
docRef.get().then(function(doc) {
  if (doc.exists) {
   //docRef.update(data[docKey])
   updated+1
    console.log('Document ID sudah ada di database');
  } else {
   //docRef.set(data[docKey])
   added+1
    console.log('Document ID tidak ada di database');
    // Menambahkan data ke database disini
  }
}).catch(function(error) {
  console.log('Error:', error);
});








});
*/
 }
 //console.log(updated)

 //return ({updated, added})
};

//sendData(require('../drakor/serialData-page-9.json'))

/*
 firestore.collection(collectionKey).doc(docKey).set(data[docKey]).then((res) => {
    console.log("Document " + docKey + " successfully written!");
}).catch((error) => {
   console.error("Error writing document: ", error);
});


*/
