export const autenticacao = {} => {
    const {email,senha} = req.body;
    try{

    }catch (error) {

    }
}

export const registrarUsuario = (req,res) => {
    const {nome,email,senha} = req.body;

    try{
        if(nome === "" || email  === "" || senha=== "")
            return res.status(400).json({stats: false, mensagem: "Os campos NOME, EMAIL, E SENHA para registro de usuáio são obrigatórios"})
        const [rows] = db.query("INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?,?,?,?", [nome, email, senha, 3]);

        if(!rows.affectedRows)
            return res.status(400).json({status: false, mensagem: "Ocorreu um erro ao salvar o susuário. Tente novamente."})

        return res.status(201).json({status: true, mensagem: "Usuário criado com sucesso"})


    } catch (error){
        return res.status(500).json({mensagem: "Ocorreu um erro"})

    }
}