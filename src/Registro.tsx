import axios from 'axios';
import React from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Registro({ navigation }: { navigation: any }) {
    const [nome, setNome] = useState<any>();
    const [email, setEmail] = useState<any>();
    const [senha, setSenha] = useState<any>();
    
    const storeData = async (value: any) => {
        try {
          const usuarioId = JSON.stringify(value);
          await AsyncStorage.setItem('usuario_id', usuarioId);
        } catch (e) {
          console.log('erro no salvar: ',e);
        }
      };

    const onPressHandler = async() => {
        axios.post(`https://gardenfyrotas-production.up.railway.app/registro`, {nome, email, senha},
        {
            headers: {
            "Content-Type": "application/json",
            }
        })
        .then(response => {
            console.log(response)
            if(response.data.success != false){
                const usuario_id = response.data.usuarioId;
                storeData(usuario_id)
                navigation.replace('Screen_C')
            }
            else{
                setEmail('')
                Alert.alert('Email já cadastrado', 'Esse email já está em uso', [
                    {
                    text: 'Digitar outro',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel'
                    },
                    {
                    text: 'Fazer login',
                    onPress: () => navigation.replace('Screen_D'),
                    style: 'default'
                    }
                ])
            }
        })
        .catch(error => {
            console.log("Deu erro: ", error.response ? error.response.data : error);
            if (error.response) {
            console.log("Status do erro: ", error.response.status);
            console.log("Headers do erro: ", error.response.headers);
            }
        })
    }

    const onPressLetter = () => {
        navigation.navigate('Screen_D')
    }

    return (
        <View style={styles.page}>
            <Image source={require('../assets/images/fundoRegistro.png')}
                style={styles.backgroundImage}
            />
            <View style={styles.conteudo}>
                <View>
                    <Text style={styles.titulo}>Registre sua conta</Text>
                </View>
                <View style={{ width: 255, height: 206, justifyContent: "space-evenly"}}>
                    <TextInput style={styles.textoregistro}
                    placeholder='Nome de usuário'
                    placeholderTextColor={"#AFA4A4"}
                    value={nome}
                    onChangeText={setNome}
                    ></TextInput>
                    <TextInput style={styles.textoregistro}
                    placeholder='Email'
                    placeholderTextColor={"#AFA4A4"}   
                    value={email}
                    onChangeText={setEmail}                
                    ></TextInput>
                    <TextInput style={styles.textoregistro}
                    placeholder='Senha'
                    placeholderTextColor={"#AFA4A4"}   
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry                 
                    ></TextInput>
                </View>
                <TouchableOpacity onPress={onPressHandler}>
                    <View style={{ width: 180, height: 41, backgroundColor: "#90C9BC", borderRadius: 90, marginTop: 20, justifyContent: 'center', alignItems: 'center', }}>
                        <Text>REGISTRAR</Text>
                    </View>
                </TouchableOpacity>
                {/* <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 22 }}>
                    <View style={{ height: 1, backgroundColor: 'black', width: 70, margin: 10 }} />
                    <Text style={{ color: 'black', fontSize: 15, }}>OU</Text>
                    <View style={{ height: 1, backgroundColor: 'black', width: 71, margin: 10 }} />
                </View>
                <TouchableOpacity>
                    <Image source={require('../assets/images/G.png')}
                        style={styles.signingoogle}
                    />
                </TouchableOpacity> */}
                <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 30 }}>
                    <Text style={{ color: 'black', fontSize: 16 }}>Já possui uma conta?</Text>
                    <TouchableOpacity
                    onPress={onPressLetter}
                    >
                        <Text style={{ color: '#76BDAC', fontSize: 16, textDecorationLine: 'underline' }}>ENTRAR</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    f1: { 
        flex: 1 
    },
    page: { 
        flex: 1, 
        alignItems: 'center',
        backgroundColor: 'white', 
    },
    conteudo: {
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
    },
    backgroundImage: { 
        width: '100%', 
        height: '100%', 
        opacity: 0.6, 
        position: 'absolute', 
    },
    titulo: { 
        fontFamily: 'InriaSans-Bold',
        fontSize: 36, 
        color: 'black', 
        width: 245
    },
    lineStyle: {
        borderWidth: 0.5,
        borderColor: 'black',
        margin: 0,
    },
    textoregistro: {
        color: '#AFA4A4',
        paddingBottom: 4,
        fontSize: 15,
        marginLeft: 2,
        borderBottomWidth: 2,
        borderColor: '#AFA4A4'
    },
    textobutton: {
        color: 'white',
    },
    signingoogle: {
        width: 230,
        height: 50,
        alignSelf: 'center',
    }
});
