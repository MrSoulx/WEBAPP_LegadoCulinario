-- ============================================================
-- LEGADO CULINARIO - ESQUEMA SUPABASE (con Auth nativo)
-- ============================================================
-- Requisito: Tener Authentication habilitado en Supabase
-- (Settings > Authentication > Enable Email Auth)
--
-- MODELO DE PROPIEDAD:
-- - Cada receta pertenece a quien la creó (created_by → auth.users)
-- - Solo el dueño puede EDITAR o ELIMINAR su receta
-- - super_admin puede editar/eliminar cualquier receta
-- - Cualquier admin autenticado puede CREAR y LEER recetas
-- - El público puede LEER recetas y feedback
-- ============================================================

-- ============================================================
-- TABLA: regiones
-- ============================================================
CREATE TABLE IF NOT EXISTS regiones (
    id SERIAL PRIMARY KEY,
    name_regiones TEXT NOT NULL
);

-- ============================================================
-- TABLA: provincias
-- ============================================================
CREATE TABLE IF NOT EXISTS provincias (
    id SERIAL PRIMARY KEY,
    name_provincias TEXT NOT NULL,
    region_id INTEGER REFERENCES regiones(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLA: users (perfiles de administradores)
-- NOTA: La autenticación la maneja Supabase Auth (auth.users).
--       Esta tabla almacena SOLO el perfil adicional (nombre, rol).
--       El id se sincroniza automáticamente con auth.users vía trigger.
-- ============================================================
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    correo TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor'
        CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
    avatar TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas por correo
CREATE INDEX IF NOT EXISTS idx_users_correo ON users(correo);

-- ============================================================
-- TRIGGER: Crear perfil automáticamente al registrarse
-- Cada vez que se crea un usuario en auth.users (via Supabase Auth),
-- se inserta automáticamente su perfil en la tabla users.
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.users (id, name, correo, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'role', 'editor')
    );
    RETURN NEW;
END;
$$;

-- Eliminar trigger si existe para recrearlo limpio
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ⚠️ PRIMER ADMIN: Después de ejecutar el schema, registra un usuario
--    desde el frontend y luego promuévelo a super_admin manualmente:
--
--    UPDATE public.users
--    SET role = 'super_admin'
--    WHERE correo = 'tu@email.com';

-- ============================================================
-- TABLA: recetas
-- ============================================================
CREATE TABLE IF NOT EXISTS recetas (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    ingredientes TEXT NOT NULL,
    instrucciones TEXT NOT NULL,
    region_id INTEGER REFERENCES regiones(id) ON DELETE SET NULL,
    provincias_id INTEGER REFERENCES provincias(id) ON DELETE SET NULL,
    url_foto TEXT,
    public_id TEXT,
    url_video TEXT,
    video_public_id TEXT,
    tiempo_preparacion INTEGER,
    porciones INTEGER,
    como_servir TEXT,
    imagenes JSONB DEFAULT '[]'::jsonb,
    vistas INTEGER DEFAULT 0,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: feedback (comentarios y valoraciones)
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
    id BIGSERIAL PRIMARY KEY,
    recetas_id BIGINT NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    correo TEXT NOT NULL,
    comentario TEXT,
    puntuacion INTEGER NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCIÓN RPC: increment_receta_vistas
-- ============================================================
CREATE OR REPLACE FUNCTION increment_receta_vistas(receta_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE recetas
    SET vistas = COALESCE(vistas, 0) + 1
    WHERE id = receta_id;
END;
$$;

-- ============================================================
-- DATOS INICIALES: Regiones
-- ============================================================
INSERT INTO regiones (id, name_regiones) VALUES
    (1, 'Costa'),
    (2, 'Sierra'),
    (3, 'Oriente'),
    (4, 'Insular')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DATOS INICIALES: Provincias
-- ============================================================
INSERT INTO provincias (name_provincias, region_id) VALUES
    -- Costa (region_id = 1)
    ('Esmeraldas', 1),
    ('Manabí', 1),
    ('Santo Domingo de los Tsáchilas', 1),
    ('Los Ríos', 1),
    ('Guayas', 1),
    ('Santa Elena', 1),
    ('El Oro', 1),
    -- Sierra (region_id = 2)
    ('Carchi', 2),
    ('Imbabura', 2),
    ('Pichincha', 2),
    ('Cotopaxi', 2),
    ('Tungurahua', 2),
    ('Bolívar', 2),
    ('Chimborazo', 2),
    ('Cañar', 2),
    ('Azuay', 2),
    ('Loja', 2),
    -- Oriente (region_id = 3)
    ('Sucumbíos', 3),
    ('Napo', 3),
    ('Orellana', 3),
    ('Pastaza', 3),
    ('Morona Santiago', 3),
    ('Zamora Chinchipe', 3),
    -- Insular (region_id = 4)
    ('Galápagos', 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_recetas_region_id ON recetas(region_id);
CREATE INDEX IF NOT EXISTS idx_recetas_provincias_id ON recetas(provincias_id);
CREATE INDEX IF NOT EXISTS idx_recetas_vistas ON recetas(vistas DESC);
CREATE INDEX IF NOT EXISTS idx_recetas_created_by ON recetas(created_by);
CREATE INDEX IF NOT EXISTS idx_feedback_recetas_id ON feedback(recetas_id);
CREATE INDEX IF NOT EXISTS idx_provincias_region_id ON provincias(region_id);

-- ============================================================
-- TRIGGER: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_recetas_updated_at
    BEFORE UPDATE ON recetas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- 1. users - Solo el propio usuario o service_role puede ver/editar
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON users;
CREATE POLICY "Usuarios ven su propio perfil" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios editan su propio perfil" ON users;
CREATE POLICY "Usuarios editan su propio perfil" ON users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role full access" ON users;
CREATE POLICY "Service role full access" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- 2. recetas - Lectura pública, escritura solo admins autenticados
-- Cada usuario solo puede editar/borrar sus propias recetas (created_by).
-- super_admin puede editar/borrar cualquier receta.
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública recetas" ON recetas;
CREATE POLICY "Lectura pública recetas" ON recetas
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserción admins recetas" ON recetas;
CREATE POLICY "Inserción admins recetas" ON recetas
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND created_by = auth.uid()
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'editor'))
    );

DROP POLICY IF EXISTS "Actualización dueño recetas" ON recetas;
CREATE POLICY "Actualización dueño recetas" ON recetas
    FOR UPDATE USING (
        auth.role() = 'authenticated'
        AND (
            created_by = auth.uid()
            OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Eliminación dueño recetas" ON recetas;
CREATE POLICY "Eliminación dueño recetas" ON recetas
    FOR DELETE USING (
        auth.role() = 'authenticated'
        AND (
            created_by = auth.uid()
            OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
        )
    );

-- 3. regiones y provincias - Lectura pública
ALTER TABLE regiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE provincias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública regiones" ON regiones;
CREATE POLICY "Lectura pública regiones" ON regiones
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura pública provincias" ON provincias;
CREATE POLICY "Lectura pública provincias" ON provincias
    FOR SELECT USING (true);

-- 4. feedback - Lectura pública, inserción pública, solo admins borran
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública feedback" ON feedback;
CREATE POLICY "Lectura pública feedback" ON feedback
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserción pública feedback" ON feedback;
CREATE POLICY "Inserción pública feedback" ON feedback
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Eliminación admins feedback" ON feedback;
CREATE POLICY "Eliminación admins feedback" ON feedback
    FOR DELETE USING (
        auth.role() = 'authenticated'
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );
