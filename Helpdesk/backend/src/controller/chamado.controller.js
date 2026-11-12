export const abreChamado{req, res} = (req, res) => {
    const campos = req.body

    
}

export const alteraChamado{req, res} = (req, res) => {

}

export const listarChamado{req, res} = (req, res) => {
    try {

        const sql = "INSERT INTO chamado (assunto, descricao, status, categoria_id, prioridade , solicitante_id, tecnico_id, data_abertura, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
    }catch(error) {
        return res.status(500).json({
            status:false,
            message: "Erro interno",
            })
    }
}

