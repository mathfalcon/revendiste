# Sistema de Verificación de Identidad

## Resumen General

El sistema de verificación de identidad de Revendiste utiliza **AWS Rekognition** para verificar que los usuarios son quienes dicen ser. El proceso consta de tres pasos principales:

1. **Registro de documento**: El usuario ingresa su tipo y número de documento
2. **Verificación del documento**: El usuario sube una foto de su documento de identidad
3. **Verificación facial (Liveness)**: El usuario completa una verificación en vivo con su cámara

---

## Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Backend      │────▶│ AWS Rekognition │
│  (React/Vite)   │     │   (TSOA/Node)   │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Cloudflare R2  │
                        │   (Almacén)     │
                        └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   PostgreSQL    │
                        │    (RDS)        │
                        └─────────────────┘
```

### Servicios AWS Utilizados

| Servicio | Propósito |
|----------|-----------|
| **Rekognition DetectText** | OCR para extraer número de documento de la imagen |
| **Rekognition DetectFaces** | Detectar y validar la calidad del rostro en el documento |
| **Rekognition CreateFaceLivenessSession** | Crear sesión de verificación facial en vivo |
| **Rekognition GetFaceLivenessSessionResults** | Obtener resultados de la verificación liveness |
| **Rekognition CompareFaces** | Comparar rostro del documento con rostro de liveness |

---

## Flujo de Verificación

### Paso 1: Registro de Documento

```typescript
POST /api/identity-verification/initiate
Body: {
  documentType: 'ci_uy' | 'dni_ar' | 'passport',
  documentNumber: string,
  documentCountry?: string  // Requerido para pasaportes
}
```

**Validaciones:**
- CI Uruguay: Validación de dígito verificador (algoritmo oficial)
- DNI Argentina: Formato 7-8 dígitos
- Pasaporte: Requiere país de emisión

**Verificación de duplicados:**
- Se verifica que el documento no esté ya registrado por otro usuario

### Paso 2: Verificación del Documento

```typescript
POST /api/identity-verification/verify-document
Content-Type: multipart/form-data
Body: {
  document: File (imagen del documento),
  documentType: string
}
```

**Procesamiento:**
1. **Redimensionamiento**: Imágenes mayores a 1920px son redimensionadas
2. **Compresión**: JPEG con calidad 85% usando mozjpeg
3. **OCR (DetectText)**: Extracción del número de documento
4. **Detección de rostros (DetectFaces)**: Validación de presencia y calidad del rostro
5. **Almacenamiento**: Imagen guardada en R2 (bucket privado)

**Validaciones:**
- El número extraído debe coincidir con el registrado en paso 1
- Debe detectarse exactamente 1 rostro (2 para pasaportes, por la marca de agua)
- Calidad mínima del rostro (brillo y nitidez)

### Paso 3: Verificación Facial (Liveness)

#### 3a. Crear Sesión de Liveness

```typescript
POST /api/identity-verification/start-liveness
Response: {
  sessionId: string,
  region: string,
  expiresInSeconds: number,
  attemptsRemaining: number
}
```

**Configuración de sesión:**
```typescript
CreateFaceLivenessSessionCommand({
  Settings: {
    AuditImagesLimit: 4,  // Máximo de imágenes de auditoría
    ChallengePreferences: [{
      Type: 'FACE_MOVEMENT_CHALLENGE'  // Tipo de desafío
    }]
  }
})
```

#### 3b. Verificar Resultados

```typescript
POST /api/identity-verification/verify-liveness
Body: { sessionId: string }
Response: {
  verified: boolean,
  status: 'completed' | 'pending' | 'requires_manual_review' | 'failed',
  message?: string,
  canRetry?: boolean,
  retriesRemaining?: number
}
```

**Procesamiento:**
1. Obtener resultados de AWS (GetFaceLivenessSessionResults)
2. Comparar rostro de liveness con rostro del documento (CompareFaces)
3. Almacenar imágenes de referencia y auditoría en R2
4. Determinar resultado basado en thresholds

---

## Thresholds de Confianza

### Constantes del Sistema

```typescript
const THRESHOLDS = {
  /** Face similarity >= 95% auto-aprueba */
  FACE_MATCH_AUTO_APPROVE: 95,
  
  /** Face similarity >= 80% va a revisión manual, < 80% falla */
  FACE_MATCH_MANUAL_REVIEW: 80,
  
  /** Liveness confidence >= 95% auto-aprueba */
  LIVENESS_AUTO_APPROVE: 95,
  
  /** Liveness >= 90% permite reintento (si face match OK y hay intentos) */
  LIVENESS_RETRY_THRESHOLD: 90,
  
  /** Confianza mínima para detección de texto */
  TEXT_DETECTION: 95,
  
  /** Calidad mínima de imagen del documento */
  DOCUMENT_QUALITY: 40,
};
```

### Matriz de Decisiones

| Liveness | Face Match | Resultado |
|----------|------------|-----------|
| ≥ 95% | ≥ 95% | ✅ **Auto-aprobado** |
| ≥ 95% | 80-95% | ⚠️ Revisión manual |
| ≥ 95% | < 80% | ❌ Fallido |
| 90-95% | ≥ 80% | 🔄 Puede reintentar (si hay intentos) |
| 90-95% | < 80% | ❌ Fallido |
| < 90% | cualquier | ⚠️ Revisión manual |

### Límites de Intentos

```typescript
/** Máximo de intentos por usuario (cada sesión cuesta ~$0.40 USD) */
const MAX_VERIFICATION_ATTEMPTS = 5;

