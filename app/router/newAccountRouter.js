const express = require('express');
const newAccountRouter = express.Router();
const newAccountController = require('../controller/newAccountController');
const { checkSchema, validationResult } = require('express-validator');

newAccountRouter.get('/new-account', function (req, res) {
    newAccountController.index(req, res);
});

newAccountRouter.post('/new-account/create',
    checkSchema({
        user_name: {
            in: ['body'],
            escape: true,
            trim: true,
            errorMessage: "Nome inválido, tente novamente",
            notEmpty: true,
            isLength: {
                options: {
                    min: 4,
                    max: 100
                }
            }
        },
        email: {
            in: ['body'],
            errorMessage: "Email inválido",
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
        petPreference: {
            in: ['body'],
            errorMessage: "Preferência de pet inválida",
            notEmpty: true,
            isIn: {
                options: [['cachorro', 'gato']]
            }
        }
    }),
    function (req, res) {
        let errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            let errorValidator = errorResult.array();
            if (!req.session.strErrorMsg) {
                req.session.strErrorMsg = "";
            }
            req.session.strErrorMsg = errorValidator[0].msg;
            return res.redirect('/new-account');
        }

        newAccountController.createAccount(req, res);
    });

newAccountRouter.get('/new-account/name', function (req, res) {
    newAccountController.namePage(req, res);
});

newAccountRouter.post('/new-account/contact',
    checkSchema({
        user_name: {
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
        let errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            let errorValidator = errorResult.array();
            //cria variavel de erro na sessao do usuario
            if (!req.session.strErrorMsg) {
                req.session.strErrorMsg = "";
            }

            req.session.strErrorMsg = errorValidator[0].msg;
            return res.redirect('/new-account/name');
        }

        //cria variavel do usuaro na sessao
        if (!req.session.newAccount) {
            req.session.newAccount = [];
        }
        //salva dados na sessao
        req.session.newAccount.push({ user_name: req.body.user_name });
        newAccountController.contactPage(req, res);
    });

newAccountRouter.get('/new-account/contact', function (req, res) {
    newAccountController.contactPage(req, res);
})

newAccountRouter.post('/new-account/password',
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
                    max: 9
                }
            }

        }
    }),
    function (req, res) {
        let errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            if (!req.session.strErrorMsg) {
                req.session.strErrorMsg = "";
            }
            req.session.strErrorMsg = "campos invalido tente novamente";
            return res.redirect('/new-account/contact');
        }

        req.session.newAccount.push({
            contact: {
                telefone: req.body.telefone,
                email: req.body.email,
                cep: req.body.cep
            }
        });

        newAccountController.passwordPage(req, res);

    });
newAccountRouter.get('/new-account/password', function (req, res) {
    newAccountController.passwordPage(req, res)
})
newAccountRouter.get('/new-account', function (req, res) {
    newAccountController.passwordPage(req, res);
});
newAccountRouter.post('/new-account/login',
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
        let errorResult = validationResult(req);
        if (!errorResult.isEmpty()) {
            if (!req.session.strErrorMsg) {
                req.session.strErrorMsg = "";
            }
            req.session.strErrorMsg = "senha invalido tente novamente";
            return res.redirect('/new-account/password');
        }

        req.session.newAccount.push({
            password: req.body.password
        });



        newAccountController.verifyData(req, res);

    });



module.exports = newAccountRouter;