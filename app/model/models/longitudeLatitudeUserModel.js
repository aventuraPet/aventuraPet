const connect = require('../connect');
const { DataTypes } = require('sequelize');

const longitudeLatitudeUserModel = connect.define(
    'longitude_Latitude_User', {
    id_longitude_latitude_user: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cidade:{
        type: DataTypes.CHAR(200),
        allowNull: false
    },
    latitude: {
         type: DataTypes.CHAR(50),
        allowNull: false
    },
    longitude: {
        type: DataTypes.CHAR(50),
        allowNull: false
    },

    },
    {
        timestamps: false,
        freezeTableName: true,

    }
);

module.exports = longitudeLatitudeUserModel;