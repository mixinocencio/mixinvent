-- =========================================
--   SISTEMA DE GESTÃO DE ATIVOS DE TI
--   Estrutura do Banco de Dados - PostgreSQL
-- =========================================

-- ======= Tipos ENUM =======
CREATE TYPE equipamento_status AS ENUM ('em_uso', 'em_manutencao', 'desativado', 'estoque');
CREATE TYPE usuario_role AS ENUM ('admin', 'gestor', 'analista', 'diretoria');
CREATE TYPE movimentacao_tipo AS ENUM ('entrada', 'saida');
CREATE TYPE contrato_tipo AS ENUM ('equipamento', 'outsourcing', 'software', 'outros');

-- ======= Empresas =======
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    matriz BOOLEAN DEFAULT FALSE,
    endereco TEXT,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======= Centros de Custos =======
CREATE TABLE centros_custos (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL
);

-- ======= Fornecedores =======
CREATE TABLE fornecedores (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(18),
    contato VARCHAR(100),
    servicos VARCHAR(255)
);

-- ======= Colaboradores =======
CREATE TABLE colaboradores (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    rgm VARCHAR(30),
    setor VARCHAR(100),
    cargo VARCHAR(100),
    email VARCHAR(120),
    telefone VARCHAR(40),
    data_admissao DATE,
    status VARCHAR(20) DEFAULT 'ativo'
);

-- ======= Usuários (para login e permissões) =======
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    senha_hash VARCHAR(256) NOT NULL,
    role usuario_role NOT NULL DEFAULT 'analista'
);

-- ======= Equipamentos =======
CREATE TABLE equipamentos (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    marca VARCHAR(80),
    modelo VARCHAR(80),
    numero_serie VARCHAR(80) UNIQUE,
    patrimonio VARCHAR(80) UNIQUE,
    data_aquisicao DATE,
    valor_compra NUMERIC(12,2),
    status equipamento_status NOT NULL DEFAULT 'em_uso',
    localizacao_atual VARCHAR(150),
    colaborador_id INT REFERENCES colaboradores(id),
    especificacoes JSONB,
    data_ultima_manutencao DATE,
    custo_total_manutencao NUMERIC(12,2) DEFAULT 0
);

-- ======= Histórico de Manutenções =======
CREATE TABLE historico_manutencoes (
    id SERIAL PRIMARY KEY,
    equipamento_id INT NOT NULL REFERENCES equipamentos(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    tipo VARCHAR(50),
    custo NUMERIC(12,2),
    responsavel VARCHAR(120),
    descricao TEXT
);

-- ======= Histórico de Upgrades =======
CREATE TABLE historico_upgrades (
    id SERIAL PRIMARY KEY,
    equipamento_id INT NOT NULL REFERENCES equipamentos(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    tipo VARCHAR(50),
    custo NUMERIC(12,2),
    componentes_substituidos JSONB
);

-- ======= Histórico de Alocação de Equipamentos =======
CREATE TABLE historico_alocacao (
    id SERIAL PRIMARY KEY,
    equipamento_id INT NOT NULL REFERENCES equipamentos(id) ON DELETE CASCADE,
    colaborador_id INT NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL,
    data_fim DATE
);

-- ======= Acessórios =======
CREATE TABLE acessorios (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    marca VARCHAR(80),
    modelo VARCHAR(80),
    numero_serie VARCHAR(80) UNIQUE,
    equipamento_id INT REFERENCES equipamentos(id)
);

-- ======= Softwares =======
CREATE TABLE softwares (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    versao VARCHAR(40),
    fornecedor_id INT REFERENCES fornecedores(id),
    data_expiracao DATE,
    tipo_licenca VARCHAR(50),
    chave_licenca VARCHAR(100)
);

-- ======= Parceiros =======
CREATE TABLE parceiros (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    contato VARCHAR(120)
);

-- ======= Políticas =======
CREATE TABLE politicas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    data_criacao DATE DEFAULT CURRENT_DATE
);

-- ======= Projetos =======
CREATE TABLE projetos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT
);

-- ======= Notas Fiscais =======
CREATE TABLE notas_fiscais (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(30) NOT NULL,
    data DATE NOT NULL,
    fornecedor_id INT REFERENCES fornecedores(id),
    valor_total NUMERIC(12,2),
    itens_nf JSONB
);

-- ======= Estoque e Movimentações =======
CREATE TABLE movimentacoes_estoque (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    equipamento_id INT REFERENCES equipamentos(id),
    acessorio_id INT REFERENCES acessorios(id),
    quantidade INT NOT NULL,
    tipo_movimentacao movimentacao_tipo NOT NULL,
    data_movimentacao DATE NOT NULL DEFAULT CURRENT_DATE,
    nota_fiscal_id INT REFERENCES notas_fiscais(id)
);

CREATE TABLE niveis_estoque (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    item_tipo VARCHAR(20) NOT NULL, -- 'equipamento' ou 'acessorio'
    item_id INT NOT NULL,
    quantidade INT NOT NULL
);

-- ======= Contratos =======
CREATE TABLE contratos (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresas(id),
    fornecedor_id INT REFERENCES fornecedores(id),
    tipo_contrato contrato_tipo NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    valor NUMERIC(12,2),
    periodicidade VARCHAR(30),
    termos_condicoes TEXT,
    ativos_vinculados JSONB,
    responsavel_id INT REFERENCES usuarios(id)
);

-- ======= Contábil / Depreciação =======
CREATE TABLE contabil_depreciacao (
    id SERIAL PRIMARY KEY,
    equipamento_id INT NOT NULL REFERENCES equipamentos(id) ON DELETE CASCADE,
    valor_residual NUMERIC(12,2),
    vida_util_estimada INT,
    metodo_depreciacao VARCHAR(50),
    depreciacao_acumulada NUMERIC(12,2)
);

CREATE TABLE vendas_ativos (
    id SERIAL PRIMARY KEY,
    equipamento_id INT NOT NULL REFERENCES equipamentos(id),
    data_venda DATE NOT NULL,
    valor_venda NUMERIC(12,2),
    comprador VARCHAR(150),
    ganho_perda NUMERIC(12,2)
);

-- ======= Logs de Auditoria =======
CREATE TABLE auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    acao VARCHAR(80),
    objeto VARCHAR(60),
    objeto_id INT,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    detalhes JSONB
);

-- ======= Índices & Constraints Extras (melhore conforme necessidade de consulta) =======

CREATE INDEX idx_equipamentos_colaborador ON equipamentos(colaborador_id);
CREATE INDEX idx_equipamentos_status ON equipamentos(status);
CREATE INDEX idx_movestoque_tipo ON movimentacoes_estoque(tipo_movimentacao);
CREATE INDEX idx_movestoque_data ON movimentacoes_estoque(data_movimentacao);
CREATE INDEX idx_historico_manutencao_equip ON historico_manutencoes(equipamento_id);
CREATE INDEX idx_historico_upgrades_equip ON historico_upgrades(equipamento_id);
CREATE INDEX idx_historicoaloc_equipequip ON historico_alocacao(equipamento_id);
CREATE INDEX idx_contratos_empresa ON contratos(empresa_id);
CREATE INDEX idx_colaboradores_empresa ON colaboradores(empresa_id);

-- FIM DO SCRIPT
