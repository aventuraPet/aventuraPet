const connect = require('../connect');
const { DataTypes } = require('sequelize');

const contactUserModel = connect.define(
    'contato_usuario',
    {
        id_contato_usuario:{
            type:DataTypes.INTEGER,
            primaryKey:true,
            autoIncrement: true
        },
        id_usuario:{
            type:DataTypes.INTEGER,
            allowNull: false
        },
        telefone:{
            type:DataTypes.STRING(20),
            allowNull: false
        },
        cep:{
            type:DataTypes.STRING(9),
            allowNull: false
        },
        email:{
            type:DataTypes.STRING(100),
            allowNull: false
        }
    },
    {
        timestamps:false,
        freezeTableName:true
    }
);



module.exports = contactUserModel;
