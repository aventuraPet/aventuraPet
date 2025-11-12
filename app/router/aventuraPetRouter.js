const express = require('express');
const aventuraPetRouter = express.Router();
const aventuraPetController = require('../controller/aventuraPetController');
const { checkSchema, validationResult } = require('express-validator');
//const uploads = require('../libs/multerFunctions');
const multer = require('multer');
const storage = multer.memoryStorage();
const uploads = multer({ storage: storage });

const isAutentication = function (req, res, next) {
    if (!req.session.autentication) {
        if (!req.session.strErrorMsg) {
            req.session.strErrorMsg = "";
        }
        req.session.strErrorMsg = "voce nao tem autorização para acessar a pagina";
        return res.redirect('/login');
    }

    next();
}


aventuraPetRouter.get('/aventura-pet', isAutentication, function (req, res) {
    aventuraPetController.index(req, res);
});

aventuraPetRouter.get('/aventura-pet/add-pet', isAutentication, function (req, res) {
    aventuraPetController.addPetPage(req, res);
});

aventuraPetRouter.post('/aventura-pet/add-img',
    uploads.single('imgpet'),
    isAutentication,
    checkSchema({
        namepet: {
            in: ['body'],
            escape: true,
            trim: true,
            errorMessage: "nome invalido tente novamente",
            notEmpty: true,
            isLength: {
                options: {
                    min: 4,
                    max: 100
                }
            }
        },
        idade: {
            in: ['body'],
            escape: true,
            trim: true,
            errorMessage: "nome invalido tente novamente",
            notEmpty: true,
            isNumeric: true

        },
        caracteristica: {
            in: ['body'],
            escape: true,
            trim: true,
            errorMessage: "nome invalido tente novamente",
            notEmpty: true,
            isLength: {
                options: {
                    min: 4,
                    max: 100
                }
            }
        }
    }),
    function (req, res) {
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            if (!req.session.strErrorMsg) {
                req.session.strErrorMsg = "";
            }
            req.session.strErrorMsg = "erro nome, idade, caracteristica ou imagem invalido tente novamente"
            
            return res.redirect('/aventura-pet')
        }


        aventuraPetController.insertImgPet(req, res);

    }
);

aventuraPetRouter.get('/aventura-pet/view-pets', isAutentication, function (req, res) {

    if (!req.session.offsetPet) {
        req.session.offsetPet = 0;
    }
    req.session.offsetPet = 0;
    aventuraPetController.viewPets(req, res);
});

aventuraPetRouter.get('/aventura-pet/view-pets/dislike',
    isAutentication,
    checkSchema({
        idUserPet: {
            in: ['query'],
            escape: true,
            trim: true,
            notEmpty: true,
            errorMessage: "error query invalido",
            isNumeric: true
        }
    }),
    function (req, res) {
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            if (!req.session.strErrorMsg) {
                req.session.strErrorMsg = "";
            }
            req.session.strErrorMsg = "error query invalido"

            return res.redirect('/aventura-pet');
        }
        aventuraPetController.dislike(req, res);
    }
);

aventuraPetRouter.get('/aventura-pet/view-pets/like',
    isAutentication,
    checkSchema({
        idUserPet: {
            in: ['query'],
            escape: true,
            trim: true,
            notEmpty: true,
            errorMessage: "error query invalido",
            isNumeric: true
        }
    }),
    function (req, res) {
        const errorResult = validationResult(req);
       
        if (!errorResult.isEmpty()) {
            if (!req.session.strErrorMsg) {
                req.session.strErrorMsg = "";
            }
            req.session.strErrorMsg = "error query invalido"

            return res.redirect('/aventura-pet');
        }
        aventuraPetController.like(req, res);
    });
aventuraPetRouter.get('/aventura-pet/mark',
    isAutentication,
    checkSchema({
        idUserPet: {
            in: ['query'],
            escape: true,
            trim: true,
            notEmpty: true,
            errorMessage: "error query invalido",
            isNumeric: true
        }
    }),
    function (req, res) {
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            if (!req.session.strErrorMsg) {
                req.session.strErrorMsg = "";
            }
            req.session.strErrorMsg = "error query invalido"
            console.log(req.query);
            return res.redirect('/aventura-pet');
        }

        aventuraPetController.mark(req, res);
    });

