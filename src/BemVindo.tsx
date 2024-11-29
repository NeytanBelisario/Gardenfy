import React from 'react';
import { StyleSheet, Text, View, Image, Pressable } from 'react-native';

export default function TelaBemVindo({ navigation }: { navigation: any }) {
    const onPressHandler = () => {
        navigation.replace('Screen_B')
    }

    return (
        <View style={styles.body}>
            <View style={styles.imagem}>
                <Image
                    style={styles.logo}
                    source={require('../assets/images/GARDENFY.jpg')}
                />
            </View>
            <View>
                <Text
                    style={styles.textoSBV1}>
                    SEJA
                </Text>
                <Text
                    style={styles.textoSBV2}>
                    BEM-VINDO
                </Text>
            </View>
            <View style={styles.conteudo}>
                <Pressable
                    onPress={onPressHandler}
                    style={styles.botaoInicio}
                >
                    <Text style={styles.textBotãoInicio}>
                        Continuar
                    </Text>
                </Pressable>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    body: {
        flex: 1,
        backgroundColor: '#EFEDED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    conteudo: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 273,
        height: 318,
        marginTop: 180,
    },
    botaoInicio: {
        width: 273,
        height: 44,
        backgroundColor: "#90C9BC",
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 110,
    },
    textBotãoInicio: {
        color: 'white',
        fontSize: 19,
        fontFamily: 'Lexend-VariableFont_wght',
        fontWeight: '900'
    },
    textoSBV1: {
        color: "#90C9BC",
        fontFamily: 'Jomhuria-Regular',
        fontSize: 73,
        position: 'absolute',
        bottom: 180,
        left: -135
    },
    textoSBV2: {
        color: "#90C9BC",
        fontFamily: 'Jomhuria-Regular',
        fontSize: 73,
        position: 'absolute',
        bottom: 135,
        left: -135
    },
    imagem: {
        flex: 1,
    }
});
