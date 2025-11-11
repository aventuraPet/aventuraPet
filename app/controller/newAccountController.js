const msgSession = require('../libs/msgSession');
const userModel = require('../model/models/userModel');
const contactUserModel = require('../model/models/contactUserModel');
const passwordHashModel = require('../model/models/passwordHashModel');
const configUserModel = require('../model/models/configUserModel');
const bcrypt = require('bcryptjs');

module.exports = {
    index: function (req, res) {
        res.render('newAccount/index', { fileName: 'notices', msgError: msgSession.getMsgError(req)});
        msgSession.cleanMsgError(req);
    },
    createAccount: async function(req, res) {
        const { user_name, email, password, phone, cep, petPreference } = req.body;
        
        try {
            // Check if email already exists
            let userContact = await contactUserModel.findAll({where:{email: email}});
            if(userContact.length != 0){
                req.session.strErrorMsg = "Email já cadastrado. Por favor, tente recuperar a conta ou crie uma nova.";
                return res.redirect('/new-account');
            }

            // Create new user
            let newUser = await userModel.create({
                nome_usuario: user_name,
                tipo_usuario: 1
            });

            let idNewUser = newUser.id_usuario;

            
            await contactUserModel.create({
                id_usuario: idNewUser,
                telefone: phone,
                cep: cep, 
                email: email,
                pet_visualizado: '[]'
            });

            await configUserModel.create({
                id_usuario: idNewUser,
                distancia: 10
            });

            let salt = bcrypt.genSaltSync(10);
            let hash = bcrypt.hashSync(password, salt);
            let dateNow = new Date();

            await passwordHashModel.create({
                id_usuario: idNewUser,
                password_hash: hash,
                ativo: 1,
                data_criacao: `${dateNow.getFullYear()}-${dateNow.getMonth() + 1}-${dateNow.getDate()}`
            });

            // You might want to save pet preference somewhere, perhaps in a new table or user model
            // For now, we'll just log it
            console.log(`User ${idNewUser} prefers: ${petPreference}`);

            req.session.strSuccessMsg = "Nova conta criada com sucesso! Agora insira seu email e senha para entrar.";
            return res.redirect('/login');

        } catch (error) {
            console.error(error);
            req.session.strErrorMsg = "Erro ao tentar criar a nova conta. Por favor, tente novamente.";
            return res.redirect('/new-account');
        }
    },
    namePage: function (req, res) {
        res.render('newAccount/index', { fileName: 'name', msgError: msgSession.getMsgError(req) });
        msgSession.cleanMsgError(req);
    },
    contactPage: function (req, res) {
        res.render('newAccount/index', { fileName: 'contact', msgError: msgSession.getMsgError(req) });
        msgSession.cleanMsgError(req);
    },
    passwordPage: function (req, res) {
        res.render('newAccount/index', { fileName: 'password', msgError: msgSession.getMsgError(req) });
        msgSession.cleanMsgError(req);
    },
    verifyData: async function(req, res){

        //funcao para verificar se o email ja existe no banco de dados
        //verificar se a senha passada é igual aos 2 campos.
        //caso positivo para ambos
        //é salvo no banco de dados e direcionado para a tela de login para fazer a autenticacao
        //entrar no sistema

        let contactJson = req.session.newAccount.find(account => account.contact);
        let contactEmail = contactJson.contact.email;
        let userContact = await contactUserModel.findAll({where:{email: contactEmail}});
        console.log(req.session.newAccount);
        if(userContact.length !=0){
            req.session.newAccount = "";
            req.session.strErrorMsg = "email já cadastrado por favor tente recuperar a conta ou crie uma nova";
            return res.redirect('/login');
        }

        let arrPassword = req.session.newAccount.find(account => account.password);
        if(arrPassword.password[0] !== arrPassword.password[1]){
            //limpa a variavel na sessao
            req.session.newAccount[2].password = "";
            req.session.strErrorMsg = "senha digitade é invalida tente novamente";
            return res.redirect('/new-account/password')
        }
       
        
        try {
           let newUser = await userModel.create({
                nome_usuario: req.session.newAccount[0].user_name,
                tipo_usuario:1
            });

            let idNewUser = newUser.id_usuario;
            
            await contactUserModel.create({
                id_usuario: idNewUser,
                telefone: req.session.newAccount[1].contact.telefone,
                cep: req.session.newAccount[1].contact.cep,
                email: req.session.newAccount[1].contact.email
            });

            let salt = bcrypt.genSaltSync(10);
            let hash = bcrypt.hashSync(req.session.newAccount[2].password[0], salt);
            let dateNow = new Date();
            
            await passwordHashModel.create({
                id_usuario: idNewUser,
                password_hash: hash,
                ativo:1,
                data_criacao: `${dateNow.getFullYear()}-${dateNow.getMonth()}-${dateNow.getDate()}`
            });

        } catch (error) {
            
            req.session.strErrorMsg = "Erro ao tentar inserir a nova conta por favor tente novamente";
            return res.redirect('/login');
        }
        
        req.session.strSuccessMsg = "Nova conta criada com sucess agora insira o seu email e senha!"
        return res.redirect('/login');
    }

}
