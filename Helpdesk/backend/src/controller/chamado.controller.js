import db from "../config/db.js"

export const abrirChamado{req, res} = (req, res) => {
    const {assunto, descricao, prioridade, solicitante_id, } = req.body
    try {

        if(asssunto === "")
            return res.status(400).json({
        status: false, mensagem:"Campo assunto é obrigatorio, não pode ficar vazio. "});

        if(descricao === "")
             return res.status(400).json({
        status: false, mensagem:"Campo assunto é obrigatorio, não pode ficar vazio. "});

        
        const sql = "INSERT INTO chamados (assunto, descricao, status, categoria_id, prioridade , solicitante_id, tecnico_id, data_abertura, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        const db.query(sql, [1,1, assunto, descricao, 'now()', prioridade, solicitante_id])
        
        if(!rows.affectedRow)
            return res.status(400).json({status: false, mensagem: "Erro! Não foi possivel cadastrar chamado. "})

        return res.status(201).json({status: true, mensagem:})
    }   catch(error) {
        return res.status(500).json({
            status:false,
            message: "Erro interno",
            })
    }
    
}

export const alteraChamado{req, res} = (req, res) => {

}

export const listarChamadoPorId = {req, res} = (req, res) => {
    const [id] = req.body
}
export const buscarChamado = {req, res} = (req, res) => {
    const [id, assunto] = req.body

    try{
        if(busca === " ")
        return.status(400).json({status: false, mensagem: "Não foi possivel encontrar o chamado."})

        const [rows] = db.query("SELECT * FROM chamado WHERE id = ? OR assunto LIKE '% ? %'", [busca, busca])

        if(!rows.affecteRows)
            return req.status(400).json({status: false, mensagem:"Erro! Não foi possível listar o chamado."})

        return res.status(201).json({})
    }
}


export const listarChamados{req, res} = (req, res) => {
    try {

        const sql = "SELECT assunto, descricao, status, categoria_id, prioridade , solicitante_id, tecnico_id, data_abertura, status FROM chamados order by id desc";
        const db.query(sql, [])
    }catch(error) {
        return res.status(500).json({
            status:false,
            message: "Erro interno",
            })
    }
}

