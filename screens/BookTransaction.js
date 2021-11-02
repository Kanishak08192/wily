import React from 'react';
import {  View, Text,TouchableOpacity,StyleSheet, TextInput, Image, KeyboardAvoidingView} from 'react-native';
import * as Permissions from 'expo-permissions'
import {BarCodeScanner} from 'expo-barcode-scanner'
import * as firebase from 'firebase'
import db from '../config.js'


export default class BookTransaction extends React.Component{
    constructor(){
        super();
        this.state={
            hasCameraPermissions:null,
            scanned:false,
            scannedData:'',
            buttonState:"normal",
            scannedBookId:'',
            scannedStudentId:'',
            transactionMessage:''
        }
    }

    getCameraPermission =async(id)=>{
        const {status}=await Permissions.askAsync(Permissions.CAMERA);
        this.setState({
            hasCameraPermissions:status==="granted",
            buttonState:id,
            scanned:false
        })
    }

    handleBarCodeScanned=async({type,data})=>{
        const {buttonState}=this.state

        if(bookState==="BookId"){
            this.setState({
                scanned:true,
                scannedBookId:data,
                buttonState:'normal'
            })
        }

        else if(buttonState==="StudentId") {
            this.setState({
                scanned:true,
                scannedBookId:data,
                buttonState:'normal'
            })
        }
    }

    handleTransaction=async()=>{
        //Verify if the student is eligible for book issue or book return or none
        //Student Id exists in database or not
        //Issue:No of books issued <2
        //Issue:Verify book availability
        //Return:Last transaction->book issued by the student id
        var transactionType=await this.checkBookEligibility();
        console.log(transactionType)
        if(!transactionType){
            alert("The book doesn't exist in library database")
            this.setState({
                scannedStudentId:'',
                scannedBookId:''
            })
        }

        else if(transactionType==="issue"){
            var isStudentEligible=await this.checkStudentEligibilityForBookIssue();
            if(isStudentEligible){
                this.initiateBookIssue();
                alert("Book isuued to the student ")
            }
        }

        else{
            var isStudentEligible=await this.checkStudentEligibilityForReturn();
            if(isStudentEligible){
                this.initiateBookReturn();
                alert("Book returned to the library")
            }
        }
      
       /* var transactionMessage
        db.collection("books").doc(this.state.scannedBookId).get()
        .then((doc)=>{
            var book=doc.data()
            if(book.bookAvailability){
                this.initiateBookIssue();
                transactionMessage="book issued"
                alert(transactionMessage)
                console.log(transactionMessage)
            }

            else{
                this.initiateBookReturn();
                transactionMessage="book returned"
                alert(transactionMessage)

            }
        })
        this.setState({
            transactionMessage:transactionMessage
        })*/
        
    }

    checkStudentEligibilityForBookIssue=async()=>{
        const studentRef=await db.collection("students").where("studentId","==",this.state.scannedStudentId).get()
        var isStudentEligible=""
        if(studentRef.docs.length===0){
            this.setState({
                scannedStudentId:'',
                scannedBookId:''
            })
            isStudentEligible=false
            alert("The student Id doesn't exsist in database")
        }
        else{
            studentRef.docs.map((doc)=>{
                var student=doc.data();
                if(student.numberOfBooksIssued<2){
                    isStudentEligible=true
                }
                else{
                    isStudentEligible=false
                    alert("The student has already issued 2 books")
                    this.setState({
                        scannedBookId:'',
                        scannedStudentId:''
                    })
                }

            })
        }
        return isStudentEligible;
    }

    checkStudentEligibilityForReturn=async()=>{
        const transactionRef=await db.collection("transactions").where("bookId","==",this.state.scannedBookId).limit(1).get()
        var isStudentEligible=""

        transactionRef.docs.map((doc)=>{
            var lastBookTransaction=doc.data();
            if(lastBookTransaction.studentId===this.state.scannedStudentId){
                isStudentEligible=true
            }
            else{
                isStudentEligible=false
                alert("The book wasn't issued by this student")
                this.setState({
                    scannedBookId:'',
                    scannedStudentId:''
                })
            }
        })

        return isStudentEligible
    }

