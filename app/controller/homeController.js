const petUserModel = require('../model/models/petUserModel');
const imagePetModel = require('../model/models/imagePetModel');
const userModel = require('../model/models/userModel');
const { use } = require('passport');

userModel.hasMany(petUserModel, { foreignKey: 'id_usuario', as: 'pets' });
petUserModel.belongsTo(userModel, { foreignKey: 'id_usuario', as: 'owner' });

petUserModel.hasOne(imagePetModel, { foreignKey: 'id_user_pet', as: 'image' });
imagePetModel.belongsTo(petUserModel, { foreignKey: 'id_user_pet', as: 'pet' });

module.exports = {
    index: async function (req, res) {

        let userPet = await this.getPet();
        let numAdotados = await this.getNumberadopted();
        let data = [];
        let msg = false;
        let numPetDisponivel = await this.getNumberPetAvaliable();

        //console.log(pets);
        //gera um novo objeto corretamente para ser mostrado na home do front and
        //verifica se o tem usuario no retorno da consulta no banco
        if (userPet != null) {
            //verifica se tem mais de um usuario com pet
            //interação do resultado da consulta de forma automatica se o usuario tiver um ou mais pets
            if (userPet.length > 1) {
                userPet.forEach(pets => {
                    pets.pets.forEach(pet => {
                        data.push({
                            "img": Buffer.from(pet.image.imagem).toString('base64'),
                            "nome_pet": pet.nome_pet,
                            "idade": pet.idade,
                            "caracteristica": pet.caracteristica
                        });
                    });
                });
            } else {
                //qunado o resultado da consulta tiver somente um usuario
                userPet.forEach(pet => {
                    data.push({
                        "img": Buffer.from(pet.image.imagem).toString('base64'),
                        "nome_pet": pet.nome_pet,
                        "idade": pet.idade,
                        "caracteristica": pet.caracteristica
                    });
                });
            }

            msg = true;
        }

        /*if (pets != null) {
           
            if (pets.length > 1) {
                pets.forEach(pet => { console.log(pet.pets);
                    pet.forEach(element =>{
                        
                        data.push({
                        
                        "img": Buffer.from(element.image.imagem).toString('base64'),
                        "nome_pet": element.nome_pet,
                        "idade": element.idade,
                        "caracteristica": element.caracteristica
                    });
                    })
                    
                })
            } else {
                pets.forEach(pet => {
                data.push({
                        "img": Buffer.from(pet.image.imagem).toString('base64'),
                        "nome_pet": pet.nome_pet,
                        "idade": pet.idade,
                        "caracteristica": pet.caracteristica
                    });
                });
            }

            msg = true;
        }*/



    console.log(numPetDisponivel);
        res.render('home/index', { fileName: 'main', "data": data, "numAdotados": numAdotados, "msg": msg, "numPetDisponivel":numPetDisponivel});
    },
    pets: function (req, res) {
        res.render('home/index', { fileName: 'pets' });
    },
    about: function (req, res) {
        res.render('home/index', { fileName: 'about' });
    },

    getPet: async function () {
        //funcao que traz no maximo 4 usuarios
        const users = await userModel.findAll({

            include: {
                model: petUserModel,
                as: 'pets',

                include: {
                    model: imagePetModel,
                    as: 'image'
                }
            }
        });

        const arrUsers = JSON.parse(JSON.stringify(users, null));
        //pega os ids do usuario
        let ids = [];

        arrUsers.forEach(user => {
            ids.push(user.id_usuario);
        });

        console.log(arrUsers);
        // Consulta com aliases explícitos

        let data = [];
        //tras os dados do pet de acordo com os ids do usuario
        for (id of ids) {

            let user = await userModel.findAll({
                where: { id_usuario: id },
                include: {
                    model: petUserModel,
                    as: 'pets',
                    where: { disponivel: true },
                    required: true,
                    include: {
                        model: imagePetModel,
                        as: 'image'
                    }
                }
            });
            if (JSON.parse(JSON.stringify(user, null, 2)).length != 0) {
                data.push(JSON.parse(JSON.stringify(user[0], null, 2)));
            }


        }

        if (data.length == 0) {
            return null
        }
        if (data.length > 1) {
            return data;
        }

        return data[0].pets


    },

    //criar funcoa que soma a quantidade de pets que nao estao disponivel para indicar o numero de pets que ja foram adotado na plataforma
    //e manda para o front end
    getNumberadopted: async function () {

        let user = await userModel.findAll({

            include: {
                model: petUserModel,
                as: 'pets',
                where: { disponivel: false },
                required: true,

            }
        });

        if (JSON.parse(JSON.stringify(user, null, 2)).length != 0) {
            return JSON.parse(JSON.stringify(user[0].pets, null, 2)).length;
        }

        return 0;


    },

    getNumberPetAvaliable: async function () {
        let petUser = await petUserModel.count({
            where: {
                disponivel: 1
            },

        });

        return JSON.parse(JSON.stringify(petUser, 0));
    }



}