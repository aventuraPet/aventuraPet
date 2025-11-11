const petUserModel = require('../model/models/petUserModel');
const imagePetModel = require('../model/models/imagePetModel');
const userModel = require('../model/models/userModel');
const contactUserModel = require('../model/models/contactUserModel');
var searchCEP = require('../libs/searchCEP');
const calcDistance = require('../libs/calcDistance');
const configUserModel = require('../model/models/configUserModel');
const { QueryTypes } = require('sequelize');
const sequelize = require('../model/connect');
const msgSession = require('../libs/msgSession');
const passWordHashModel = require('../model/models/passwordHashModel');
const bcrypt = require('bcryptjs');
const passwordHashModel = require('../model/models/passwordHashModel');



module.exports = {
    index: async function (req, res) {
        res.render('aventura-pet/index', { fileName: { menu: 'main' } });
    },
    addPetPage: function (req, res) {

        res.render('aventura-pet/index', { fileName: { menu: "main", section: 'add-pet' } });
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

        res.render('aventura-pet/index', { fileName: { menu: 'main' } });
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
            //console.log(petResult);
            if (petResult == false) {

                if (!req.session.strErrorMsg) {
                    req.session.strErrorMsg = "Não ha mais pets disponivel para a sua perfio";
                }

                res.render('aventura-pet/index', { fileName: { menu: "main" }, msgError: msgSession.getMsgError(req) });
                req.session.offsetPet = 0;
                return;
            }
            var distanceResult = await this.verifyDistance(arrConfigUser[0].distancia, arrContactUser[0].cep, petResult.pet[0].cep)



            //console.log(petResult.result);
            //console.log(distanceResult.result);

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

        res.render('aventura-pet/index', {
            fileName: {
                menu: "main",
                section: "principal"
            }, data: data
        });
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
        var result = false;
        if (petVisualizado.length == 0) {
            return { result: false, pet: pet }
        }

        petVisualizado.forEach(visualizado => {
            console.log("visualizado.id_user_pet " + visualizado.id_user_pet + " " + "pet[0].id_user_pet " + pet[0].id_user_pet);
            console.log(visualizado.id_user_pet == pet[0].id_user_pet);


            if (visualizado.id_user_pet == pet[0].id_user_pet) {
                result = true;


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
        req.session.offsetPet = 0;
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
        req.session.offsetPet = 0;
        res.redirect('/aventura-pet/view-pets/')
    },
    favorite: function (req, res) {
        console.log(req.session.userAutentication.dataUser.pet_visualizado);
    },

    myPets: async function (req, res) {
        let idUser = req.session.userAutentication.dataUser[0].id_usuario;

        let petUser = await petUserModel.findAll({ where: { id_usuario: idUser } });
        let arrPetuser = JSON.parse(JSON.stringify(petUser, null));
        //arrPetuser.push(await this.getMyPets(arrPetuser));
        let arrImgPet = await this.getMyPets(arrPetuser);
        //funcao para incluir as imagem de acordo com cada pet
        arrPetuser.forEach(pet => {
            arrImgPet.forEach(img => {
                if (pet.id_user_pet == img.id_user_pet) {
                    pet.img = Buffer.from(img.imagem).toString('base64');
                }
            })
        });

        res.render('aventura-pet/index', { fileName: { menu: "main", section: 'my-pet' }, arrPetuser: arrPetuser });

    },
    getMyPets: async function (arrPetuser) {
        //funcao para pegar imagem no banco dos pets de acordo com o id do pet
        let arrImgPets = await Promise.all(
            //percorre o array e pode usar async e await 
            arrPetuser.map(async pet => {
                const imgPet = await imagePetModel.findAll({
                    where: { id_user_pet: pet.id_user_pet }
                });
                return JSON.parse(JSON.stringify(imgPet, null))[0];
            })
        );


        return arrImgPets;
    },

    mark: async function (req, res) {
        //funcao que marca pet como adotado
        await petUserModel.update(
            { disponivel: false },
            { where: { id_user_pet: req.params.idUserPet } });

        if (!req.session.strSuccessMsg) {
            req.session.strSuccessMsg = "pet marcado com sucesso";
        }
        res.redirect('/aventura-pet/my-pets')
    },

    configDistancePage: async function (req, res) {
        let configUser = await configUserModel.findAll({
            where: { id_usuario: req.session.userAutentication.dataUser[0].id_usuario }
        });

        let data = JSON.parse(JSON.stringify(configUser, null));

        res.render('aventura-pet/index', { fileName: { menu: "main", section: 'config-distance' }, configUser: data, msgSuccess: msgSession.getMsgSuccess(req) });

    },

    configDistanceUpdate: async function (req, res) {
        await configUserModel.update(
            { distancia: req.body.distancia },
            { where: { id_usuario: req.session.userAutentication.dataUser[0].id_usuario } });
        if (!req.session.strSuccessMsg) {
            req.session.strSuccessMsg = "distancia alterada com sucesso";
        }
        this.configDistancePage(req, res);
        msgSession.cleanMsgSuccess();

    },
    favoritePage: async function (req, res) {
        let user = await userModel.findAll({
            where: { id_usuario: req.session.userAutentication.dataUser[0].id_usuario }
        });

        let arrUser = JSON.parse(JSON.stringify(user, null));
        let arrPetVisualizado = JSON.parse(arrUser[0].pet_visualizado);

        if (arrPetVisualizado.length == 0) {
            if (!req.session.strErrorMsg) {
                req.session.strErrorMsg = "voce ainda nao tem pets favorito";
            }

            res.render('aventura-pet/index', { fileName: { menu: "main", section: 'favoritos' }, msgError: msgSession.getMsgError(req) });
        }

        let arrPet = await this.getPetUser(arrPetVisualizado);

        for (const pet of arrPet) {
            const imgPet = await imagePetModel.findAll({ where: { id_user_pet: pet[0].id_user_pet } });
            const arrImgPet = JSON.parse(JSON.stringify(imgPet, null));
            pet[0].img = Buffer.from(arrImgPet[0].imagem).toString("base64");

        };
        let data = [];

        arrPet.forEach(pet => {
            pet.forEach(p => {
                data.push(p);
            });
        });

        res.render('aventura-pet/index', { fileName: { menu: "main", section: 'favoritos' }, arrPet: data });

    },
    getPetUser: async function (arrPetVisualizado) {
        let arrDataPet = Promise.all(
            arrPetVisualizado.map(async pet => {
                const petUser = await petUserModel.findAll({ where: { id_user_pet: pet.id_user_pet } });
                return JSON.parse(JSON.stringify(petUser, null))
            }));



        return arrDataPet
    },

    configurePage: async function (req, res) {
        let idUser = req.session.userAutentication.dataUser[0].id_usuario;
        let contactUser = await contactUserModel.findAll({ where: { id_usuario: idUser } });
        let arrContactUser = JSON.parse(JSON.stringify(contactUser, null));

        res.render('aventura-pet/index',
            {
                fileName: { menu: "main", section: 'configure' },
                data: arrContactUser,
                msgSuccess: msgSession.getMsgSuccess(req)
            });
    },
    configureUpdate: async function (req, res) {
        let idUser = req.session.userAutentication.dataUser[0].id_usuario;
        const { telefone, cep, email } = req.body;
        await contactUserModel.update({
            telefone: telefone,
            cep: cep,
            email: email
        },
            {
                where: { id_usuario: idUser }
            })

        res.render('aventura-pet/index', { fileName: { menu: "main" } });
    },
    changePassPage: function (req, res) {
        res.render('aventura-pet/index', { fileName: { menu: "main", section: "change-pass" } });
    },
    verifyPass: async function (req, res) {
        let idUser = req.session.userAutentication.dataUser[0].id_usuario;
        const passNow = req.body.pass_now
        let userPass = await passWordHashModel.findAll({
            where: { id_usuario: idUser }
        });
        let arrUserPass = JSON.parse(JSON.stringify(userPass, null));

        if (!bcrypt.compareSync(passNow, arrUserPass[0].password_hash)) {
            return res.status(200).send({ status: false, msg: "senha invalida" })
        }


        let form = {
            body: {
                passOne: { element: 'input', type: "password", name: "passwordOne", id: "passwordOne", placeholder: "Nova senha" },
                passTwo: { element: 'input', type: "password", name: "passwordTwo", id: "passwordTwo", placeholder: "Verificar senha" },
                button: { element: 'input', type: "submit", value: "salvar", },
            }
        };

        res.status(200).send(form);

    },
    newPass: async function (req, res) {
        let idUser = req.session.userAutentication.dataUser[0].id_usuario;
        let salt = bcrypt.genSaltSync(10);
        console.log(req.body.password)
        let hash = bcrypt.hashSync(req.body.password, salt);
        await passwordHashModel.update({
            password_hash: hash
        }, {
            where: {
                id_usuario: idUser
            }
        });

       

        res.status(200).redirect("/aventura-pet");

    }





}


