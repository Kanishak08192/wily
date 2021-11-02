import React from 'react';
import { Button, View, Text, ScrollView,FlatList} from 'react-native';
//import{FlatList} from 'react-native-elements';
import db from '../config';

export default class SearchScreen extends React.Component{
    constructor(props){
        super(props);
        this.state={
            allTransactions:[]           

        }       
        
    }

    componentDidMount=async ()=>{
        const query=await db.collection("transactions").get();
        query.docs.map((doc)=>{
            this.setState({
                allTransactions:[...this.state.allTransactions,doc.data()]
            })
        })
    }

    render(){
        return(
           <FlatList
           data={this.state.allTransactions}
           
               renderItem={({item})=>(
                
                     
                         <View  style={{borderBottomWidth:2}}>
                             <Text>
                                 {"bookId: "+item.bookId}
                             </Text>
                             <Text>
                                 {"studentId: "+item.studentId}
                             </Text>
                             <Text>
                                 {
                                    "transactionType: "+item.transactionType
                                 }
                             </Text>
                             <Text>
                                 {"date: "+item.date.toDate()}
                             </Text>
                         </View>
                     
                     )
                  }

                  keyExtractor={(item,index)=>index.toString()}
                   
               
           />
        )
    }


}