/** Tiempo de expiración de sesión (AWS expira en ~5 min, usamos 4 min) */
const SESSION_EXPIRY_MS = 4 * 60 * 1000;
```

---

## Almacenamiento de Datos

### Cloudflare R2 (Bucket Privado)

**Estructura de archivos:**
```
private/users/{userId}/identity-documents/
├── document-{timestamp}.jpg           # Imagen del documento
├── liveness-reference-{timestamp}.jpg # Imagen de referencia de liveness
├── liveness-audit-{timestamp}-0.jpg   # Imagen de auditoría 1
├── liveness-audit-{timestamp}-1.jpg   # Imagen de auditoría 2
├── liveness-audit-{timestamp}-2.jpg   # Imagen de auditoría 3
└── liveness-audit-{timestamp}-3.jpg   # Imagen de auditoría 4
```

**Acceso:**
- Solo accesible mediante URLs firmadas (presigned URLs)
- Expiración por defecto: 1 hora
- Solo administradores pueden generar URLs para revisión

### Base de Datos PostgreSQL

**Campos en tabla `users`:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `document_type` | varchar | Tipo: 'ci_uy', 'dni_ar', 'passport' |
| `document_number` | varchar | Número de documento |
| `document_country` | varchar | País (ISO 3166-1 alpha-3) |
| `document_image_path` | varchar | Ruta en R2 de la imagen del documento |
| `document_verified` | boolean | Si la verificación fue exitosa |
| `document_verified_at` | timestamp | Fecha de verificación exitosa |
| `verification_status` | varchar | 'pending', 'completed', 'requires_manual_review', 'failed' |
| `verification_attempts` | integer | Número de intentos de liveness |
| `verification_session_id` | varchar | ID de sesión de AWS Rekognition |
| `verification_session_created_at` | timestamp | Cuándo se creó la sesión |
| `verification_confidence_scores` | jsonb | Scores de confianza |
| `verification_metadata` | jsonb | Metadata adicional |
| `manual_review_reason` | varchar | Razón de revisión manual |

**Estructura de `verification_confidence_scores`:**
```json
{
  "textDetection": 98.5,
  "documentFaceQuality": 87.3,
  "liveness": 96.2,
  "faceMatch": 97.8
}
```

**Estructura de `verification_metadata`:**
```json
{
  "livenessSessionId": "abc-123",
  "livenessReferenceImagePath": "private/users/.../liveness-reference-123.jpg",
  "livenessAuditImagePaths": [
    "private/users/.../liveness-audit-123-0.jpg",
    "private/users/.../liveness-audit-123-1.jpg"
  ],
  "livenessProcessedAt": "2024-01-15T10:30:00Z",
  "sessionId": "abc-123",
  "processedAt": "2024-01-15T10:30:00Z",
  "status": "completed"
}
```

---

## Seguridad

### Cifrado

| Capa | Tipo de Cifrado | Implementación |
|------|-----------------|----------------|
| **En tránsito** | TLS 1.3 | Cloudflare → Backend → AWS |
| **Base de datos** | AES-256 | AWS RDS con KMS |
| **Almacenamiento R2** | AES-256-GCM | Cloudflare R2 (automático) |
| **Imágenes en ECR** | AES-256 | AWS ECR encryption |

**Nota importante:** El cifrado es a nivel de infraestructura, no a nivel de aplicación. Cloudflare R2 y AWS RDS cifran automáticamente los datos en reposo.

### Protección de Datos Sensibles

1. **Imágenes de documentos**: Almacenadas en bucket privado, solo accesibles con URLs firmadas
2. **Scores de liveness**: Solo visibles para administradores, nunca expuestos al usuario
3. **Metadata de verificación**: Almacenada en JSONB, no indexada para búsquedas

### Retención de Datos

| Tipo de Dato | Retención | Justificación |
|--------------|-----------|---------------|
| Imagen del documento | Indefinida | Requerido para disputas y auditoría |
| Imágenes de liveness | Indefinida | Requerido para revisión manual y auditoría |
| Metadata de verificación | Indefinida | Registro de auditoría |
| Scores de confianza | Indefinida | Análisis y mejora del sistema |

**IMPORTANTE:** Actualmente NO eliminamos las imágenes de verificación facial después del proceso. Se mantienen para:
- Revisión manual de casos borderline
- Auditoría de seguridad
- Investigación de fraude
- Disputas legales

---

## Flujo de Revisión Manual

### Cuándo se activa

1. **Face match entre 80-95%**: El rostro coincide parcialmente
2. **Liveness < 90%**: Confianza baja en que es una persona real
3. **Baja calidad de documento**: OCR o rostro con baja confianza
4. **Múltiples intentos fallidos**: 3+ intentos sin éxito

### Panel de Administración

```typescript
GET /api/admin/identity-verification/verifications
Query: { status: 'requires_manual_review', page: number, limit: number }

