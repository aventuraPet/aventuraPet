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
            req.session.strErrorMsg = "nome invalido tente novamente"

            return res.redirect('/aventura-pet')
        }


        aventuraPetController.insertImgPet(req, res);

    });

aventuraPetRouter.get('/aventura-pet/get-img', function (req, res) {

    aventuraPetController.getImgPet(req, res, 1)
});

aventuraPetRouter.get('/aventura-pet/view-pets', function (req, res) {
    //colocar a autenticação no futuro
    if (!req.session.offsetPet) {

        req.session.offsetPet = 0;
        
    }

    req.session.offsetPet = 0;
    aventuraPetController.viewPets(req, res);
});

aventuraPetRouter.get('/aventura-pet/view-pets/dislike/:idUserPet', function (req, res) {
    //colocara a validação do id 
    //colocar a autenticação
    console.log(req.params);

    aventuraPetController.dislike(req, res);
});

aventuraPetRouter.get('/aventura-pet/view-pets/like/:idUserPet', function (req, res) {
    //console.log(req.params.idUserPet);
    aventuraPetController.like(req, res);
});
aventuraPetRouter.get('/aventura-pet/mark/:idUserPet', function (req, res) {
    //console.log(req.params.idUserPet);
    aventuraPetController.mark(req, res);
});

aventuraPetRouter.get('/aventura-pet/my-pets', function(req, res){
    aventuraPetController.myPets(req, res);
})

aventuraPetRouter.get('/aventura-pet/favorite', isAutentication, function (req, res) {
    aventuraPetController.favoritePage(req, res);
});

aventuraPetRouter.get('/aventura-pet/distance', function(req, res){
    aventuraPetController.configDistancePage(req, res);
});
aventuraPetRouter.post('/aventura-pet/distance', function(req, res){
    aventuraPetController.configDistanceUpdate(req, res);
});

aventuraPetRouter.get('/aventura-pet/configure', function(req,res){
    aventuraPetController.configurePage(req, res);
});

aventuraPetRouter.post('/aventura-pet/configure', function(req,res){
    aventuraPetController.configureUpdate(req, res);
});
aventuraPetRouter.get('/aventura-pet/change-pass', function(req,res){
    aventuraPetController.changePassPage(req, res);
});
aventuraPetRouter.post('/aventura-pet/change-pass', function(req,res){
    aventuraPetController.verifyPass(req, res);
});
aventuraPetRouter.post('/aventura-pet/new-pass', function(req,res){
    aventuraPetController.newPass(req, res);
});

module.exports = aventuraPetRouter;

