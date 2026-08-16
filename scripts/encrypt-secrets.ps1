# encrypt-secrets.ps1
# Cifra .env.local + la llave PEM en un archivo protegido por contraseña.
# Ejecutar UNA vez para crear el backup; volver a ejecutar si cambian las credenciales.
#
# USO:
#   .\scripts\encrypt-secrets.ps1
#
# REQUISITO: OpenSSL instalado (viene incluido con Git for Windows)

param(
    [string]$OutputDir = "$env:USERPROFILE\Desktop"
)

$timestamp  = Get-Date -Format "yyyy-MM-dd"
$outputFile = Join-Path $OutputDir "leads-secrets-${timestamp}.enc"

# Archivos a proteger
$envFile  = Join-Path $PSScriptRoot "..\\.env.local"
$pemFile  = Join-Path $env:USERPROFILE "Desktop\\LEADS-GMM-PRIVATE-KEY.pem"

# Validar que existen
if (-not (Test-Path $envFile))  { Write-Error ".env.local no encontrado en $envFile"; exit 1 }
if (-not (Test-Path $pemFile))  { Write-Error "PEM no encontrado en $pemFile"; exit 1 }

# Crear archivo temporal combinado
$tempBundle = [System.IO.Path]::GetTempFileName()
try {
    $envContent = Get-Content $envFile -Raw
    $pemContent = Get-Content $pemFile -Raw

    $bundle = @"
=== .env.local (${timestamp}) ===
$envContent

=== LEADS-GMM-PRIVATE-KEY.pem (${timestamp}) ===
$pemContent
"@
    Set-Content -Path $tempBundle -Value $bundle -Encoding UTF8

    # Pedir contraseña
    Write-Host ""
    Write-Host "Elige una contraseña fuerte para proteger este archivo." -ForegroundColor Cyan
    Write-Host "IMPORTANTE: memoriza esta contraseña o escríbela en un lugar físico seguro." -ForegroundColor Yellow
    Write-Host ""
    $pass1 = Read-Host "Contraseña" -AsSecureString
    $pass2 = Read-Host "Confirma contraseña" -AsSecureString

    $p1 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pass1))
    $p2 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pass2))

    if ($p1 -ne $p2) { Write-Error "Las contraseñas no coinciden."; exit 1 }
    if ($p1.Length -lt 12) { Write-Error "La contraseña debe tener al menos 12 caracteres."; exit 1 }

    # Cifrar con openssl AES-256-CBC
    $opensslCmd = Get-Command openssl -ErrorAction SilentlyContinue
    $opensslExe = if ($opensslCmd) { $opensslCmd.Source } else { $null }
    if (-not $opensslExe) {
        $candidates = @(
            "C:\Program Files\Git\mingw64\bin\openssl.exe",
            "C:\Program Files\Git\usr\bin\openssl.exe",
            "$env:LOCALAPPDATA\Programs\Git\mingw64\bin\openssl.exe",
            "$env:LOCALAPPDATA\Programs\Git\usr\bin\openssl.exe"
        )
        foreach ($c in $candidates) {
            if (Test-Path $c) { $opensslExe = $c; break }
        }
    }
    if (-not $opensslExe -or -not (Test-Path $opensslExe)) {
        Write-Error "openssl no encontrado. Instala Git for Windows."
        exit 1
    }

    & $opensslExe enc -aes-256-cbc -pbkdf2 -iter 200000 `
        -in $tempBundle `
        -out $outputFile `
        -pass "pass:$p1" 2>&1

    if ($LASTEXITCODE -ne 0) { Write-Error "Error al cifrar."; exit 1 }

    Write-Host ""
    Write-Host "Archivo cifrado creado:" -ForegroundColor Green
    Write-Host "  $outputFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Cyan
    Write-Host "  1. Sube este archivo a tu Google Drive PERSONAL (no el corporativo)."
    Write-Host "  2. Guarda también una copia en un USB que tengas en casa."
    Write-Host "  3. Nunca lo envíes por email ni WhatsApp."
    Write-Host ""
    Write-Host "Para descifrarlo más adelante:"
    Write-Host "  openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in leads-secrets-FECHA.enc -out secrets.txt"

} finally {
    if (Test-Path $tempBundle) { Remove-Item $tempBundle -Force }
}