    checkBookEligibility=async()=>{
        const bookRef=await db.collection("books").where("bookId","==",this.state.scannedBookId).get()
        var transactionType=""
       
        if(bookRef.docs.length===0){
            transactionType=false
        }
        else{
            bookRef.docs.map((doc)=>{
                var book=doc.data();
                console.log(book)
                if(book.bookAvailability){
                    transactionType="issue"
                }
                else{
                    transactionType="return"
                }
            })
        }
        return transactionType
        console.log(transactionType)
    }

    initiateBookReturn=async()=>{

        //add a transcation
        db.collection("transactions").add({
            'studentId':this.state.scannedStudentId,
            'bookId':this.state.scannedBookId,
            'date':firebase.firestore.Timestamp.now().toDate(),
            'transactionType':"return"

        })

        //change book status
        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability':true
        })

        //change book status for student
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued':firebase.firestore.FieldValue.increment(-1)
        })

        this.setState({
            scannedStudentId:'',
            scannedBookId:''
        })
    }

    initiateBookIssue=async()=>{
        console.log(this.state)
        //add a transcation
        db.collection("transactions").add({
            'studentId':this.state.scannedStudentId,
            'bookId':this.state.scannedBookId,
            'date':firebase.firestore.Timestamp.now().toDate(),
            'transactionType':"issue"

        })

        //change book status
        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability':false
        })

        //change book status for student
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued':firebase.firestore.FieldValue.increment(1)
        })

        this.setState({
            scannedStudentId:'',
            scannedBookId:''
        })
    }
    render(){
        const hasCameraPermissions=this.state.hasCameraPermissions
        const scanned=this.state.scanned
        const buttonState=this.state.buttonState
        if(buttonState!=="normal" && hasCameraPermissions ){
          return(
              <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}/>
          )
        }
        else if(buttonState==="normal"){
        return(
            <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
            <View>
                <Image source={require('../assets/booklogo.jpg')}
                style={{
                    width:200,
                    height:200
                }}/>
                <Text style={{
                    textAlign:'center',
                    fontSize:30
                }}>Wily</Text>
            </View>
            <View style={styles.inputView}>
                <TextInput
                
                style={styles.inputBox}
                placeholder="bookId"
                onChangeText={(text)=>{
                    this.setState({
                        scannedBookId:text
                    })
                }}
                value={this.state.scannedBookId}/>
                <TouchableOpacity style={styles.scanButton}
                onPress={()=>{
                    this.getCameraPermission("BookId")
                }}>
                    <Text style={styles.buttonText}>scan</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.inputView}>
                <TextInput
                style={styles.inputBox}
                placeholder="studentId"
                onChangeText={(text)=>{
                    this.setState({
                        scannedStudentId:text
                    })
                }}
                value={this.state.scannedStudentId}/>

                <TouchableOpacity style={styles.scanButton}
                onPress={()=>{
                    this.getCameraPermission("StudentId")
                }}>
                    <Text style={styles.buttonText}>scan</Text>
                </TouchableOpacity>
            </View>
            

            <TouchableOpacity style={styles.submitButton}
            onPress={async ()=>{
               var transactionMessage=await this.handleTransaction();
               
            }}>
                <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>

           
            </KeyboardAvoidingView>
        )
    }

    }
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' }, displayText:{ fontSize: 15, textDecorationLine: 'underline' }, scanButton:{ backgroundColor: '#2196F3', padding: 10, margin: 10 }, buttonText:{ fontSize: 15, textAlign: 'center', marginTop: 10 }, inputView:{ flexDirection: 'row', margin: 20 }, inputBox:{ width: 200, height: 40, borderWidth: 1.5, borderRightWidth: 0, fontSize: 20 }, scanButton:{ backgroundColor: '#66BB6A', width: 50, borderWidth: 1.5, borderLeftWidth: 0 },
submitButton:{
    backgroundColor: '#FBC02D',
    width: 100,
    height:50
  },
  submitButtonText:{
    padding: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight:"bold",
    color: 'white'
  } });