GET /api/admin/identity-verification/verifications/{userId}/images
Response: {
  documentImage: { url: string, path: string },
  livenessReference: { url: string, path: string } | null,
  auditImages: Array<{ url: string, path: string }>
}

POST /api/admin/identity-verification/verifications/{userId}/approve
POST /api/admin/identity-verification/verifications/{userId}/reject
Body: { reason?: string }
```

### Información Disponible para Revisión

- Imagen del documento de identidad
- Imagen de referencia del liveness
- Hasta 4 imágenes de auditoría del liveness
- Scores de confianza (liveness, face match, OCR)
- Razón de revisión manual
- Historial de intentos

---

## Costos Estimados

### AWS Rekognition

| Operación | Costo | Por Verificación |
|-----------|-------|------------------|
| DetectText | $0.001 | 1 llamada |
| DetectFaces | $0.001 | 1 llamada |
| CreateFaceLivenessSession | $0.40 | 1 sesión |
| GetFaceLivenessSessionResults | Incluido | - |
| CompareFaces | $0.001 | 1 llamada |

**Costo promedio por verificación exitosa:** ~$0.40 USD

### Cloudflare R2

| Recurso | Costo |
|---------|-------|
| Almacenamiento | $0.015/GB/mes |
| Escrituras | $4.50/millón |
| Lecturas | $0.36/millón |
| Egress | Gratis |

**Costo por verificación:** ~$0.0001 USD (despreciable)

---

## Manejo de Errores

### Errores Comunes

| Error | Causa | Solución Usuario |
|-------|-------|------------------|
| `DOCUMENT_NUMBER_MISMATCH` | OCR no coincide con número ingresado | Verificar número y tomar foto más clara |
| `FACE_NOT_DETECTED_IN_DOCUMENT` | No se detectó rostro en documento | Tomar foto con rostro visible |
| `MAX_ATTEMPTS_EXCEEDED` | 5 intentos fallidos | Contactar soporte |
| `FACE_MISMATCH` | Rostro no coincide con documento | Verificar que es el documento correcto |

### Mensajes al Usuario

**IMPORTANTE:** Nunca revelamos scores de confianza al usuario. Los mensajes son genéricos:

```typescript
// ❌ INCORRECTO - Revela información sensible
"Tu puntuación de liveness fue 87.5%"

