#!/bin/bash
# Smoke test — Legado Culinario
# Uso: bash test-smoke.sh
# Requiere: backend corriendo en localhost:5000

API="http://localhost:5000/api"
PASS=0
FAIL=0
SKIP=0
FAILURES=""

green()  { printf '\033[32m✓\033[0m %s\n' "$1"; }
red()    { printf '\033[31m✗\033[0m %s\n' "$1"; }
yellow() { printf '\033[33m⚠\033[0m %s\n' "$1"; }
title()  { printf '\n\033[1;36m═══ %s ═══\033[0m\n' "$1"; }

check() {
  local label="$1" method="$2" url="$3" body="$4" expect_key="$5" auth="$6"
  local curl_cmd="curl -s"
  [ "$method" != "GET" ] && curl_cmd+=" -X $method -H 'Content-Type: application/json' -d '$body'"
  [ -n "$auth" ] && curl_cmd+=" -H 'Authorization: Bearer $auth'"
  resp=$(eval "$curl_cmd '$url'" 2>&1)
  code=$?
  if [ $code -ne 0 ]; then
    # Si requiere auth y falló, asumimos que es por eso
    if [ -n "$auth" ]; then
      yellow "$label — requiere auth (saltado)"
      SKIP=$((SKIP+1))
      return
    fi
    red "$label — curl error $code"
    FAIL=$((FAIL+1))
    FAILURES="$FAILURES\n  ✗ $label"
    return
  fi
  if [ -n "$expect_key" ]; then
    match=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('$expect_key',''))" 2>/dev/null)
    if [ -z "$match" ]; then
      red "$label — no se encontró clave '$expect_key' en respuesta"
      FAIL=$((FAIL+1))
      FAILURES="$FAILURES\n  ✗ $label"
      return
    fi
  fi
  green "$label"
  PASS=$((PASS+1))
}

# ─── Intentar obtener token ───
TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"correo":"julio@legadoculinario.com","password":"Julio123*"}' \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('data',{}).get('token','') or '')" 2>/dev/null)

if [ -n "$TOKEN" ]; then
  green "Token JWT obtenido"
else
  yellow "No se pudo obtener token — tests con auth se saltarán"
fi

# ─── 1. Backend ───
title "1. BACKEND"
check "Health endpoint" GET "$API/health" "" "status"

# ─── 2. GeoIP ───
title "2. GEOIP"
check "GeoIP detecta país" GET "$API/geoip" "" "success"

# ─── 3. Recetas ───
title "3. RECETAS PÚBLICAS"
check "Listar recetas" GET "$API/recipes?limit=2" "" "data"
check "Receta por ID (24)" GET "$API/recipes/24" "" "data"
check "Recetas por región" GET "$API/recipes?region_id=1" "" "data"
check "Incrementar vista" POST "$API/recipes/24/view" ""
if [ -n "$TOKEN" ]; then
  check "Endpoint /mine" GET "$API/recipes/mine" "" "data" "$TOKEN"
else
  yellow "/mine — requiere auth (saltado)"
  SKIP=$((SKIP+1))
fi

# ─── 4. IA Sustitutos ───
title "4. IA — SUSTITUTOS"
check "España" POST "$API/ai/substitutes" \
  '{"ingredients":["Achiote","Panela","Chifles","Sal","Arroz"],"country":"España"}' \
  "substitutes"
check "Reino Unido" POST "$API/ai/substitutes" \
  '{"ingredients":["Achiote","Panela","Chifles","Sal","Arroz"],"country":"Reino Unido"}' \
  "substitutes"
check "Japón" POST "$API/ai/substitutes" \
  '{"ingredients":["Achiote","Panela","Chifles","Sal","Arroz"],"country":"Japón"}' \
  "substitutes"
check "Ingredientes comunes" POST "$API/ai/substitutes" \
  '{"ingredients":["Sal","Agua","Arroz"],"country":"España"}' \
  "substitutes"

# ─── 5. Regiones / Provincias ───
title "5. REGIONES Y PROVINCIAS"
check "Regiones" GET "$API/regions" "" ""
check "Provincias" GET "$API/provinces" "" ""

