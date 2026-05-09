-- Habilitar extensión para UUIDs y encriptación
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum para roles
CREATE TYPE tipo_rol_enum AS ENUM ('paciente', 'medico', 'admin');

-- Tabla de Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_rol tipo_rol_enum NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    "2FA_enabled" BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Médicos
CREATE TABLE medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cedula_profesional VARCHAR(50) UNIQUE NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    tarifa_consulta DECIMAL(10, 2) NOT NULL,
    e_firma_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Pacientes
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fecha_nacimiento DATE NOT NULL,
    genero VARCHAR(20),
    telefono VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enum para estado de citas
CREATE TYPE estado_cita_enum AS ENUM ('agendada', 'pagada', 'en_curso', 'finalizada', 'cancelada');

-- Tabla de Citas
CREATE TABLE citas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    fecha_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_hora_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    estado estado_cita_enum DEFAULT 'agendada',
    url_videollamada VARCHAR(255),
    precio DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Expediente Clínico (ECE)
CREATE TABLE expediente_clinico_ece (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    cita_id UUID REFERENCES citas(id) ON DELETE SET NULL,
    formato_SOAP_subjetivo TEXT,
    formato_SOAP_objetivo TEXT,
    formato_SOAP_analisis TEXT,
    formato_SOAP_plan TEXT,
    diagnostico_CIE10 VARCHAR(255),
    -- Campo encriptado usando pgcrypto (AES-256)
    notas_encriptadas BYTEA, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Recetas
CREATE TABLE recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cita_id UUID NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    medicamentos_json JSONB NOT NULL,
    firma_medico_hash VARCHAR(255) NOT NULL,
    codigo_qr_verificacion VARCHAR(255) UNIQUE NOT NULL,
    enviada_a_farmacia BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enum para estado de pagos
CREATE TYPE estado_pago_enum AS ENUM ('retenido', 'cobrado', 'reembolsado');

-- Tabla de Pagos
CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cita_id UUID NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
    stripe_transaction_id VARCHAR(255) UNIQUE NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    estado estado_pago_enum DEFAULT 'retenido',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_medicos_modtime BEFORE UPDATE ON medicos FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_pacientes_modtime BEFORE UPDATE ON pacientes FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_citas_modtime BEFORE UPDATE ON citas FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_ece_modtime BEFORE UPDATE ON expediente_clinico_ece FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_recetas_modtime BEFORE UPDATE ON recetas FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_pagos_modtime BEFORE UPDATE ON pagos FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
