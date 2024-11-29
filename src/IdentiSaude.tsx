import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, Pressable, TouchableOpacity, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { CameraOptions, ImageLibraryOptions, MediaType, launchImageLibrary } from 'react-native-image-picker';
import { launchCamera } from 'react-native-image-picker';
import { PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

const API_KEY = '17EW49tOnvGOUMxCzS2k9HPMSQRdZh7GvqmhzKlFImKjtwj7YH';
const API_URL = 'https://plant.id/api/v3/identification';
const API_URL_HEALTH = "https://plant.id/api/v3/health_assessment";

export default function IdentiSaude() {
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const [imagemBase64, setImagemBase64] = useState<string | undefined>(undefined);
  const [latitude, setlatitude] = useState<number | undefined>(undefined);
  const [longitude, setlongitude] = useState<number | undefined>(undefined);
  const [mostrarModal1, setMostrarModal1] = useState(false);
  const [nomePlantas, setNomePlantas] = useState<any>();
  const [imagemResposta, setimagemResposta] = useState('../assets/images/GARDENFY.jpg');
  const [probabilidadePlantas, setProbabilidadePlantas] = useState(0);
  const [botaoClicado, setBotaoClicado] = useState("");
  const [modo, setModo] = useState("");
  const [isPlant, setIsPlant] = useState(false)
  const [isSaudavel, setIsSaudavel] = useState(false);
  const [nomeDoenca, setNomeDoenca] = useState();
  const [fotoDoenca, setFotoDoenca] = useState();
  const [probabilidadeDoenca, setProbabilidadeDoenca] = useState(0);
  const [similaridade, setSimilaridade] = useState(0);
  const [similaridadeIdenti, setSimilaridadeIdenti] = useState(0);
  const [modalIdenti, setModalIdenti] = useState(false);
  const [modalSaude, setModalSaude] = useState(false);
  const [nomeBr, setNomeBr] = useState('');
  const [accessToken, setAccessToken] = useState();
  const [imagemPlanta, setImagemPlanta] = useState<string | undefined>(undefined);
  const [imagemReal, setImagemReal] = useState<string | undefined>(undefined);
  const [pronto, setPronto] = useState(false)
  const [carregando, setCarregando] = useState('Carregando...');
  const [cont, setCont] = useState(0);


  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      if (!user) {
        auth()
          .signInAnonymously()
          .catch(error => {
            if (error.code === 'auth/operation-not-allowed') {
              console.warn('Enable anonymous in your firebase console.');
            }
            console.error(error);
          });
      }
    });
    return subscriber;
  }, []);

  const uploadFirebase = async (uri: any) => {
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const reference = storage().ref(filename);
    const task = reference.putFile(uri);

    try {
      await task;
      const url = await reference.getDownloadURL();
      console.log('Image uploaded to Firebase Storage:', url);
      setImagemReal(url);
      setCont(param => param + 1);
    } catch (e) {
      console.error(e);
    }
  }

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Permissão para pegar sua localização",
          message: "O aplicativo precisa da localização para melhor precisão da planta",
          buttonNeutral: "Me pergunte depois",
          buttonNegative: "Cancelar",
          buttonPositive: "OK"
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Permissão da localização dada");
        pegarLocalização();
      } else {
        console.log("Permissão da localização negada");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const requestCameraPermission = async ({ id }: { id: any }) => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Permissão do aplicativo da câmera",
          message: "O aplicativo precisa da permissão do uso da Câmera",
          buttonNeutral: "Me pergunte depois",
          buttonNegative: "Cancelar",
          buttonPositive: "OK"
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Permissão da camera dada");
        if (id == 1) {
          setBotaoClicado("Identificar Planta")
          setModo("Tirar outra Foto")
        } else if (id == 2) {
          setBotaoClicado("Identificar Planta")
          setModo("Selecionar outra imagem")
        } else if (id == 3) {
          setBotaoClicado("Verificar Saúde")
          setModo("Tirar outra Foto")
        } else {
          setBotaoClicado("Verificar Saúde")
          setModo("Selecionar outra imagem")
        }
        tirarFoto();
      } else {
        console.log("Permissão da camera negada");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const selecionarImagem = ({ id }: { id: any }) => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo' as MediaType,
      includeBase64: false
    }

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        Alert.alert('Escolha cancelada', 'Usuário cancelou a escolha da imagem', [
          {
            text: 'cancelar',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel'
          },
          {
            text: 'OK',
            onPress: () => console.log('OK Pressed'),
            style: 'default'
          }
        ])
      } else if (response.errorCode) {
        console.log('Erro na escolha da Imagem: ', response.errorMessage)
      } else if (response.assets && response.assets.length > 0) {
        // setImagemBase64(response.assets[0].base64)
        // console.log('Imagem: ' + response.assets[0].base64)
        setImagemPlanta(response.assets[0].uri)
        console.log(response.assets[0].uri)
        uploadFirebase(response.assets[0].uri)
        setMostrarModal1(true)
        if (id == 1) {
          setBotaoClicado("Identificar Planta")
          setModo("Tirar outra Foto")
        } else if (id == 2) {
          setBotaoClicado("Identificar Planta")
          setModo("Selecionar outra imagem")
        } else if (id == 3) {
          setBotaoClicado("Verificar Saúde")
          setModo("Tirar outra Foto")
        } else {
          setBotaoClicado("Verificar Saúde")
          setModo("Selecionar outra imagem")
        }
      }
    });
  }

  const tirarFoto = () => {
    const options: CameraOptions = {
      mediaType: 'photo' as MediaType,
      includeBase64: false
    }

    launchCamera(options, (response) => {
      if (response.didCancel) {
        Alert.alert('Foto Cancelada', 'Usuário cancelou a ação', [
          {
            text: 'cancelar',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel'
          },
          {
            text: 'OK',
            onPress: () => console.log('OK Pressed'),
            style: 'default'
          }
        ])
      } else if (response.errorCode) {
        console.log('Erro na ação: ', response.errorMessage)
      } else if (response.assets && response.assets.length > 0) {
        // setImagemBase64(response.assets[0].base64)
        // console.log('Imagem: ' + response.assets[0].base64)
        setImagemPlanta(response.assets[0].uri)
        console.log(response.assets[0].uri)
        uploadFirebase(response.assets[0].uri)
        setMostrarModal1(true)
      }
    });
  }

  const pegarLocalização = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setlatitude(position.coords.latitude);
        setlongitude(position.coords.longitude);
      },
      (error) => {
        console.log(error.code, error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }

  const idDaPlanta = async () => {
    axios.post(`${API_URL}?details=common_names,watering,best_light_condition,best_watering`, {
      "images": imagemReal,
      "latitude": latitude,
      "longitude": longitude,
      "similar_images": true
    },
      {
        headers: {
          "Api-key": API_KEY,
          "Content-Type": "application/json"
        }
      })
      .then(response => {
        console.log(response.data.result)
        console.log(response.data.result.classification.suggestions)
        console.log(response.data.result.classification.suggestions[0].name)
        console.log(response.data.result.classification.suggestions[0].similar_images[0].url)
        console.log(response.data.result.is_plant.binary)
        if (response.data.result.is_plant.binary != true) {
          setImagemReal(undefined)
          setCont(0)
          Alert.alert('Foto Não Corresponde', 'A foto não contém plantas', [
            {
              text: 'cancelar',
              onPress: () => { console.log('Cancel Pressed'); setPronto(false) },
              style: 'cancel'
            },
            {
              text: 'OK',
              onPress: () => { console.log('OK Pressed'); setPronto(false) },
              style: 'default'
            }

          ])
        } else {
          setCont(0)
          setNomePlantas(response.data.result.classification.suggestions[0].name);
          setProbabilidadePlantas(response.data.result.classification.suggestions[0].probability);
          setimagemResposta(response.data.result.classification.suggestions[0].similar_images[0].url);
          setProbabilidadePlantas(sla => sla * 100)
          setSimilaridadeIdenti(response.data.result.classification.suggestions[0].similar_images[0].similarity);
          setSimilaridadeIdenti(sla => sla * 100);
          setAccessToken(response.data.access_token)
        }
      })
      .catch(error => {
        console.log(error)
        console.log("Deu erro: ", error.response ? error.response.data : error.message);
        if (error.response) {
          console.log("Status do erro: ", error.response.status);
          console.log("Headers do erro: ", error.response.headers);
        }
      });
  }

  const chatBot1 = () => {
    axios.post(`${API_URL}/${accessToken}/conversation`, {
      "question": "What is the common name of this plant in portuguese. Answer only with the name",
    },
      {
        headers: {
          "Api-Key": API_KEY,
          "Content-Type": "application/json"
        }
      })
      .then(response => {
        console.log("5: ", response.data)
        setNomeBr(response.data.messages[1].content)
        setMostrarModal1(false)
        setModalIdenti(true)
        setPronto(false)
        setImagemReal(undefined)
      })
      .catch(error => {
        console.log("Deu erro: ", error.response ? error.response.data : error.message);
        if (error.response) {
          console.log("Status do erro: ", error.response.status);
          console.log("Headers do erro: ", error.response.headers);
        }
      })
  }

  useEffect(() => {
    if (accessToken != undefined) {
      chatBot1();
    }
  }, [accessToken]);


  const mostrarSaude = async () => {
    axios.post(API_URL_HEALTH, {
      'images': imagemReal,
      'latitude': latitude,
      'longitude': longitude,
      'similar_images': true
    }, {
      headers: {
        "Api-key": API_KEY,
        "Content-Type": "application/json"
      }
    })
      .then(response => {
        setMostrarModal1(false)
        console.log(response.data)
        if (response.data.result.is_plant.binary != true) {
          setImagemReal(undefined)
          setCont(0)
          Alert.alert('Foto Não Corresponde', 'A foto não contém plantas', [
            {
              text: 'cancelar',
              onPress: () => { console.log('Cancel Pressed'); setPronto(false) },
              style: 'cancel'
            },
            {
              text: 'OK',
              onPress: () => { console.log('OK Pressed'); setPronto(false) },
              style: 'default'
            }
          ])
        } else {
          if (response.data.result.is_healthy.binary == true) {
            setImagemReal(undefined)
            setCont(0)
            Alert.alert('Planta saudável', 'A planta da foto não apresenta doenças.', [
              {
                text: 'OK',
                onPress: () => { console.log('OK Pressed'); setPronto(false) },
                style: 'default'
              }
            ])
          } else {
            setCont(0)
            setPronto(false)
            setModalSaude(true)
            setNomeDoenca(response.data.result.disease.suggestions[0].name)
            setProbabilidadeDoenca(response.data.result.disease.suggestions[0].probability)
            setProbabilidadeDoenca(paramProbabilidade => paramProbabilidade * 100)
            setFotoDoenca(response.data.result.disease.suggestions[0].similar_images[0].url)
            setSimilaridade(response.data.result.disease.suggestions[0].similar_images[0].similarity)
            setSimilaridade(paramSimilaridade => paramSimilaridade * 100)
            setImagemReal(undefined)
          }
        }
      })

      .catch(error => {
        console.log("Deu erro: ", error.response ? error.response.data : error.message);
        if (error.response) {
          console.log("Status do erro: ", error.response.status);
          console.log("Headers do erro: ", error.response.headers);
        }
      })
  }

  const pegarAcao = () => {
    if (botaoClicado == "Verificar Saúde") {
      mostrarSaude();
    } else {
      idDaPlanta();
    }
  }

  const pegarModo = () => {
    if (modo == "Tirar outra Foto") {
      tirarFoto();
      setMostrarModal1(false)
    } else {
      if (botaoClicado == "Identificar Planta") {
        selecionarImagem({ id: 2 });
      } else {
        selecionarImagem({ id: 4 });
      }
      setMostrarModal1(false)
    }
  }

  useEffect(()=>{
    if(cont == 2){
      pegarAcao();
    }
  }, [cont]);

  return (
    <View style={styles.body}>
      <Image source={require('../assets/images/fundoRegistro.png')}
        style={styles.backgroundImage}
      />
      <Modal visible={pronto}>
        <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1, backgroundColor: '#EFEDED' }}>
          <ActivityIndicator size="large" color="#90C9BC" />
          <Text style={{ color: "#90C9BC", fontFamily: 'Jomhuria-Regular', fontSize: 73 }}>{carregando}</Text>
        </View>
      </Modal>
      <Modal visible={modalIdenti}>
        <View style={styles.modalIdentiConteudo}>
          <Image source={require('../assets/images/fundoLogin.png')}
            style={styles.backgroundImage}
          />
          <TouchableOpacity
            onPress={() => {
              setModalIdenti(false)
            }}
            style={styles.voltar}
          >
            <FontAwesome name="chevron-left" size={25} color={"#3A3A3A"}></FontAwesome>
          </TouchableOpacity>
          <Image style={styles.imagemModalIdenti}
            source={{
              uri: imagemResposta
            }}
          />
          <View style={styles.conteudoModalIdenti}>
            <Text style={{ color: "#90C9BC", textAlign: 'center', fontSize: 30, fontFamily: 'InriaSans-Bold', marginBottom: 12, marginTop: 12 }}>{nomeBr}</Text>
            <Text style={{ color: "#AFA4A4", width: '90%', fontFamily: 'InriaSans-Bold', fontSize: 20, marginLeft: '5%' }}>Chance de ser: {Math.trunc(probabilidadePlantas)}%</Text>
            <Text style={{ color: "#AFA4A4", width: '90%', fontFamily: 'InriaSans-Bold', fontSize: 20, marginLeft: '5%', marginBottom: 12 }}>Similaridade com foto: {Math.trunc(similaridadeIdenti)}%</Text>
          </View>
        </View>
      </Modal>
      <Modal visible={modalSaude}>
        <View style={styles.modalIdentiConteudo}>
          <Image source={require('../assets/images/fundoLogin.png')}
            style={styles.backgroundImage}
          />
          <TouchableOpacity
            onPress={() => {
              setModalSaude(false)
            }}
            style={styles.voltar}
          >
            <FontAwesome name="chevron-left" size={25} color={"#3A3A3A"}></FontAwesome>
          </TouchableOpacity>
          <Image style={styles.imagemModalIdenti}
            source={{
              uri: fotoDoenca
            }}
          />
          <View style={styles.conteudoModalIdenti}>
            <Text style={{ color: "#90C9BC", textAlign: 'center', fontSize: 30, fontFamily: 'InriaSans-Bold', marginBottom: 12, marginTop: 12 }}>{nomeDoenca}</Text>
            <Text style={{ color: "#AFA4A4", width: '90%', fontFamily: 'InriaSans-Bold', fontSize: 20, marginLeft: '5%' }}>Chance de ser: {Math.trunc(probabilidadeDoenca)}%</Text>
            <Text style={{ color: "#AFA4A4", width: '90%', fontFamily: 'InriaSans-Bold', fontSize: 20, marginLeft: '5%', marginBottom: 12 }}>Similaridade com foto: {Math.trunc(similaridade)}%</Text>
          </View>
        </View>
      </Modal>
      <Modal visible={mostrarModal1} transparent={true}>
        <View
          style={styles.modalConteudo}
        >
          <View style={styles.cardModal}>
            <Image source={{ uri: imagemPlanta }}
              style={styles.imagemEscolhida}
            />
            <View style={styles.Botoes}>
              <TouchableOpacity style={styles.botao3} onPress={()=> {setCont(param => param+1); setPronto(true)}}>
                <Text style={[styles.textoBotoesModal1, { color: '#90C8BB' }]}>{botaoClicado}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoTrocar} onPress={pegarModo}>
                <Text style={[styles.textoBotoesModal1, { color: '#90C8BB' }]}>{modo}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoCancelar} onPress={() => { setMostrarModal1(false) }}>
                <Text style={[styles.textoBotoesModal1, { color: '#FF7878' }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={{ marginTop: 60 }}>
        <Text style={styles.tituloPlantas}>Plantas</Text>
        <Text style={styles.subtituloPlantas}>Obtenha informações sobre uma planta</Text>
      </View>
      <View style={styles.conteudo}>
        <View style={styles.cardIdentificarPlanta}>
          <View style={{ marginBottom: 22 }}>
            <Text style={styles.textoCard}>Identifique uma planta</Text>
          </View>
          <TouchableOpacity style={styles.botao1} onPress={() => requestCameraPermission({ id: 1 })}>
            <FontAwesome name="camera" size={16} color={"#ffffff"} style={{ position: 'absolute', left: 14 }}></FontAwesome>
            <Text style={styles.textoBotoesCards}>Tirar Foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botao2} onPress={() => selecionarImagem({ id: 2 })}>
            <FontAwesome name="image" size={16} color={"#ffffff"} style={{ position: 'absolute', left: 14 }}></FontAwesome>
            <Text style={styles.textoBotoesCards}>Selecionar Imagem</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardSaudePlanta}>
          <View style={{ marginBottom: 22 }}>
            <Text style={styles.textoCard}>Veja a saúde de uma planta</Text>
          </View>
          <TouchableOpacity style={styles.botao1} onPress={() => requestCameraPermission({ id: 3 })}>
            <FontAwesome name="camera" size={16} color={"#ffffff"} style={{ position: 'absolute', left: 14 }}></FontAwesome>
            <Text style={styles.textoBotoesCards}>Tirar Foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botao2} onPress={() => selecionarImagem({ id: 4 })}>
            <FontAwesome name="image" size={16} color={"#ffffff"} style={{ position: 'absolute', left: 14 }}></FontAwesome>
            <Text style={styles.textoBotoesCards}>Selecionar Imagem</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  voltar: {
    position: 'absolute',
    left: 15,
    top: 50,
    zIndex: 2
  },
  conteudo: {
    flex: 1,
    zIndex: 2,
    justifyContent: 'space-evenly',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    zIndex: 1,
    position: 'absolute'
  },
  modalConteudo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)'
  },
  imagemEscolhida: {
    borderWidth: 2,
    borderColor: '#76BDAC',
    width: 300,
    height: 300,
    borderRadius: 10
  },
  tituloPlantas: {
    fontFamily: 'InriaSans-Bold',
    color: 'black',
    fontSize: 36,
    width: 322
  },
  subtituloPlantas: {
    fontFamily: 'InriaSans-Bold',
    color: '#9D9292',
    fontSize: 16,
    width: 322,
    borderBottomWidth: 1,
    borderColor: '#9D9292'
  },
  textoCard: {
    color: 'black',
    width: 286,
    fontFamily: 'InriaSans-Bold',
    fontSize: 21,
  },
  cardIdentificarPlanta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 322,
    height: 196,
    borderWidth: 1,
    borderColor: '#AFA4A4',
    borderRadius: 10,
    backgroundColor: 'white',
  },
  cardSaudePlanta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 322,
    height: 196,
    borderWidth: 1,
    borderColor: '#AFA4A4',
    borderRadius: 10,
    backgroundColor: 'white',
  },
  textoBotoesCards: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Lexend-VariableFont_wght',
    fontWeight: '900'
  },
  botao1: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#90C8BB',
    width: 286,
    height: 40,
    borderRadius: 7,
    marginBottom: 13
  },
  botao2: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#5D9B8C',
    width: 286,
    height: 40,
    borderRadius: 7
  },
  botaoCancelar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#FF7878',
    backgroundColor: "white",
    borderWidth: 2,
    width: 300,
    height: 50,
    borderRadius: 7
  },
  botao3: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#76BDAC',
    backgroundColor: "white",
    borderWidth: 2,
    width: 300,
    height: 50,
    borderRadius: 7
  },
  textoBotoesModal1: {
    fontSize: 18,
    fontFamily: 'Lexend-VariableFont_wght',
    fontWeight: '900'
  },
  Botoes: {
    marginTop: 15
  },
  botaoTrocar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#76BDAC',
    backgroundColor: "white",
    borderWidth: 2,
    width: 300,
    height: 50,
    borderRadius: 7,
    marginBottom: 10,
    marginTop: 10
  },
  cardModal: {
    padding: 20,
    borderColor: '#76BDAC',
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 2
  },
  modal: {
    opacity: 0.9
  },
  modalSaudeConteudo: {
    height: '100%',
    backgroundColor: 'white'
  },
  modalIdentiConteudo: {
    height: '100%',
    backgroundColor: 'white',
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2
  },
  imagemModalIdenti: {
    borderWidth: 2,
    borderColor: 'black',
    width: 350,
    height: 350,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    zIndex: 2
  },
  conteudoModalIdenti: {
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: '#90C9BC',
    width: 350,
    justifyContent: 'center',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: 'white',
    zIndex: 2
  },
  modalCarregar: {

  }
});