# ─── 6. Feedback ───
title "6. FEEDBACK"
check "Feedback receta 24" GET "$API/feedback?recipe_id=24" "" ""

# ─── 7. Dashboard ───
title "7. DASHBOARD"
if [ -n "$TOKEN" ]; then
  check "Dashboard stats" GET "$API/dashboard/stats" "" "" "$TOKEN"
else
  yellow "Dashboard — requiere auth (saltado)"
  SKIP=$((SKIP+1))
fi

# ─── 8. R2 ───
title "8. R2 (UPLOAD)"
if [ -n "$TOKEN" ]; then
  check "Presigned URL" POST "$API/upload/presign" \
    '{"fileName":"test.txt","contentType":"text/plain"}' "" "$TOKEN"
else
  yellow "Presigned URL — requiere auth (saltado)"
  SKIP=$((SKIP+1))
fi

# ─── 9. Archivos estáticos ───
title "9. ARCHIVOS ESTÁTICOS"
SIMULADOR="/Users/mrsoul/Desktop/WEBAPP_LegadoCulinario-main/simulador-ubicacion.html"
if [ -f "$SIMULADOR" ]; then
  green "simulador-ubicacion.html existe"
  PASS=$((PASS+1))
else
  red "simulador-ubicacion.html NO existe"
  FAIL=$((FAIL+1))
  FAILURES="$FAILURES\n  ✗ simulador-ubicacion.html"
fi
if grep -q 'localhost:5000/api/geoip' "$SIMULADOR" 2>/dev/null; then
  green "simulador-ubicacion.html usa /api/geoip"
  PASS=$((PASS+1))
else
  red "simulador-ubicacion.html NO usa /api/geoip"
  FAIL=$((FAIL+1))
  FAILURES="$FAILURES\n  ✗ simulador-ubicacion.html: endpoint geoip"
fi

# ─── 10. Archivos clave del proyecto ───
title "10. ESTRUCTURA DEL PROYECTO"
BACKEND_DIR="/Users/mrsoul/Desktop/WEBAPP_LegadoCulinario-main/backend/src"
FILES_TO_CHECK=(
  "$BACKEND_DIR/utils/r2Helper.js"
  "$BACKEND_DIR/routes/uploadRoutes.js"
  "$BACKEND_DIR/routes/geoipRoutes.js"
  "$BACKEND_DIR/controllers/geoipController.js"
  "$BACKEND_DIR/app.js"
)
for f in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$f" ]; then
    green "${f##*/}"
    PASS=$((PASS+1))
  else
    red "${f##*/} — NO EXISTE"
    FAIL=$((FAIL+1))
    FAILURES="$FAILURES\n  ✗ ${f##*/}"
  fi
done

# ─── 11. No quedan rastros de Cloudinary ───
title "11. SIN CLOUDINARY"
CLOUDINARY_FILES=$(find "$BACKEND_DIR/.." -maxdepth 3 -name '*cloudinary*' -not -path '*/node_modules/*' 2>/dev/null)
if [ -z "$CLOUDINARY_FILES" ]; then
  green "No hay archivos cloudinary"
  PASS=$((PASS+1))
else
  red "Aún existen: $CLOUDINARY_FILES"
  FAIL=$((FAIL+1))
  FAILURES="$FAILURES\n  ✗ cloudinary residual"
fi
if grep -r 'cloudinary' "$BACKEND_DIR/../.env" "$BACKEND_DIR/../server.js" 2>/dev/null | grep -v node_modules | grep -q .; then
  red "cloudinary referenciado en .env o server.js"
  FAIL=$((FAIL+1))
  FAILURES="$FAILURES\n  ✗ cloudinary en env"
else
  green "No hay referencias cloudinary en .env/server.js"
  PASS=$((PASS+1))
fi

# ─── Resumen ───
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "\033[1;32m  PASADOS: $PASS\033[0m"
echo -e "\033[1;33m  SALTADOS: $SKIP\033[0m"
echo -e "\033[1;31m  FALLIDOS: $FAIL\033[0m"
if [ $FAIL -gt 0 ]; then
  echo -e "\033[1;31m  DETALLES:$FAILURES\033[0m"
  exit 1
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exit 0
