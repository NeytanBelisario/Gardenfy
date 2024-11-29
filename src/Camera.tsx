import {
  Viro360Image,
  ViroARPlane,
  Viro3DObject,
  ViroARScene,
  ViroARSceneNavigator,
  ViroAmbientLight,
  ViroMaterials,
  ViroARPlaneSelector,
} from "@viro-community/react-viro";
import React, { useState } from "react";
import { StyleSheet, View, Text, Modal, TouchableOpacity, Image } from "react-native";
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const InitialScene: React.FC<{
  arquivoobjetos: any[];
  texturasobjetos: any[];
  contobjetos: number;
  sceneNavigator: any;
  tamanhoobjetos: number[][]
  
}> = ({ arquivoobjetos, texturasobjetos, contobjetos, tamanhoobjetos,sceneNavigator }) => {
  ViroMaterials.createMaterials({
    plant: {
      diffuseTexture: texturasobjetos[contobjetos],
    },
  });

  const moveObject = (newPosition: any) => {
    console.log(newPosition);
  };

  const ObjetoSaiu = () => {
    console.log();
  };

  return (
    <ViroARScene>
      <ViroAmbientLight color="#ffffffff" />
      <ViroARPlaneSelector 
        dragType={"FixedToWorld"} 
        minHeight={.5} 
        minWidth={.5} 
        onAnchorRemoved={ObjetoSaiu}
      >
        <Viro3DObject
          type="OBJ"
          source={arquivoobjetos[contobjetos]}
          position={[0, 0, 0]} 
          scale={tamanhoobjetos[contobjetos] as [number, number, number]}
          materials={"plant"}
          onDrag={moveObject}
        />
      </ViroARPlaneSelector>
    </ViroARScene>
  );
};

export default function CameraNe() {
  const [ra, setra] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<{ uri: string } | null>(null);

  const arquivoobjetos = [
    require("../assets/objetos3D/uploads_files_3726421_Areca+Palm+obj.obj"),
    require("../assets/objetos3D/eb_house_plant_02.obj"),
  ];
  const texturasobjetos = [
    require("../assets/textures/Textura_Planta.jpeg"),
    require("../assets/textures/eb_house_plant_01_c.png"),
  ];
  const [contobjetos, setcontobjetos] = useState(0);

  const tamanhoobjetos = [
    [0.0012, 0.0012, 0.0015], //objeto1
    [0.02, 0.02, 0.02]  //obj2
  ]


  return (
    <View style={styles.mainView}>
      <Modal visible={ra} transparent={true}>
      <ViroARSceneNavigator
    initialScene={{
      scene: () => (
       <InitialScene
         arquivoobjetos={arquivoobjetos}
          texturasobjetos={texturasobjetos}
          contobjetos={contobjetos}
          tamanhoobjetos={tamanhoobjetos}
          sceneNavigator={undefined} 
       />
       ),
  }}
    style={{ flex: 1 }}
  />
   {/* DENTRO DA RA */}
        <TouchableOpacity
          onPress={() => {setra(false), console.log(tamanhoobjetos[contobjetos])}}
          style={{ backgroundColor: "white", position: "absolute", top: 10, left: 13, padding: 13, paddingRight: 17, justifyContent: 'center', borderRadius: 25 }}
        >
          <FontAwesome name="chevron-left" size={40} color={"#3A3A3A"}></FontAwesome>
        </TouchableOpacity>

        <View style={[styles.divcontrolButtons]}>
        <Text style={styles.controlButtons}>Sim</Text>
        <Text style={styles.controlButtons}>Nao</Text>
      </View>

      </Modal>

      {/* PAGINA */}
      <View style={{marginTop: '6%', marginLeft: '6%'}}>
        <Text style={styles.tituloPlantas}>Realidade Aumentada</Text>
        <Text style={styles.subtituloPlantas}>Teste em seu ambiente físico</Text>
      </View>
          <View style={{marginTop: 30}}>
            <Text style={{color: 'black', fontSize: 20, fontFamily: 'InriaSans-Bold', marginLeft: '6%'}}>Teste algus modelos prontos</Text>
          </View>

          <View style={styles.conteudoprincipal}>
       
      <TouchableOpacity
        onPress={() => {setra(true); setcontobjetos(0);  }}
        style={styles.quadradosobjetos3d}
      >
         <Image source={require("../assets/objetos3dpfp/areca-palm-indoor-plant-3d-model-low-poly-max-obj-fbx-removebg-preview.png")} style={{width: 100, height: 100}}></Image>
        </TouchableOpacity>
    
      <TouchableOpacity
        onPress={() => {setra(true);setcontobjetos(1); }}
        style={styles.quadradosobjetos3d}
      >
          <Image source={require("../assets/objetos3dpfp/l34592-house-plant-01-60848-removebg-preview.png")} style={{width: 100, height: 100}}></Image>
      </TouchableOpacity>

      {/* View do conteudo */}
      </View > 


    </View>
  );
}

const styles = StyleSheet.create({
  controlButtons: {
    color: "black",
    fontSize: 24,
  },
  divcontrolButtons: {
    display: "none",
  },
  mainView: {
    flex: 1,
  },
  tituloPlantas: {
    fontFamily: 'InriaSans-Bold',
    color: 'black',
    fontSize: 32,
    width: 310
  },
  subtituloPlantas: {
    fontFamily: 'InriaSans-Bold',
    color: '#9D9292',
    fontSize: 16,
    width: 322,
    borderBottomWidth: 1,
    borderColor: '#9D9292',
    marginTop: 10,
  }, 
  conteudoprincipal: {
    marginTop: 23,
    marginLeft: '6%',
    flexDirection: 'row',
    justifyContent: 'space-evenly'
  },
  quadradosobjetos3d: {
    width: 100,
    height: 100,
    backgroundColor: "#90C9BC",
    borderRadius: 10,
  },
});