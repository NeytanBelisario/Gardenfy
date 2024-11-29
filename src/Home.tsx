import React from 'react';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import Jardins from './Jardins';
import CameraNe from './Camera';
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { useTheme } from 'react-native-paper';
import IdentiSaude from './IdentiSaude';


const Tab = createMaterialBottomTabNavigator();

export default function Home() {
    const theme = useTheme();
    theme.colors.secondaryContainer = "transperent"
    return (
        <Tab.Navigator
            labeled={false}
            barStyle={{ backgroundColor: '#ffffff', borderTopColor: '#cfe8e2', borderTopWidth: 2 }}
        >
            <Tab.Screen
                name='jardins'
                component={Jardins}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <FontAwesome name='leaf' color={focused ? "#76BDAC" : "#cfe8e2"} size={30} />
                    )
                }}
            />
            <Tab.Screen
                name='IdentiSaude'
                component={IdentiSaude}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <FontAwesome name='pagelines' color={focused ? "#76BDAC" : "#cfe8e2"} size={30} />
                    )
                }}
            />
            <Tab.Screen
                name='camera'
                component={CameraNe}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <FontAwesome name='camera' color={focused ? "#76BDAC" : "#cfe8e2"} size={30} />
                    )
                }}
            />
        </Tab.Navigator>
    )
}