aventuraPetRouter.get('/aventura-pet/my-pets', isAutentication, function (req, res) {
    aventuraPetController.myPets(req, res);
})

aventuraPetRouter.get('/aventura-pet/favorite', isAutentication, function (req, res) {
    aventuraPetController.favoritePage(req, res);
});

aventuraPetRouter.get('/aventura-pet/distance', isAutentication, function (req, res) {
    aventuraPetController.configDistancePage(req, res);
});
aventuraPetRouter.post('/aventura-pet/distance',
    isAutentication,
    checkSchema({
        distancia: {
            in: ['body'],
            escape: true,
            trim: true,
            notEmpty: true,
            errorMessage: "distancia invalida"
        }
    }),
    function (req, res) {
       const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            if (!req.session.strErrorMsg) {
                req.session.strErrorMsg = "";
            }
            req.session.strErrorMsg = "distancia invalida"

            return res.redirect('/aventura-pet')
        }
        aventuraPetController.configDistanceUpdate(req, res);
    });

aventuraPetRouter.get('/aventura-pet/configure', isAutentication, function (req, res) {
    aventuraPetController.configurePage(req, res);
});

aventuraPetRouter.post('/aventura-pet/configure',
    isAutentication,
    checkSchema({
        telefone: {
            in: ['body'],
            errorMessage: "telefone invalido",
            trim: true,
            escape: true,
            notEmpty: true,
            isNumeric: true,
            isLength: {
                options: {
                    min: 11,
                    max: 20
                }
            }
        },
        email: {
            in: ['body'],
            errorMessage: "email invalido",
            trim: true,
            escape: true,
            notEmpty: true,
            isEmail: true,
            isLength: {
                options: {
                    max: 100
                }
            }
        },
        cep: {
            in: ['body'],
            errorMessage: "cep invalido",
            trim: true,
            escape: true,
            notEmpty: true,
            isNumeric: true,
            isLength: {
                options: {
                    min: 8,
                    max: 8
                }
            }
        }
    }),
    function (req, res) {
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            if (!req.session.strErrorMsg) {
                req.session.strErrorMsg = "";
            }
            req.session.strErrorMsg = "telefone, cep ou email estao invalido tente novamente"

            return res.redirect('/aventura-pet');
        }
        aventuraPetController.configureUpdate(req, res);
    });
aventuraPetRouter.get('/aventura-pet/change-pass', isAutentication, function (req, res) {
    aventuraPetController.changePassPage(req, res);
});
aventuraPetRouter.post('/aventura-pet/change-pass',
    isAutentication,
    checkSchema({
        password: {
            in: ['body'],
            isLength: {
                options: { min: 8 }
            },
            matches: {
                options: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/
            },
            trim: true,
            escape: true
        }
    }),
    function (req, res) {
        console.log(req.body);
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            if (!req.session.strErrorMsg) {
                req.session.strErrorMsg = "";
            }
            req.session.strErrorMsg = "senha invalida"
            
            return res.status(200).send({msg: errorResult});
        }
        aventuraPetController.verifyPass(req, res);
    });
aventuraPetRouter.post('/aventura-pet/new-pass',
    isAutentication,
    checkSchema({
        password: {
            in: ['body'],
            isLength: {
                options: { min: 8 }
            },
            matches: {
                options: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/
            },
            trim: true,
            escape: true
        },
        verifyPassword: {
            in: ['body'],
            isLength: {
                options: { min: 8 }
            },
            matches: {
                options: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/
            },
            trim: true,
            escape: true
        }
    }),
    function (req, res) {
        const errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            if (!req.session.strErrorMsg) {
                req.session.strErrorMsg = "";
            }
            req.session.strErrorMsg = "senha invalida tente novamente"

            return res.redirect('/aventura-pet')
        }
        aventuraPetController.newPass(req, res);
    });

module.exports = aventuraPetRouter;

