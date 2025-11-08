const petUserModel = require('../model/models/petUserModel');
const imagePetModel = require('../model/models/imagePetModel');
const userModel = require('../model/models/userModel');
const contactUserModel = require('../model/models/contactUserModel');
var searchCEP = require('../libs/searchCEP');
const notViewUserPetModel = require('../model/models/notViewUserPetModel');
const calcDistance = require('../libs/calcDistance');
const configUserModel = require('../model/models/configUserModel');
const viewPetUserModel = require('../model/models/viewPetUser');
const { QueryTypes } = require('sequelize');
const sequelize = require('../model/connect');
const { use } = require('passport');

userModel.hasMany(petUserModel, { foreignKey: 'id_usuario' });
petUserModel.belongsTo(userModel, { foreignKey: 'id_usuario' });


module.exports = {
    index: async function (req, res) {
        res.render('aventura-pet/index', { fileName: 'main' });
    },
    addPetPage: function (req, res) {

        res.render('aventura-pet/index', { fileName: 'add-pet' });
    },
    insertImgPet: async function (req, res) {


        let idUser = req.session.userAutentication.dataUser[0].id_usuario;

        try {
            const userPet = await petUserModel.create({
                id_usuario: idUser,
                nome_pet: req.body.namepet,
                disponivel: true,
                idade: req.body.idade,
                caracteristica: req.body.caracteristica
            });

            const idPetUser = userPet.id_user_pet;

            await imagePetModel.create({
                id_user_pet: idPetUser,
                imagem: req.file.buffer
            });

        } catch (error) {
            console.log(error)
        }

        res.render('aventura-pet/index', { fileName: 'main' });
    },

    viewPets: async function (req, res) {

        let idUser = req.session.userAutentication.dataUser[0].id_usuario;
        //string do tipo json que armazena os pets visualizado pelo usuario
        let user = await userModel.findAll({
            where: {
                id_usuario: idUser
            }
        });
        let arrUser = JSON.parse(JSON.stringify(user, null));
        let petVisualizado = JSON.parse(arrUser[0].pet_visualizado);
        if (!req.session.userAutentication.dataUser[0].pet_visualizado) {
            req.session.userAutentication.dataUser[0].pet_visualizado
        }

        req.session.userAutentication.dataUser[0].pet_visualizado = petVisualizado
        console.log(petVisualizado)
        //petVisualizado.push({ id_user_pet: 7, pet_like: false });
        let arrContactUser = await this.getContactUser(idUser);
        let arrConfigUser = await this.getConfigUser(idUser);

        if (!req.session.offsetPet) {

            req.session.offsetPet = 0;
            console.log(req.session.offsetPet);
        }

        do {
            var petResult = await this.verifyViewPet(req.session.offsetPet, petVisualizado);
            console.log(petResult);
            if (petResult == false) {
                res.redirect('/aventura-pet');
                req.session.offsetPet = 0;
                return;
            }
            var distanceResult = await this.verifyDistance(arrConfigUser[0].distancia, arrContactUser[0].cep, petResult.pet[0].cep)



            console.log(petResult.result);
            console.log(distanceResult.result);

            var result = '';

            //se o pet foi visualizado e se é dentro da distancia -> true e busca o proximo
            //true && true

            if (petResult.result && distanceResult.result) {
                console.log("true && true")
                result = true;
                req.session.offsetPet++;
            }

            //se o pet foi visualizado e nao esta dentro da distancia -> true e busca o proximo  
            //true && !false->true
            if (petResult.result && !distanceResult.result) {
                console.log("true && !false->true")
                result = true;
                req.session.offsetPet++;
            }

            //se o pet nao foi visualizado e nao esta dentro da distancia -> true e busca o proximo
            //!false->true && !false->true
            if (!petResult.result && !distanceResult.result) {
                console.log("!false->true && !false->true")
                result = true;
                req.session.offsetPet++;
            }


            //se o pet nao foi visualizado e esta dentro da distancia -> false e nao busca o proximo
            //!false->true && true
            if (!petResult.result && distanceResult.result) {
                console.log("!false->true && true")
                result = false;
                req.session.offsetPet++;
            }



        } while (result);

        var data = [];

        petResult.pet.forEach(pet => {
            data.push({
                img: Buffer.from(pet.imagem).toString('base64'),
                nome_pet: pet.nome_pet,
                idade: pet.idade,
                cidade: distanceResult.cidade,
                caracteristica: pet.caracteristica,
                distancia: distanceResult.distance,
                idUserPet: pet.id_user_pet,
                telefone: pet.telefone
            });
        });

        res.render('aventura-pet/index', { fileName: 'principal', data: data, msg:"msg" });
    },
    verifyViewPet: async function (offset, petVisualizado) {
        //funcao que verifica se o pet ja foi visualizado pelo usuario
        //se foi retorna um true
        //se nao foi visualizado retorna um false
        //se nao tem nenhum pet cadastrado retorna false
        var pet = await this.getPet(offset, petVisualizado);
        if (pet == false) {
            return false;
        }
        var result = '';
        if (petVisualizado.length == 0) {
            return { result: false, pet: pet }
        }
        
        petVisualizado.forEach(visualizado => {
            console.log("visualizado.id_user_pet " + visualizado.id_user_pet + " " + "pet[0].id_user_pet " +  pet[0].id_user_pet);
            console.log(visualizado.id_user_pet == pet[0].id_user_pet);

            //arrumar
            if (visualizado.id_user_pet == pet[0].id_user_pet) {
                result = true;
                
                //return { result: result, pet: pet }
            } else {
                result = false;

                //return { result: result, pet: pet }
            }


        });

        return { result: result, pet: pet }

    },
    getPet: async function (offset, petVisualizado) {

        var query = `SELECT 
                pet_user.id_usuario,
                pet_user.nome_pet,
                pet_user.idade,
                pet_user.caracteristica,
                pet_user.disponivel,
                pet_user.id_user_pet,
                usuario.nome_usuario,
                contato_usuario.telefone,
                contato_usuario.cep,
                image_pet.imagem 
                FROM pet_user 
                INNER JOIN usuario ON pet_user.id_usuario = usuario.id_usuario
                INNER JOIN contato_usuario ON pet_user.id_usuario = contato_usuario.id_usuario
                INNER JOIN image_pet ON pet_user.id_user_pet = image_pet.id_user_pet
                WHERE pet_user.disponivel = 1 ORDER BY pet_user.id_user_pet DESC `;

        if (petVisualizado.length == 0) {
            console.log(petVisualizado);
            var notViewUserPet = await sequelize.query(
                query + `LIMIT 0,1`,
                { type: QueryTypes.SELECT }
            );
        } else {
            var notViewUserPet = await sequelize.query(
                query + `LIMIT ${offset}, 1`,
                { type: QueryTypes.SELECT }
            );
        }
        if (notViewUserPet.length == 0) {

            return false;
        } else {
            return notViewUserPet;
        }

    },
    getContactUser: async function (idUser) {
        let contactUser = await contactUserModel.findAll({ where: { id_usuario: idUser } });
        return JSON.parse(JSON.stringify(contactUser, null));
    },
    getConfigUser: async function (idUser) {
        let configUser = await configUserModel.findAll({ where: { id_usuario: idUser } });
        return JSON.parse(JSON.stringify(configUser, null));
    },
    verifyDistance: async function (configDistanceUser, cepUser, cepPet) {
        //funcao que pega logitude e latitude do usuario, e do pet
        //calcular a distancia e verifica se esta dentro da distancia do usuario
        //e retorna um objeto com atributo de result e cidade

        let dataSerachCEPUser = await this.promisseGetLatLong(cepUser);
        let latitudeUser = dataSerachCEPUser.latitude;
        let longitudeUser = dataSerachCEPUser.longitude;

        let dataSerachCEPUserPet = await this.promisseGetLatLong(cepPet)
        let latitudeUserPet = dataSerachCEPUserPet.latitude;
        let longitudeUserPet = dataSerachCEPUserPet.longitude;
        let cidadeUserPet = dataSerachCEPUserPet.cidade.nome
        let distance = calcDistance(latitudeUser, longitudeUser, latitudeUserPet, longitudeUserPet);
        //console.log(distance)
        //console.log(dataSerachCEPUser)
        //console.log(dataSerachCEPUserPet)
        if (distance <= configDistanceUser) {
            return { result: true, cidade: cidadeUserPet, distance: distance };
        }

        return { result: false, cidade: cidadeUserPet, distance: distance };
    },


    promisseGetLatLong: function (cep) {
        //funcao que gera uma promise com um tempo de 2 segundos de diferença da primeira requisição
        //a api bloqueia varias requisiçoes ao mesmo tempo
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(
                    searchCEP(cep)
                )
            }, 1000)
        })
    },

    dislike: async function (req, res) {
        let idUserPet = req.params.idUserPet;
        let idUser = req.session.userAutentication.dataUser[0].id_usuario;

        let petVisualizado = req.session.userAutentication.dataUser[0].pet_visualizado;
       
        petVisualizado.push({ id_user_pet: idUserPet, pet_like: false });

        userModel.update({ pet_visualizado: JSON.stringify(petVisualizado) },
            {
                where: {
                    id_usuario: idUser
                }
            });
        res.redirect('/aventura-pet/view-pets/')
    },
    like: async function (req, res) {
        let idUserPet = req.params.idUserPet;
        let idUser = req.session.userAutentication.dataUser[0].id_usuario;

        let petVisualizado = req.session.userAutentication.dataUser[0].pet_visualizado;
      
        petVisualizado.push({ id_user_pet: idUserPet, pet_like: true });

        userModel.update({ pet_visualizado: JSON.stringify(petVisualizado) },
            {
                where: {
                    id_usuario: idUser
                }
            });
        res.redirect('/aventura-pet/view-pets/')
    },
    favorite: function(req, res){
        console.log(req.session.userAutentication.dataUser.pet_visualizado);
    }

}


