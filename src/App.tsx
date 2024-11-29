import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TelaBemVindo from './BemVindo.tsx';
import Registro from './Registro.tsx';
import Home from './Home.tsx'
import Login from './Login.tsx'
import HomeScreen from './Planta.tsx';
import Plantas from './Planta.tsx';
import Jardins from './Jardins.tsx';

const stack = createNativeStackNavigator()

function App() {
  return (
    <NavigationContainer>
      <stack.Navigator
      screenOptions={{
        header: () => null
      }}
      >
        <stack.Screen
        name='Screen_A'
        component={TelaBemVindo}
        />
        <stack.Screen
        name='Screen_B'
        component={Registro}
        />
        <stack.Screen
        name='Screen_C'
        component={Home}
        />
        <stack.Screen
        name='Screen_D'
        component={Login}
        />
        <stack.Screen
        name='plantas'
        component={Plantas}
        />
        <stack.Screen
        name='jardins'
        component={Jardins}
        />
      </stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
