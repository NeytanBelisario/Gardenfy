import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Image, Pressable, TouchableOpacity, Alert, Modal, FlatList, TextInput, DimensionValue } from 'react-native';
import axios from 'axios';
import { CameraOptions, ImageLibraryOptions, MediaType, launchImageLibrary } from 'react-native-image-picker';
import { launchCamera } from 'react-native-image-picker';
import { PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';
import { response } from 'express';

const API_KEY = '17EW49tOnvGOUMxCzS2k9HPMSQRdZh7GvqmhzKlFImKjtwj7YH';
const API_URL = 'https://plant.id/api/v3/identification';

export default function Jardins({ navigation }: { navigation: any }) {
  const [modal1, setmodal1] = useState(false);
  const [nomejardim, setnomejardim] = useState<any>();
  const [jardins, setjardins] = useState<String | any>([]);
  const [displaybotao, setdisplaybotao] = useState(true);
  const [botaofavoritarfundo, setbotaofavoritarfundo] = useState(false);
  const [conticones, setconticones] = useState(0);
  const [externo, setexterno] = useState(false);
  const [ie, setIE] = useState('i');
  const [ordenarPor, setOrdenarPor] = useState(false)
  const [filtrarPor, setFiltrarPor] = useState(false)
  const [modalOpcoes, setModalOpcoes] = useState(false)
  const [idEscolhido, setIdEscolhido] = useState();
  const [zindex, setZIndex] = useState(2)
  const [modalDeletar, setModalDeletar] = useState(false)
  const [jardim_id, setJardim_id] = useState()
  const [modalEditar, setModalEditar] = useState(false)

  useEffect(() => {
    const sethorario = setInterval(() => {
      setjardins((param: any[]) => param.map((jardins: any) => {
        let { horas, minutos, segundos } = jardins;
        if (jardins.horas <= 0 && jardins.minutos <= 0 && jardins.segundos <= 0) {
          return jardins;
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

        return { ...jardins, horas, minutos, segundos }
      })
      )
    }, 1000)
    return () => clearInterval(sethorario);
  }, [])

  const iconesjardins = [
    require("../assets/images/icones/iconvasodeplantas1.png"),
    require("../assets/images/icones/icone2.png"),
    require("../assets/images/icones/icone3.png"),
    require("../assets/images/icones/icone4.png")
  ];

  const mudaricone = () => {
    if (conticones >= 3) {
      setconticones(0);
    } else {
      setconticones(param => param + 1)
    }
  }

  const mudaricone2 = () => {
    if (conticones <= 0) {
      setconticones(3);
    } else {
      setconticones(param => param - 1)

    }
  }

  const favorito = async () => {
    let usuario_id = await getData();
    axios.get(`https://gardenfyrotas-production.up.railway.app/Favoritos`, {
      headers: {
        "Content-Type": "application/json",
        "usuario_id": usuario_id
      }
    }).then(response => {
      console.log(response.data)
      setjardins(response.data.message)
    }).catch(err => {
      console.log(err);
      if (err.response) {
        console.log(err.response);
        console.log("Status do erro: ", err.response.status);
        console.log("Headers do erro: ", err.response.headers);
      }
    })
  }

  const favoritarfundo = () => {
    if (botaofavoritarfundo) {
      setbotaofavoritarfundo(false)
      listarJardins()
      setOrdenarPor(false)
      setFiltrarPor(false)
    }
    else {
      setbotaofavoritarfundo(true)
      favorito()
      setOrdenarPor(false)
      setFiltrarPor(false)
    };


  }

  const internoexterno = () => {
    if (externo) {
      setexterno(false)
    }
    else {
      setexterno(true)
    }
  }

  const adicionarJardim = () => {
    if (nomejardim.trim() !== "") {
      setjardins([...jardins, { jardim_id: Date.now().toString(), nome_jardim: nomejardim, imagem: conticones }]);
      setdisplaybotao(true);
      setmodal1(false);
      onPressHandler();
    }
  };

  const getData = async () => {
    try {
      const value = await AsyncStorage.getItem('usuario_id');
      console.log(value)
      if (value !== null) {
        return value;
      }
    } catch (e) {
      console.log("Deu erro: ", e)
    }
  };

  const onPressHandler = async () => {
    let usuario_id = await getData();
    let nome_jardim = nomejardim;
    let imagem = conticones;
    let local_jardim = ie;
    let favorito = false;
    axios.post('https://gardenfyrotas-production.up.railway.app/novoJardim', { nome_jardim, imagem, local_jardim, usuario_id }, {
      headers: {
        "Content-Type": "application/json"
      }
    }).then(response => {
      if (response.data.success != false) {
        setconticones(0);
        setIE("i");
        setnomejardim("");
        listarJardins()
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
  }

  const storeData = async (value: any, value2: any) => {
    try {
      const jardim_id = JSON.stringify(value2)
      await AsyncStorage.setItem('nome_jardim', value);
      await AsyncStorage.setItem('jardim_id', jardim_id);
      navigation.navigate('plantas')
    } catch (e) {
      console.log('erro no salvar: ', e);
    }
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

  const renderizarjardim = ({ item }: { item: any }) => (
    <View style={[styles.divjardim, { zIndex: 5 }]}>
      <TouchableOpacity style={[styles.fundoPreto, { display: modalOpcoes ? 'flex' : 'none', zIndex: 6, borderRadius: 10 }]} onPress={() => {
        setModalOpcoes(false)
        setZIndex(2)
      }}>
      </TouchableOpacity>
      {modalOpcoes && (idEscolhido == item.jardim_id) &&
        <View style={styles.modalOpcoes}>
          <TouchableOpacity style={[styles.botoesOpcoes, { borderBottomWidth: 1 }]} onPress={() => { 
              setModalEditar(true) 
              setconticones(item.imagem)
              setnomejardim(item.nome_jardim)
              setIE(item.local_jardim)
              if(item.local_jardim == ('e'))
                setexterno(true)
              else
                setexterno(false)
              setModalOpcoes(false)
              setZIndex(2)
              setJardim_id(item.jardim_id)
            }}>
            <Text style={{ color: 'black' }}>Editar</Text>
            <FontAwesome name="pencil" size={15} style={{ marginLeft: 2, color: 'black', marginTop: 1 }}></FontAwesome>
          </TouchableOpacity>
          {item.favorito == 0 ? (
            <TouchableOpacity style={[styles.botoesOpcoes, { borderBottomWidth: 1 }]} onPress={() => { favoritar(item.jardim_id) }}>
              <Text style={{ color: 'black' }}>Favoritar</Text>
              <FontAwesome name={'heart-o'} size={15} style={{ marginLeft: 2, color: 'black', marginTop: 1 }}></FontAwesome>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.botoesOpcoes, { borderBottomWidth: 1 }]} onPress={() => { desfavoritar(item.jardim_id) }}>
              <Text style={{ color: 'black' }}>Desfavoritar</Text>
              <FontAwesome name={'heart'} size={15} style={{ marginLeft: 2, color: 'black', marginTop: 1 }}></FontAwesome>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.botoesOpcoes} onPress={() => {
            setModalOpcoes(false)
            setZIndex(2)
            Alert.alert('Você tem certeza disso?', 'Ao apagar esse jardim, todas as plantas dele serão apagadas.', [
              {
                  text: 'Não apagar',
                  onPress: () => console.log('Cancel Pressed'),
                  style: 'cancel'
              },
              {
                  text: 'Sim, apagar',
                  onPress: () => deletarJardim(item.jardim_id),
                  style: 'default'
              }
          ])
          }}>
            <Text style={{ color: '#FF001F' }}>Excluir</Text>
            <FontAwesome name="trash" size={15} style={{ marginLeft: 2, color: '#FF001F' }}></FontAwesome>
          </TouchableOpacity>
        </View>
      }

      <TouchableOpacity style={styles.cardjardim} onPress={() => {
        storeData(item.nome_jardim, item.jardim_id);
      }}>
        <TouchableOpacity style={{ position: 'absolute', right: 15, top: 10 }} onPress={() => {
          setModalOpcoes(true)
          setIdEscolhido(item.jardim_id)
          setZIndex(4)
        }}>
          <FontAwesome name="navicon" size={20} color={"white"}></FontAwesome>
        </TouchableOpacity>
        <View style={styles.divcardconteudo}>
          <View style={styles.diviconjardim}>
            <Image source={iconesjardins[item.imagem]} style={styles.iconejardim}></Image>
          </View>
          <View style={styles.informacoesjardim}>
            <Text style={styles.nomejardim}>{item.nome_jardim}</Text>
            <View>
              <View style={styles.grupoestatisticas}>
                <FontAwesome name="calendar" size={13} style={{ marginLeft: 2, }}></FontAwesome>
                {(item.horas == null || item.minutos == null || item.segundos == null) ? (
                  <Text style={{ marginLeft: 11, fontFamily: 'Lexend-VariableFont_wght', fontSize: 12, width: '100%' }}>
                    Adicione plantas no jardim
                  </Text>
                ) : (
                  (item.horas <= 0 && item.minutos <= 0 && item.segundos <= 0) ? (
                    <Text style={{ marginLeft: 11, fontFamily: 'Lexend-VariableFont_wght', fontSize: 12, width: '100%' }}>
                      Uma planta precisa ser regada
                    </Text>
                  ) : (
                    <Text style={{ marginLeft: 11, fontFamily: 'Lexend-VariableFont_wght', fontSize: 13 }}>
                      {item.horas}:{item.minutos}:{item.segundos}
                    </Text>
                  )
                )}
              </View>
              <View style={[styles.grupoestatisticas, { justifyContent: 'space-between' }]}>
                <FontAwesome name="tint" size={16} style={{ marginLeft: 3, marginRight: 11 }}></FontAwesome>
                <View style={styles.barrasestatisticas}>
                  <View style={[getBarraStyle(item.nivel_agua), { backgroundColor: 'white', position: 'absolute', height: '100%', borderTopLeftRadius: 10, borderBottomLeftRadius: 10, }]}>
                  </View>
                </View>
              </View>
              <View style={[styles.grupoestatisticas, { justifyContent: 'space-between' }]}>
                <FontAwesome name="sun-o" size={13} style={{ marginLeft: 1, marginRight: 9 }}></FontAwesome>
                <View style={styles.barrasestatisticas}>
                  <View style={[getBarraStyle2(item.nivel_sol), { backgroundColor: 'white', position: 'absolute', height: '100%', borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }]}>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

      </TouchableOpacity>
    </View>
  );

  const listarJardins = async () => {
    let usuario_id = await getData();
    axios.get(`https://gardenfyrotas-production.up.railway.app/listarJardins`, {
      headers: {
        "Content-Type": "application/json",
        "usuario_id": usuario_id
      }
    }).then(response => {
      console.log(response.data.message);
      if (response.data.message == false) {
        setdisplaybotao(false);
      } else {
        setjardins(response.data.message);
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

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        await listarJardins();
      };

      fetchData();

    }, [])
  );

  const ordenarNomeAsc = async () => {
    let usuario_id = await getData();
    axios.get(`https://gardenfyrotas-production.up.railway.app/ordernarNomeAsc`, {
      headers: {
        "Content-Type": "application/json",
        "usuario_id": usuario_id
      }
    }).then(response => {
      console.log(response.data)
      setjardins(response.data.message)
      setOrdenarPor(false)
    }).catch(err => {
      console.log(err);
      if (err.response) {
        console.log(err.response);
        console.log("Status do erro: ", err.response.status);
        console.log("Headers do erro: ", err.response.headers);
      }
    })
  }

  const ordenarNomeDesc = async () => {
    let usuario_id = await getData();
    axios.get(`https://gardenfyrotas-production.up.railway.app/ordernarNomeDesc`, {
      headers: {
        "Content-Type": "application/json",
        "usuario_id": usuario_id
      }
    }).then(response => {
      console.log(response.data)
      setjardins(response.data.message)
      setOrdenarPor(false)
    }).catch(err => {
      console.log(err);
      if (err.response) {
        console.log(err.response);
        console.log("Status do erro: ", err.response.status);
        console.log("Headers do erro: ", err.response.headers);
      }
    })
  }

  const ordenarProxRega = async () => {
    let usuario_id = await getData();
    axios.get(`https://gardenfyrotas-production.up.railway.app/ordernarproxRega`, {
      headers: {
        "Content-Type": "application/json",
        "usuario_id": usuario_id
      }
    }).then(response => {
      console.log(response.data)
      setjardins(response.data.message)
      setOrdenarPor(false)
    }).catch(err => {
      console.log(err);
      if (err.response) {
        console.log(err.response);
        console.log("Status do erro: ", err.response.status);
        console.log("Headers do erro: ", err.response.headers);
      }
    })
  }

  const ordenarPorMaisRecentes = async () => {
    let usuario_id = await getData();
    axios.get(`https://gardenfyrotas-production.up.railway.app/ordenarPorMaisRecentes`, {
      headers: {
        "Content-Type": "application/json",
        "usuario_id": usuario_id
      }
    }).then(response => {
      console.log(response.data)
      setjardins(response.data.message)
      setOrdenarPor(false)
    }).catch(err => {
      console.log(err);
      if (err.response) {
        console.log(err.response);
        console.log("Status do erro: ", err.response.status);
        console.log("Headers do erro: ", err.response.headers);
      }
    })
  }

  const ordenarPorMaisAntigos = async () => {
    let usuario_id = await getData();
    axios.get(`https://gardenfyrotas-production.up.railway.app/ordenarPorMaisAntigos`, {
      headers: {
        "Content-Type": "application/json",
        "usuario_id": usuario_id
      }
    }).then(response => {
      console.log(response.data)
      setjardins(response.data.message)
      setOrdenarPor(false)
    }).catch(err => {
      console.log(err);
      if (err.response) {
        console.log(err.response);
        console.log("Status do erro: ", err.response.status);
        console.log("Headers do erro: ", err.response.headers);
      }
    })
  }

  const filtrarExterno = async () => {
    let usuario_id = await getData();
    axios.get(`https://gardenfyrotas-production.up.railway.app/filtrarExterno`, {
      headers: {
        "Content-Type": "application/json",
        "usuario_id": usuario_id
      }
    }).then(response => {
      console.log(response.data)
      setjardins(response.data.message)
      setFiltrarPor(false)
    }).catch(err => {
      console.log(err);
      if (err.response) {
        console.log(err.response);
        console.log("Status do erro: ", err.response.status);
        console.log("Headers do erro: ", err.response.headers);
      }
    })
  }

  const filtrarInterno = async () => {
    let usuario_id = await getData();
    axios.get(`https://gardenfyrotas-production.up.railway.app/filtrarInterno`, {
      headers: {
        "Content-Type": "application/json",
        "usuario_id": usuario_id
      }
    }).then(response => {
      console.log(response.data)
      setjardins(response.data.message)
      setFiltrarPor(false)
    }).catch(err => {
      console.log(err);
      if (err.response) {
        console.log(err.response);
        console.log("Status do erro: ", err.response.status);
        console.log("Headers do erro: ", err.response.headers);
      }
    })
  }

  const editar = async () => {
    await axios.patch(`https://gardenfyrotas-production.up.railway.app/editarJardim`, {
      jardim_id: jardim_id,
      nome_jardim: nomejardim,
      imagem: conticones,
      local_jardim: ie
    },  {
      headers: {
        "Content-Type": "application/json",
      }
    }).then(response => {
      console.log(response)
      setModalEditar(false)
      setexterno(false)
      setIE('i')
      setnomejardim('')
      setconticones(0)
      listarJardins()
    })
  }

  const deletarJardim = async (jaardim_id:any) => {
    axios.delete(`https://gardenfyrotas-production.up.railway.app/deletarJardim`, {
      headers: {
        "Content-Type": "application/json",
        "jardim_id": jaardim_id
      }
    }).then(response => {
      console.log(response)
      console.log('Jardim Apagado')
      setModalDeletar(false)
      setjardins((prev: any[]) => {
        const novoEstado = prev.filter((item: { jardim_id: any; }) => item.jardim_id !== jardim_id);
        return novoEstado;
      });
      listarJardins()
    }).catch(err => {
      console.log(err);
      if (err.response) {
        console.log(err.response);
        console.log("Status do erro: ", err.response.status);
        console.log("Headers do erro: ", err.response.headers);
      }
    })
  }

  const favoritar = async (jardim_id: any) => {
    axios.patch(`https://gardenfyrotas-production.up.railway.app/favoritar`, {
      jardim_id: jardim_id
    }, {
      headers: {
        "Content-Type": "application/json",
      }
    }).then(response => {
      console.log(response)
      setModalOpcoes(false)
      setZIndex(2)
      listarJardins()
    }).catch(err => {
      console.log(err);
      if (err.response) {
        console.log(err.response);
        console.log("Status do erro: ", err.response.status);
        console.log("Headers do erro: ", err.response.headers);
      }
    })
  }

  const desfavoritar = async (jardim_id: any) => {
    axios.patch(`https://gardenfyrotas-production.up.railway.app/desfavoritar`, {
      jardim_id: jardim_id
    }, {
      headers: {
        "Content-Type": "application/json",
      }
    }).then(response => {
      console.log(response)
      setModalOpcoes(false)
      setZIndex(2)
      listarJardins()
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
      <Image
        source={require("../assets/images/Fundoplantas.png")}
        style={styles.backgroundImage}
      />
      <TouchableOpacity style={[styles.fundoPreto, { display: modalOpcoes ? 'flex' : 'none', zIndex: 4 }]} onPress={() => {
        setZIndex(2)
        setModalOpcoes(false)
      }}>
      </TouchableOpacity>
      <Modal visible={modal1} transparent={true}>
        <View style={styles.modaladicionarjardins} >
          <TouchableOpacity style={styles.fecharmodalnoclick} onPress={() => { 
              setmodal1(false) 
              setexterno(false)
              setIE('i')
              setnomejardim('')
              setconticones(0)
            }}>
          </TouchableOpacity>
          <View style={styles.cardmodal} >
            <View style={styles.divselecionaricone}>
              <TouchableOpacity onPress={mudaricone2}>
                <FontAwesome
                  name="chevron-left"
                  size={20}
                  color={"#76BDAC"}
                  style={{ marginRight: 18 }}
                ></FontAwesome>
              </TouchableOpacity>
              <View style={{ backgroundColor: '#90C8BB', width: 107, height: 87, alignItems: 'center', justifyContent: 'center', borderRadius: 5 }}>
                <Image source={iconesjardins[conticones]} style={styles.iconesselecionaveis}></Image>
              </View>
              <TouchableOpacity onPress={mudaricone}>
                <FontAwesome name="chevron-right" size={20} color={"#76BDAC"} style={{ marginLeft: 18 }}></FontAwesome>
              </TouchableOpacity>
            </View>
            <View style={styles.divnomejardim}>
              <TextInput style={styles.inputnomejardim}
                placeholder="Nome do Jardim"
                value={nomejardim}
                onChangeText={setnomejardim}
                placeholderTextColor={'#76BDAC'}
              />
            </View>
            <View style={styles.divinternoexterno}>
              <TouchableOpacity style={[styles.divinterno, { backgroundColor: externo ? 'white' : "#90C9BC", height: '100%' }]} onPress={() => (setexterno(false), setIE('i'))}>
                <Text style={{ fontFamily: "InriaSans-Bold", fontSize: 15.06, color: externo ? '#90C9BC' : 'white' }}>INTERNO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.divexterno, { backgroundColor: externo ? '#90C9BC' : "white", height: '100%' }]} onPress={() => (setexterno(true), setIE('e'))}>
                <Text style={{ fontFamily: "InriaSans-Bold", fontSize: 15.06, color: externo ? 'white' : '#90C9BC' }}>EXTERNO</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.botaomodaladicionarjardim} onPress={adicionarJardim}>
              <Text style={{ fontFamily: "Lexend-VariableFont_wght", fontSize: 15 }}>Criar jardim</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={modalEditar} transparent={true}>
        <View style={styles.modaladicionarjardins} >
          <TouchableOpacity style={styles.fecharmodalnoclick} onPress={() => { 
              setModalEditar(false) 
              setexterno(false)
              setIE('i')
              setnomejardim('')
              setconticones(0)
            }}>
          </TouchableOpacity>
          <View style={styles.cardmodal} >
            <View style={styles.divselecionaricone}>
              <TouchableOpacity onPress={mudaricone2}>
                <FontAwesome
                  name="chevron-left"
                  size={20}
                  color={"#76BDAC"}
                  style={{ marginRight: 18 }}
                ></FontAwesome>
              </TouchableOpacity>
              <View style={{ backgroundColor: '#90C8BB', width: 107, height: 87, alignItems: 'center', justifyContent: 'center', borderRadius: 5 }}>
                <Image source={iconesjardins[conticones]} style={styles.iconesselecionaveis}></Image>
              </View>
              <TouchableOpacity onPress={mudaricone}>
                <FontAwesome name="chevron-right" size={20} color={"#76BDAC"} style={{ marginLeft: 18 }}></FontAwesome>
              </TouchableOpacity>
            </View>
            <View style={styles.divnomejardim}>
              <TextInput style={styles.inputnomejardim}
                placeholder="Nome do Jardim"
                value={nomejardim}
                onChangeText={setnomejardim}
                placeholderTextColor={'#76BDAC'}
              />
            </View>
            <View style={styles.divinternoexterno}>
              <TouchableOpacity style={[styles.divinterno, { backgroundColor: externo ? 'white' : "#90C9BC", height: '100%' }]} onPress={() => (setexterno(false), setIE('i'))}>
                <Text style={{ fontFamily: "InriaSans-Bold", fontSize: 15.06, color: externo ? '#90C9BC' : 'white' }}>INTERNO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.divexterno, { backgroundColor: externo ? '#90C9BC' : "white", height: '100%' }]} onPress={() => (setexterno(true), setIE('e'))}>
                <Text style={{ fontFamily: "InriaSans-Bold", fontSize: 15.06, color: externo ? 'white' : '#90C9BC' }}>EXTERNO</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.botaomodaladicionarjardim} onPress={editar}>
              <Text style={{ fontFamily: "Lexend-VariableFont_wght", fontSize: 15 }}>Editar jardim</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Text style={styles.titulo}>Jardins</Text>
      <View style={styles.grupofiltros}>
        <Pressable style={styles.ordenarpor} onPress={() => {
          if (ordenarPor == false) {
            setOrdenarPor(true)
            setFiltrarPor(false)
          }
          else {
            setOrdenarPor(false)
          }
        }}>
          <Text style={{ color: "black" }}>Ordenar por</Text>
          <FontAwesome
            name={ordenarPor? "chevron-up" : "chevron-down"} 
            size={13}
            color={"#76BDAC"}
          ></FontAwesome>
        </Pressable>
        <View style={[styles.ordene, { display: ordenarPor ? 'flex' : 'none' }]}>
          <Text onPress={ordenarNomeAsc} style={{ color: "black", textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#90C9BC', width: '90%', paddingBottom: 2, paddingTop: 2 }}>Nome Crescente</Text>
          <Text onPress={ordenarNomeDesc} style={{ color: "black", textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#90C9BC', width: '90%', paddingBottom: 2, paddingTop: 2  }}>Nome Descrescente</Text>
          <Text onPress={ordenarProxRega} style={{ color: "black", textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#90C9BC', width: '90%', paddingBottom: 2, paddingTop: 2  }}>Próxima Rega</Text>
          <Text onPress={ordenarPorMaisRecentes} style={{ color: "black", textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#90C9BC', width: '90%', paddingBottom: 2, paddingTop: 2  }}>Mais Recentes</Text>
          <Text onPress={ordenarPorMaisAntigos} style={{ color: "black", textAlign: 'center', width: '90%', paddingBottom: 2, paddingTop: 2  }}>Mais Antigos</Text>
        </View>
        <Pressable style={styles.filtrarpor} onPress={() => {
          if (filtrarPor == false) {
            setOrdenarPor(false)
            setFiltrarPor(true)
          }
          else {
            setFiltrarPor(false)
          }
        }}>
          <Text style={{ color: "black" }}>Filtrar por</Text>
          <FontAwesome
            name={filtrarPor? "chevron-up" : "chevron-down"} 
            size={13}
            color={"#76BDAC"}
          ></FontAwesome>
        </Pressable>
        <View style={[styles.filtro, { display: filtrarPor ? 'flex' : 'none'}]}>
          <Text onPress={filtrarInterno} style={{ color: "black", textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#90C9BC', width: '90%', paddingBottom: 2, paddingTop: 2 }}>Jardins Internos</Text>
          <Text onPress={filtrarExterno} style={{ color: "black", textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#90C9BC', width: '90%', paddingBottom: 2, paddingTop: 2 }}>Jardins Externos</Text>
          <Text onPress={listarJardins} style={{ color: "black", textAlign: 'center', width: '90%', paddingBottom: 2, paddingTop: 2 }}>Limpar Filtro</Text>
        </View>
        <TouchableOpacity style={[styles.favoritar, { backgroundColor: botaofavoritarfundo ? '#90C9BC' : "white" }]} onPress={favoritarfundo}>
          <FontAwesome
            name={botaofavoritarfundo ? 'heart' : 'heart-o'}
            size={13}
            color={botaofavoritarfundo ? 'white' : "#76BDAC"}
          ></FontAwesome>
        </TouchableOpacity>
      </View>
      <View style={[styles.cardsemjardins, { display: displaybotao ? "none" : "flex" }]}>
        <Image source={require("../assets/images/iconpagejardim.webp")} style={styles.iconsemjardim}></Image>
        <Text style={styles.textocardsemjardim}>Adicione um jardim clicando no botão abaixo</Text>
        <TouchableOpacity style={styles.botaocardsemjardim}
          onPress={() => {
            setmodal1(true);
          }}>
          <FontAwesome name="plus" size={18} color={'white'} style={{ position: "absolute", left: 22 }}></FontAwesome>
          <Text style={{ color: "white", fontFamily: "Lexend-VariableFont_wght", fontSize: 16 }}>Adicionar jardim</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.botaoaddjardim, { display: displaybotao ? "flex" : "none" }]} onPress={() => { setmodal1(true) }}>
        <FontAwesome name="plus" color="white" size={23}></FontAwesome>
      </TouchableOpacity>
      <FlatList
        data={jardins}
        renderItem={renderizarjardim}
        keyExtractor={(item) => item.jardim_id}
        style={{ maxHeight: '86%', width: '90%', zIndex: zindex, marginTop: 10 }}
      ></FlatList>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "white",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    opacity: 0.6,
    position: "absolute",
    marginTop: 100,
    zIndex: 1,
  },
  titulo: {
    fontFamily: "InriaSans-Bold",
    fontSize: 36,
    color: "black",
    width: "90%",
    marginTop: 60,
    zIndex: 2
  },
  grupofiltros: {
    width: '90%',
    height: '5%',
    marginTop: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 3
  },
  ordenarpor: {
    width: '35%',
    borderColor: "#76BDAC",
    borderStyle: "solid",
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    backgroundColor: "white",
    zIndex: 4
  },
  filtrarpor: {
    width: '35%',
    borderColor: "#76BDAC",
    borderStyle: "solid",
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    backgroundColor: "white",
    zIndex: 4
  },
  favoritar: {
    width: '15%',
    borderColor: "#76BDAC",
    borderStyle: "solid",
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  cardsemjardins: {
    width: '90%',
    height: '35%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginTop: 84,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#CFE8E2',
    zIndex: 2
  },
  iconsemjardim: {
    width: '20%',
    height: '20%',
  },
  textocardsemjardim: {
    color: '#9D9292',
    fontSize: 20,
    fontFamily: "InriaSans-Bold",
    marginTop: 19,
    textAlign: 'center',
    marginBottom: 19
  },
  botaocardsemjardim: {
    width: '90%',
    height: '15%',
    backgroundColor: "#90C8BB",
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: "center",
    flexDirection: 'row',

  },
  modaladicionarjardins: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  cardmodal: {
    backgroundColor: 'white',
    width: '90%',
    minHeight: '45%',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#90C8BB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  botaomodaladicionarjardim: {
    width: '75%',
    height: '13%',
    backgroundColor: '#90C8BB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconesselecionaveis: {
    width: 74,
    height: 74,
  },
  divselecionaricone: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  divnomejardim: {
    marginTop: 22,
    width: '75%',
    alignItems: 'center',
  },
  inputnomejardim: {
    width: '100%',
    height: 41,
    padding: 7,
    borderWidth: 1,
    borderColor: '#90C8BB',
    borderRadius: 7,
    color: '#90C8BB',
  },
  divinternoexterno: {
    width: '75%',
    height: 41,
    borderWidth: 1,
    borderColor: '#90C8BB',
    borderRadius: 7,
    marginTop: 18,
    marginBottom: 18,
    flexDirection: 'row',
  },
  divinterno: {
    width: '50%',
    backgroundColor: '#90C8BB',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,

  },
  divexterno: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '50%',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  fecharmodalnoclick: {
    height: '100%',
    width: '100%',
    position: "absolute",
  },
  divjardim: {
    marginBottom: 25,
    width: '100%',
    height: 133,
  },
  cardjardim: {
    width: '100%',
    height: '100%',
    backgroundColor: '#90C9BC',
    borderRadius: 10,
    flexDirection: 'row',
    zIndex: 5,
    alignItems: 'center'
  },
  divcardconteudo: {
    flexDirection: 'row',
  },
  diviconjardim: {
    justifyContent: 'center',
    marginLeft: 19,
  },
  informacoesjardim: {
    width: '60%',
    height: 74,
    justifyContent: 'center',
    marginLeft: 20,
  },
  iconejardim: {
    width: 60,
    height: 60,
  },
  nomejardim: {
    color: 'white',
    fontFamily: "InriaSans-Bold",
    fontSize: 18,
    marginLeft: 3
  },
  grupoestatisticas: {
    flexDirection: "row",
    alignItems: 'center',
    marginTop: 4,
  },
  barrasestatisticas: {
    width: '100%',
    height: 10,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 10,

  },
  botaoaddjardim: {
    width: 52,
    height: 52,
    backgroundColor: '#1F6D5B',
    position: "absolute",
    borderRadius: 100,
    bottom: '5%',
    right: '8%',
    zIndex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ordene: {
    width: '35%',
    position: 'absolute',
    backgroundColor: 'white',
    borderColor: "#76BDAC",
    borderStyle: "solid",
    borderWidth: 2,
    zIndex: 3,
    marginTop: '8%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtro: {
    width: '35%',
    position: 'absolute',
    backgroundColor: 'white',
    borderColor: "#76BDAC",
    borderStyle: "solid",
    borderWidth: 2,
    zIndex: 3,
    marginTop: '8%',
    justifyContent: 'center',
    alignItems: 'center',
    left: '42.5%'
  },
  modalOpcoes: {
    backgroundColor: 'white',
    height: '80%',
    width: '35%',
    position: 'absolute',
    right: '5%',
    top: '10%',
    borderRadius: 8,
    zIndex: 6,
    alignItems: 'center',
    borderWidth: 1
  },
  botoesOpcoes: {
    width: '80%',
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    height: '33%',
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
});