// ✅ CORRECTO - Mensaje genérico
"La verificación no fue exitosa. Por favor, asegurate de tener buena luz."
```

---

## Documentos Soportados

### CI Uruguay (ci_uy)

- **Formato**: 7-8 dígitos con dígito verificador
- **Validación**: Algoritmo oficial de dígito verificador
- **Normalización**: Se eliminan puntos y guiones

### DNI Argentina (dni_ar)

- **Formato**: 7-8 dígitos
- **Validación**: Solo formato numérico
- **Normalización**: Se eliminan puntos

### Pasaporte (passport)

- **Formato**: Alfanumérico (varía por país)
- **Validación**: Búsqueda del número en texto OCR
- **Requiere**: País de emisión
- **Nota**: Permite 2 rostros (foto principal + marca de agua)

---

## Consideraciones de Rendimiento

### Procesamiento de Imágenes

```typescript
const MAX_IMAGE_DIMENSION = 1920;  // Máximo ancho/alto
const JPEG_QUALITY = 85;          // Calidad de compresión

// Pipeline de procesamiento
sharp(imageBuffer)
  .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
    fit: 'inside',
    withoutEnlargement: true
  })
  .jpeg({ quality: 85, mozjpeg: true })
  .toBuffer();
```

### Operaciones Paralelas

El paso 2 ejecuta en paralelo:
1. Upload a R2
2. DetectText (OCR)
3. DetectFaces

Tiempo típico: ~2-3 segundos

### Reutilización de Sesiones

- Las sesiones de liveness se reutilizan si no han expirado (< 4 min)
- Se verifica el estado con AWS antes de crear nueva sesión
- Previene cobros duplicados por sesiones no utilizadas

---

## Logs y Monitoreo

### Eventos Registrados

```typescript
// Ejemplo de logs estructurados
logger.info('[STEP 1/3] Initiating identity verification', {
  userId,
  documentType,
  documentCountry
});

logger.info('[STEP 3/3] ===== VERIFICATION COMPLETE =====', {
  userId,
  finalStatus: status,
  documentType,
  confidenceScores: {
    faceMatch: faceSimilarity.toFixed(2),
    liveness: livenessConfidence.toFixed(2)
  },
  reviewReason: reviewReason || 'N/A'
});
```

### Métricas Importantes

- Tasa de aprobación automática
- Tasa de revisión manual
- Tasa de fallo
- Tiempo promedio de verificación
- Intentos promedio por usuario exitoso

---

## Cumplimiento Legal

### GDPR / Ley 18.331 (Uruguay)

- **Consentimiento**: Usuario debe aceptar términos antes de iniciar
- **Derecho de acceso**: Usuario puede solicitar sus datos
- **Derecho de eliminación**: Proceso manual (contactar soporte)
- **Portabilidad**: Exportación de datos en JSON

### Biometría

- Las imágenes faciales se consideran datos biométricos
- Se almacenan con cifrado en reposo
- Acceso restringido a administradores autorizados
- No se comparten con terceros (excepto AWS para procesamiento)

---

## Referencias

- [AWS Rekognition Face Liveness](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html)
- [AWS Amplify FaceLivenessDetector](https://ui.docs.amplify.aws/react/connected-components/liveness)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Ley 18.331 - Protección de Datos Personales](https://www.impo.com.uy/bases/leyes/18331-2008)
