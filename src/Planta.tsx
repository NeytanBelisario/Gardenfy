import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, Pressable, TouchableOpacity, Alert, Modal, FlatList, TextInput, DimensionValue, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { CameraOptions, ImageLibraryOptions, MediaType, launchImageLibrary } from 'react-native-image-picker';
import { launchCamera } from 'react-native-image-picker';
import { PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Jardins from './Jardins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import ImageResizer from 'react-native-image-resizer';

export default function Plantas({ navigation }: { navigation: any }) {
  const [modal1, setmodal1] = useState(false);
  const [modal2, setmodal2] = useState(false);
  const [displaybotao, setdisplaybotao] = useState(false);
  const [plantas, setplantas] = useState<String | any>([]);
  const [imagemBase64, setImagemBase64] = useState<string | undefined>(undefined);
  const [latitude, setlatitude] = useState<number | undefined>(undefined);
  const [longitude, setlongitude] = useState<number | undefined>(undefined);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [accessToken, setAccessToken] = useState();
  const [dadosPlanta, setDadosPlanta] = useState<String | any>([]);
  const [imagemPlanta, setImagemPlanta] = useState<string | undefined>(undefined);
  const [respRega, setRespRega] = useState<any>('');
  const [varnivelagua, setvarnivelagua] = useState();
  const [frequencia, setfrequencia] = useState<string>("");
  const [idAtual, setIdAtual] = useState(0);
  const [jardim_id, setJardim_id] = useState<any>();
  const [nome_jardim, setNome_jardim] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [contBot, setContBot] = useState(0);
  const [botaoClicado, setBotaoClicado] = useState(false);
  const [carregando, setCarregando] = useState('Carregando...');
  const [modalOpcoes, setModalOpcoes] = useState(false)
  const [idEscolhido, setIdEscolhido] = useState();
  const [zindex, setZIndex] = useState(2)

  const API_URL = 'https://plant.id/api/v3/identification';
  const API_KEY = '17EW49tOnvGOUMxCzS2k9HPMSQRdZh7GvqmhzKlFImKjtwj7YH';

  useEffect(() => {
    const sethorario = setInterval(() => {
      setDadosPlanta((param: any[]) => param.map((plantas: any) => {
        let { horas, minutos, segundos } = plantas;
        if (plantas.horas <= 0 && plantas.minutos <= 0 && plantas.segundos <= 0) {
          return plantas;
        }
        if (segundos > 0) {
          segundos -= 1
        } else if (minutos > 0) {
          minutos -= 1;
          segundos = 59;
        } else if (horas > 0) {
          horas -= 1;
          minutos = 59;
          segundos = 59;
        }

        return { ...plantas, horas, minutos, segundos }
      })
      )
    }, 1000)
    return () => clearInterval(sethorario);
  }, [])

  const getData1 = async () => {
    try {
      const value = await AsyncStorage.getItem('jardim_id');
      console.log(value)
      if (value !== null) {
        setJardim_id(value);
      }
    } catch (e) {
      console.log("Deu erro: ", e)
    }
  };

  const getData2 = async () => {
    try {
      const value = await AsyncStorage.getItem('nome_jardim');
      console.log(value)
      if (value !== null) {
        setNome_jardim(value)
      }
    } catch (e) {
      console.log("Deu erro: ", e)
    }
  };

  useEffect(() => {
    getData2();
  }, [])

  useEffect(() => {
    getData1();
  }, [])


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
      setImagemPlanta(url);
    } catch (e) {
      console.error(e);
    }
  }

  const adicionarPlanta = async (nome_planta: any, ultima_rega: any, foto_planta: string | undefined, horas_sol: any, quanti_agua: any, jardim_id: any, nivel_agua: any, nivel_sol: any, frequencia_rega: number) => {
    console.log(nome_planta, ultima_rega, foto_planta, horas_sol, quanti_agua, jardim_id, nivel_agua, nivel_sol, frequencia_rega)
    await axios.post(`https://gardenfyrotas-production.up.railway.app/novaPlanta`, { nome_planta, ultima_rega, foto_planta, horas_sol, quanti_agua, jardim_id, nivel_agua, nivel_sol, frequencia_rega }, {
      headers: {
        "Content-Type": "application/json"
      }
    }).then(response => {
      if (response.data.success != false) {
        setdisplaybotao(true);
        setmodal2(false);
        setModalLoading(false)
        setRespRega("")
        listarPlantas()
      } else {
        console.log(response);
      }
    }).catch(error => {
      console.log(error);
      if (error.response) {
        console.log(error.response);
        console.log("Status do erro: ", error.response.status);
        console.log("Headers do erro: ", error.response.headers);
      }
    });
  };

  const getBarraStyle = (nivelAgua: number) => {
    const nivel = `${nivelAgua * 10}%` as DimensionValue;
    return {
      width: nivel,
    };
  };

  const getBarraStyle2 = (nivelLuz: number) => {
    const nivel = `${nivelLuz * 10}%` as DimensionValue;
    return {
      width: nivel,
    };
  };

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

  const requestCameraPermission = async () => {
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
        tirarFoto();
      } else {
        console.log("Permissão da camera negada");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const nomeDaPlanta = () => {
    axios.post(`${API_URL}?details=common_names,watering,best_light_condition,best_watering`, {
      "images": imagemPlanta,
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
        console.log(response.data.result.classification.suggestions[0].details)
        if (response.data.result.is_plant.binary != true) {
          Alert.alert('Foto Não Corresponde', 'A foto não contém plantas', [
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
        } else {
          setAccessToken(response.data.access_token)
        }
      })
      .catch(error => {
        console.log("Deu erro: ", error.response ? error.response.data : error.message);
        if (error.response) {
          console.log("Status do erro: ", error.response.status);
          console.log("Headers do erro: ", error.response.headers);
        }
      });
  }

  const chatBot6 = () => {
    axios.post(`${API_URL}/${accessToken}/conversation`, {
      "question": "What is the common name of this plant in portuguese. Answer just with the name",
    },
      {
        headers: {
          "Api-Key": API_KEY,
          "Content-Type": "application/json"
        }
      })
      .then(response => {
        console.log(response.data)
        console.log(respRega)
        const frequenciaHoras = parseInt(response.data.messages[7].content) * 24;
        const horasDesdeUltimaRega = parseInt(respRega) * 1;
        const tempoRestante = frequenciaHoras - horasDesdeUltimaRega;
        setDadosPlanta([...dadosPlanta, { planta_id: dadosPlanta.length + 1, nome_planta: response.data.messages[11].content, nivel_sol: response.data.messages[1].content, nivel_agua: response.data.messages[3].content, horas_sol: response.data.messages[5].content, quanti_agua: response.data.messages[9].content, frequencia: response.data.messages[7].content, foto_planta: imagemPlanta, horas: tempoRestante, minutos: 0, segundos: 0 }])
        setIdAtual(param => param + 1)
        adicionarPlanta(response.data.messages[11].content, respRega, imagemPlanta, response.data.messages[5].content, response.data.messages[9].content, jardim_id, response.data.messages[3].content, response.data.messages[1].content, frequenciaHoras);
      })
      .catch(error => {
        console.log("Deu erro: ", error.response ? error.response.data : error.message);
        if (error.response) {
          console.log("Status do erro: ", error.response.status);
          console.log("Headers do erro: ", error.response.headers);
        }
      })
  }

  const chatBot5 = () => {
    axios.post(`${API_URL}/${accessToken}/conversation`, {
      "question": "How many ml each watering this plant needs? Answer only with numbers with ml in the end.",
    },
      {
        headers: {
          "Api-Key": API_KEY,
          "Content-Type": "application/json"
        }
      })
      .then(response => {
        setContBot(param => param + 1);
      })
      .catch(error => {
        console.log("Deu erro: ", error.response ? error.response.data : error.message);
        if (error.response) {
          console.log("Status do erro: ", error.response.status);
          console.log("Headers do erro: ", error.response.headers);
        }
      })
  }

  const chatBot4 = () => {
    axios.post(`${API_URL}/${accessToken}/conversation`, {
      "question": "how often should you water this plant? answer just with the number of days. Ex: 4",
    },
      {
        headers: {
          "Api-Key": API_KEY,
          "Content-Type": "application/json"
        }
      })
      .then(response => {
        setContBot(param => param + 1);
        chatBot5();
      })
      .catch(error => {
        console.log("Deu erro: ", error.response ? error.response.data : error.message);
        if (error.response) {
          console.log("Status do erro: ", error.response.status);
          console.log("Headers do erro: ", error.response.headers);
        }
      })
  }

  const chatBot3 = () => {
    axios.post(`${API_URL}/${accessToken}/conversation`, {
      "question": "How many hours this plant needs in solar light in a day? Answer only with 2 numbers and the termination 'horas'.",
    },
      {
        headers: {
          "Api-Key": API_KEY,
          "Content-Type": "application/json"
        }
      })
      .then(response => {
        setContBot(param => param + 1);
        chatBot4();
      })
      .catch(error => {
        console.log("Deu erro: ", error.response ? error.response.data : error.message);
        if (error.response) {
          console.log("Status do erro: ", error.response.status);
          console.log("Headers do erro: ", error.response.headers);
        }
      })
  }

  const chatBot2 = () => {
    axios.post(`${API_URL}/${accessToken}/conversation`, {
      "question": "How much water this plant needs? Answer with just one number from 0 to 10.",
    },
      {
        headers: {
          "Api-Key": API_KEY,
          "Content-Type": "application/json"
        }
      })
      .then(response => {
        setContBot(param => param + 1);
        chatBot3();
      })
      .catch(error => {
        console.log("Deu erro: ", error.response ? error.response.data : error.message);
        if (error.response) {
          console.log("Status do erro: ", error.response.status);
          console.log("Headers do erro: ", error.response.headers);
        }
      })
  }

  const chatBot1 = () => {
    axios.post(`${API_URL}/${accessToken}/conversation`, {
      "question": "How much light this plant needs? Answer with just one number from 0 to 10.",
      "prompt": "Responda as perguntas em português"
    },
      {
        headers: {
          "Api-Key": API_KEY,
          "Content-Type": "application/json"
        }
      })
      .then(response => {
        setContBot(param => param + 1);
        chatBot2();
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


  useEffect(() => {
    if (dadosPlanta != undefined) {
      console.log(dadosPlanta)
    }
  }, [])

  const selecionarImagem = () => {
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
        // console.log(response.assets[0].base64)
        // setImagemBase64(response.assets[0].base64)
        setImagemPlanta(response.assets[0].uri)
        console.log(response.assets[0].uri)
        uploadFirebase(response.assets[0].uri)
        setmodal1(false);
        setmodal2(true);
      }
    });
  };

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
        // console.log(response.assets[0].base64)
        // setImagemBase64(response.assets[0].base64)
        setImagemPlanta(response.assets[0].uri)
        uploadFirebase(response.assets[0].uri)
        setmodal1(false);
        setmodal2(true);
      }
    });
  }

  const apagarPlanta = (planta_id:any) => {
    axios.delete(`https://gardenfyrotas-production.up.railway.app/deletarPlanta`, {
      headers: {
        "Content-Type": "application/json",
        "planta_id": planta_id
      }
    }).then(response => {
      console.log(response)
      console.log('Planta Apagada')
      setDadosPlanta((prev: any[]) => {
        const novoEstado = prev.filter((item: { planta_id: any; }) => item.planta_id !== planta_id);
        return novoEstado;
      });
    })
  }

  const renderizarplanta = ({ item }: { item: any }) => (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity style={[{ display: modalOpcoes ? 'flex' : 'none', zIndex: 6, borderRadius: 10, position: 'absolute', top: 10, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} onPress={() => {
        setModalOpcoes(false)
        setZIndex(2)
      }}></TouchableOpacity>
      {modalOpcoes && (idEscolhido == item.planta_id) &&
        <View style={styles.modalOpcoes}>
          <TouchableOpacity style={[styles.botoesOpcoes, { borderBottomWidth: 1 }]} onPress={() => {
            Alert.alert('Você regou esta planta?', 'Ao confirmar a ação, a hora para próxima rega será atualizada.', [
              {
                text: 'Não reguei',
                onPress: () => console.log('Cancel Pressed'),
                style: 'cancel'
              },
              {
                text: 'Sim, reguei',
                onPress: () => regueiPlanta(item.planta_id),
                style: 'default'
              }
            ])
            setModalOpcoes(false)
            setZIndex(2)
          }}>
            <Text style={{ color: 'black' }}>Regar</Text>
            <FontAwesome name={'shower'} size={15} style={{ marginLeft: 2, color: 'black', marginTop: 1 }}></FontAwesome>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botoesOpcoes} onPress={() => {
            setModalOpcoes(false)
            setZIndex(2)
            Alert.alert('Você tem certeza disso?', 'Ao apagar essa planta, terá que adicionar ela de volta(caso queira).', [
              {
                text: 'Não apagar',
                onPress: () => console.log('Cancel Pressed'),
                style: 'cancel'
              },
              {
                text: 'Sim, apagar',
                onPress: () => apagarPlanta(item.planta_id),
                style: 'default'
              }
            ])
          }}>
            <Text style={{ color: '#FF001F' }}>Excluir</Text>
            <FontAwesome name="trash" size={15} style={{ marginLeft: 2, color: '#FF001F' }}></FontAwesome>
          </TouchableOpacity>
        </View>
      }
      <View style={styles.planta}>
        <View style={styles.imgplanta}>
          <Image source={{ uri: item.foto_planta }} style={{ height: '100%', width: '90%', borderRadius: 11 }}></Image>
        </View>
        <View style={styles.infoplanta}>
          <TouchableOpacity style={{ position: 'absolute', right: 10, top: 7 }} onPress={() => {
            setModalOpcoes(true)
            setIdEscolhido(item.planta_id)
            setZIndex(4)
          }}>
            <FontAwesome name="navicon" size={20} color={"white"}></FontAwesome>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', width: 231, justifyContent: 'space-between' }}>
            <Text style={styles.nomeplanta}>{item.nome_planta}</Text>
          </View>
          <View>
            <View style={styles.grupoestatisticas}>
              <FontAwesome name="calendar" size={13} style={{ marginLeft: 2, width: '7%' }}></FontAwesome>
              {(item.horas <= 0 && item.minutos <= 0 && item.segundos <= 0) ? (
                <Text style={{ marginLeft: 7, fontFamily: 'Lexend-VariableFont_wght', fontSize: 13 }}>Regue a planta</Text>
              ) : (
                <Text style={{ marginLeft: 7, fontFamily: 'Lexend-VariableFont_wght', fontSize: 13 }}>{item.horas}:{item.minutos}:{item.segundos} </Text>
              )}
            </View>
            <View style={[styles.grupoestatisticas, { justifyContent: 'space-between' }]}>
              <FontAwesome name="tint" size={16} style={{ marginLeft: 2, width: '7%' }}></FontAwesome>
              <View style={[styles.barrasestatisticas]}>
                <View style={[getBarraStyle(item.nivel_agua), { backgroundColor: '#ffffff', position: 'absolute', height: '100%' }]}>

                </View>
              </View>
              <Text style={{ marginLeft: 5, color: 'white' }}>{item.quanti_agua}</Text>
            </View>
            <View style={[styles.grupoestatisticas, { justifyContent: 'space-between' }]}>
              <FontAwesome name="sun-o" size={13}></FontAwesome>
              <View style={styles.barrasestatisticas}>
                <View style={[getBarraStyle2(item.nivel_sol), { backgroundColor: '#ffffff', position: 'absolute', height: '100%' }]}>
                </View>
              </View>
              <Text style={{ marginLeft: 5, color: 'white' }}>{item.horas_sol}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  useEffect(() => {
    if (imagemPlanta != undefined) {
      nomeDaPlanta();
    }
  }, [imagemPlanta])

  useEffect(() => {
    console.log('oi')
    if (contBot == 6) {
      chatBot6();
      setContBot(0);
    } else if (contBot == 5 && botaoClicado == true) {
      chatBot6();
      setContBot(0);
    }
  }, [contBot])

  const listarPlantas = async () => {
    axios.get(`https://gardenfyrotas-production.up.railway.app/listarPlantas`, {
      headers: {
        "Content-Type": "application/json",
        "jardim_id": jardim_id
      }
    }).then(response => {
      console.log(response.data.message[0])
      console.log('aaaaaaaaaaaaaaaaa')
      console.log(response.data.message[0].foto_planta.data);
      if (response.data.message == false) {
        setdisplaybotao(false);
      } else {
        setDadosPlanta(response.data.message);
        setdisplaybotao(true)
      }
    }).catch(err => {
      console.log(err);
      if (err.response) {
        console.log(err.response);
        console.log("Status do erro: ", err.response.status);
        console.log("Headers do erro: ", err.response.headers);
      }
    })
  }

  useEffect(() => {
    listarPlantas();
  }, [jardim_id])

  const regueiPlanta = async (planta_id:any) => {
    axios.patch(`https://gardenfyrotas-production.up.railway.app/reguei`, {
      planta_id: planta_id
    }, {
      headers: {
        "Content-Type": "application/json"
      }
    }).then(response => {
      console.log(response)
      listarPlantas()
    }).catch(err => {
      console.log(err);
      if (err.response) {
        console.log(err.response);
        console.log("Status do erro: ", err.response.status);
        console.log("Headers do erro: ", err.response.headers);
      }
    })
  }

  return (
    <View style={styles.page}>
      <TouchableOpacity style={[styles.fundoPreto, { display: modalOpcoes ? 'flex' : 'none', zIndex: 4 }]} onPress={() => {
        setZIndex(2)
        setModalOpcoes(false)
      }}>
      </TouchableOpacity>
      <View style={styles.cabecalho}>
        <TouchableOpacity style={{ position: 'absolute', left: 0, top: 25 }} onPress={() => {
          navigation.goBack();
        }}>
          <FontAwesome name="chevron-left" size={25} color={"black"}></FontAwesome>
        </TouchableOpacity>
        <Text style={{ fontFamily: "InriaSans-Bold", fontSize: 32, color: "black", marginTop: 15 }}>{nome_jardim}</Text>
      </View>
      <Text style={{ fontFamily: "InriaSans-Bold", fontSize: 20, color: "#90C8BB", marginTop: 50, marginLeft: '5%' }}>Plantas no jardim</Text>
      <View style={[styles.cardsemplantas, { display: displaybotao ? "none" : "flex" }]}>
        <Image source={require("../assets/images/iconpagejardim.webp")} style={styles.iconsemplantas}></Image>
        <Text style={styles.textocardsemplantas}>Adicione uma planta clicando no botão abaixo</Text>
        <TouchableOpacity style={styles.botaocardsemplantas}
          onPress={() => {
            setmodal1(true);
          }}>
          <FontAwesome name="plus" size={18} color={'white'} style={{ position: "absolute", left: 22 }}></FontAwesome>
          <Text style={{ color: "white", fontFamily: "Lexend-VariableFont_wght", fontSize: 16 }}>Adicionar planta</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={modal2} transparent={true}>
        <View style={styles.modalconfirmarplanta}>
          <TouchableOpacity style={styles.fecharmodalnoclick} onPress={() => { setmodal1(false) }}>
          </TouchableOpacity>
          <View style={[styles.cardmodal, { justifyContent: 'center', maxHeight: '70%', minHeight: '50%' }]} >
            <Image style={{ height: '40%', width: '80%', borderRadius: 8 }} source={{ uri: imagemPlanta }}>
            </Image>
            <Text style={styles.perguntaRega}>Faz quantas horas desde que você regou esta planta?(aprox)</Text>
            <TextInput
              value={respRega}
              onChangeText={setRespRega}
              keyboardType="numeric"
              maxLength={3}
              placeholder='Ex: 7'
              placeholderTextColor={'#90C8BB'}
              style={styles.InputRega}
            >
            </TextInput>
            <TouchableOpacity style={styles.botaoAdicionarplantaModal} onPress={() => {
              if (contBot < 5) {
                setModalLoading(true);
                setBotaoClicado(true);
              } else {
                setContBot(param => param + 1);
              }
            }}>
              <Text style={{ color: "white", fontFamily: "Lexend-VariableFont_wght", fontSize: 16 }}>Adicionar Planta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={modal1} transparent={true}>
        <View style={styles.modaladicionarplantas} >
          <TouchableOpacity style={styles.fecharmodalnoclick} onPress={() => { setmodal1(false) }}>
          </TouchableOpacity>
          <View style={[styles.cardmodal, { height: '50%' }]} >
            <View style={{ backgroundColor: '#90C8BB', height: '40%', width: '80%', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
              <FontAwesome name="camera" size={25} color={"white"}></FontAwesome>
            </View>
            <View style={styles.Botoes}>
              <TouchableOpacity style={styles.botao3} onPress={requestCameraPermission}>
                <FontAwesome name='camera' color={'white'} size={20} style={{ position: "absolute", left: 22 }}></FontAwesome>
                <Text style={[styles.textoBotoesModal1, { color: 'white' }]}>Tirar Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoTrocar} onPress={selecionarImagem}>
                <FontAwesome name='image' color={'white'} size={20} style={{ position: "absolute", left: 22 }}></FontAwesome>
                <Text style={[styles.textoBotoesModal1, { color: 'white' }]}>Selecionar imagem</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoCancelar} onPress={() => { setmodal1(false) }}>
                <Text style={[styles.textoBotoesModal1, { color: 'white' }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={modalLoading}>
        <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1, backgroundColor: '#EFEDED' }}>
          <ActivityIndicator size="large" color="#90C9BC" />
          <Text style={{ color: "#90C9BC", fontFamily: 'Jomhuria-Regular', fontSize: 73 }}>{carregando}</Text>
        </View>
      </Modal>
      <View style={styles.conteudo}>
        <FlatList
          data={dadosPlanta}
          renderItem={renderizarplanta}
          keyExtractor={(item) => item.planta_id}
          style={{ maxHeight: 'auto', width: '90%', zIndex: zindex }}
        ></FlatList>
        <TouchableOpacity style={[styles.botaoAdicionarPlanta, { display: displaybotao ? "flex" : "none" }]}
          onPress={() => {
            setmodal1(true);
          }}>
          <FontAwesome name="plus" size={18} color={'white'} style={{ position: "absolute", left: 22 }}></FontAwesome>
          <Text style={{ color: "white", fontFamily: "Lexend-VariableFont_wght", fontSize: 18 }}>Adicionar planta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "white",
    width: '100%'
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    marginLeft: '5%'
  },
  conteudo: {
    flex: 1,
    alignItems: 'center',
    width: '100%'
  },
  cardsemplantas: {
    width: '90%',
    height: '32%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginTop: 84,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#CFE8E2',
    zIndex: 2,
    marginLeft: '5%'
  },
  iconsemplantas: {
    width: '25%',
    height: '25%',
  },
  textocardsemplantas: {
    color: '#9D9292',
    fontSize: 20,
    fontFamily: "InriaSans-Bold",
    marginTop: 19,
    textAlign: 'center',
    marginBottom: 19,
    width: '90%'
  },
  botaocardsemplantas: {
    width: '90%',
    height: '15%',
    backgroundColor: "#90C8BB",
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: "center",
    flexDirection: 'row',
  },
  fecharmodalnoclick: {
    height: '100%',
    width: '100%',
    position: "absolute",
  },
  modaladicionarplantas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  cardmodal: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#90C8BB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  botaomodaladicionarplanta: {
    width: 246,
    height: 41,
    backgroundColor: '#90C8BB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  botaoCancelar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#FF7878',
    backgroundColor: "#FF7878",
    borderWidth: 2,
    width: '100%',
    height: 50,
    borderRadius: 7
  },
  botao3: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#90C8BB',
    backgroundColor: "#90C8BB",
    borderWidth: 2,
    width: '100%',
    height: 50,
    borderRadius: 7
  },
  textoBotoesModal1: {
    fontSize: 18,
    fontFamily: 'Lexend-VariableFont_wght',
    fontWeight: '900'
  },
  Botoes: {
    marginTop: 15,
    width: '80%'
  },
  botaoTrocar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#5D9B8C',
    backgroundColor: "#5D9B8C",
    borderWidth: 2,
    width: '100%',
    height: 50,
    borderRadius: 7,
    marginBottom: 10,
    marginTop: 10
  },
  planta: {
    marginTop: 10,
    flexDirection: 'row',
    height: 100,
    width: '100%',
  },
  imgplanta: {
    width: '30%',
    height: '100%',
  },
  infoplanta: {
    backgroundColor: '#90C8BB',
    width: '70%',
    borderRadius: 11,
    justifyContent: 'center'
  },
  nomeplanta: {
    fontFamily: 'InriaSans-Bold',
    fontSize: 19.50,
    color: 'white',
    marginLeft: 8,
  },
  grupoestatisticas: {
    flexDirection: "row",
    alignItems: 'center',
    marginTop: 3,
    width: '60%',
    marginLeft: 8,
  },
  barrasestatisticas: {
    width: '80%',
    height: '50%',
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 10,
    marginLeft: 5,

  },
  tamanhodaplanta: {
    color: 'white',
    fontSize: 12,
  },
  modalconfirmarplanta: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  perguntaRega: {
    width: '80%',
    color: 'black',
    fontFamily: 'InriaSans-Bold',
    marginTop: 18,
    marginBottom: 7
  },
  InputRega: {
    width: '80%',
    padding: 7,
    borderColor: '#90C8BB',
    borderWidth: 1,
    borderRadius: 4,
    color: '#90C8BB',
    marginBottom: 18
  },
  botaoAdicionarplantaModal: {
    width: '80%',
    backgroundColor: '#90C8BB',
    borderRadius: 3,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  botaoAdicionarPlanta: {
    width: '90%',
    backgroundColor: '#90C8BB',
    borderRadius: 5,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20
  },
  modalDeletar: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardModalDeletar: {
    width: '80%',
    height: '30%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  mensagem: {
    height: '70%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botões: {
    height: '30%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#90C8BB'
  },
  modalOpcoes: {
    backgroundColor: 'white',
    height: '80%',
    width: '35%',
    position: 'absolute',
    right: '5%',
    top: '15%',
    borderRadius: 8,
    zIndex: 6,
    alignItems: 'center',
    borderWidth: 1
  },
  botoesOpcoes: {
    width: '80%',
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    height: '50%',
    alignItems: 'center',
    zIndex: 6
  },
  fundoPreto: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
})

